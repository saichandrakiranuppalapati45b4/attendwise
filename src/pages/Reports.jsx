import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Edit2, X, Check, Search } from 'lucide-react';

const Reports = () => {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [subjectStats, setSubjectStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit state
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editForm, setEditForm] = useState({ past_held: 0, past_attended: 0 });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [user]);

    const fetchReportData = async () => {
        setIsLoading(true);
        try {
            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData) setProfile(profileData);

            // Fetch Subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .eq('user_id', user.id);

            if (subjectsError) throw subjectsError;

            // Fetch Attendance
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['present', 'absent']);

            if (attendanceError) throw attendanceError;

            // Fetch Timetable to calculate future periods
            const { data: timetableData, error: timetableError } = await supabase
                .from('timetable')
                .select('*')
                .eq('user_id', user.id);

            if (timetableError) throw timetableError;

            // Calculate remaining weeks if sem_end_date is set
            let remainingWeeks = 0;
            if (profileData?.sem_end_date) {
                const today = new Date();
                const endDate = new Date(profileData.sem_end_date);
                if (endDate > today) {
                    const diffTime = Math.abs(endDate - today);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    remainingWeeks = diffDays / 7;
                }
            }

            // Calculate subject-wise stats
            const stats = subjectsData.map(subject => {
                const records = attendanceData.filter(a => a.subject_id === subject.id);
                const appAttended = records.filter(r => r.status === 'present').length;
                const appAbsent = records.filter(r => r.status === 'absent').length;

                const pastAttended = subject.past_attended || 0;
                const pastConducted = subject.past_conducted || 0;

                const attended = appAttended + pastAttended;
                const absent = appAbsent + (pastConducted - pastAttended);
                const total = attended + absent;
                const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;

                let target = profileData?.required_percentage || 75;
                const maxAllowed = total - ((target / 100) * total);
                const safeLeaves = Math.floor(maxAllowed - absent);

                // Future projection
                let futureClasses = 0;
                let projectedRequired = 0;
                let projectedSafeLeaves = safeLeaves;

                if (remainingWeeks > 0) {
                    // How many times does this subject appear in the timetable per week?
                    const weeklyFrequency = timetableData.filter(t => t.subject_id === subject.id).length;
                    futureClasses = Math.floor(weeklyFrequency * remainingWeeks);

                    const projectedTotal = total + futureClasses;
                    const requiredTotalAttended = Math.ceil((target / 100) * projectedTotal);
                    projectedRequired = Math.max(0, requiredTotalAttended - attended);

                    const projectedMaxAllowed = projectedTotal - ((target / 100) * projectedTotal);
                    projectedSafeLeaves = Math.floor(projectedMaxAllowed - absent);
                }

                return {
                    ...subject,
                    appAttended,
                    appAbsent,
                    attended,
                    absent,
                    total,
                    percentage,
                    safeLeaves,
                    projectedRequired,
                    projectedSafeLeaves,
                    futureClasses
                };
            });

            // Sort by subject name to prevent cards from jumping around when edited
            stats.sort((a, b) => a.subject_name.localeCompare(b.subject_name));

            setSubjectStats(stats);

        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = (stat) => {
        setEditingSubjectId(stat.id);
        const editingStat = subjectStats.find(s => s.id === stat.id);
        setEditForm({
            total_held: editingStat ? editingStat.total : (stat.past_conducted || 0),
            total_attended: editingStat ? editingStat.attended : (stat.past_attended || 0)
        });
    };

    const handleCancelEdit = () => {
        setEditingSubjectId(null);
    };

    const handleSaveEdit = async (subjectId) => {
        let newTotal = parseInt(editForm.total_held, 10);
        let newAttended = parseInt(editForm.total_attended, 10);

        if (isNaN(newTotal)) newTotal = 0;
        if (isNaN(newAttended)) newAttended = 0;

        // Validation: cannot attend more than conducted
        if (newAttended > newTotal) {
            alert("Attended periods cannot be greater than Total Held periods.");
            return;
        }

        const stat = subjectStats.find(s => s.id === subjectId);
        if (!stat) return;

        // Calculate what the past numbers should be to reach this new total
        let past_conducted = newTotal - (stat.appAttended + stat.appAbsent);
        let past_attended = newAttended - stat.appAttended;

        // Validation against app tracked data
        if (past_conducted < 0 || past_attended < 0) {
            alert(`You have already tracked ${stat.appAttended + stat.appAbsent} classes(${stat.appAttended} attended) in the app.Total cannot be less than what is tracked.`);
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('subjects')
                .update({
                    past_conducted: past_conducted,
                    past_attended: past_attended
                })
                .eq('id', subjectId)
                .eq('user_id', user.id);

            if (error) throw error;

            // Re-fetch data to recalculate everything
            await fetchReportData();
            setEditingSubjectId(null);
        } catch (error) {
            console.error('Error saving past data:', error);
            alert('Failed to save past data.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStats = useMemo(() => {
        if (!searchQuery.trim()) return subjectStats;
        const query = searchQuery.toLowerCase();
        return subjectStats.filter(stat =>
            stat.subject_name.toLowerCase().includes(query) ||
            (stat.subject_code && stat.subject_code.toLowerCase().includes(query))
        );
    }, [subjectStats, searchQuery]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="mt-1 text-sm text-gray-500">Detailed subject-wise breakdown of your attendance.</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {subjectStats.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    No subjects or attendance data found.
                </div>
            ) : filteredStats.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
                    No subjects match your search "{searchQuery}".
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredStats.map((stat) => {
                        const target = profile?.required_percentage || 75;
                        const isDanger = stat.total > 0 && parseFloat(stat.percentage) < target;
                        const isWarning = stat.total > 0 && parseFloat(stat.percentage) < target + 5 && !isDanger;

                        return (
                            <div key={stat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="flex items-center space-x-3 truncate">
                                        <h3 className="font-bold text-gray-900 truncate">{stat.subject_name}</h3>
                                        <button
                                            onClick={() => handleEditClick(stat)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50"
                                            title="Edit Past Data"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className={`px - 3 py - 1 rounded - full text - sm font - bold shadow - sm flex - shrink - 0 ${stat.total === 0 ? 'bg-gray-100 text-gray-600' :
                                            isDanger ? 'bg-red-100 text-red-700 border border-red-200' :
                                                isWarning ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    'bg-green-100 text-green-700 border border-green-200'
                                        } `}>
                                        {stat.total === 0 ? 'No Data' : `${stat.percentage}% `}
                                    </div>
                                </div>

                                <div className="p-6">

                                    {editingSubjectId === stat.id && (
                                        <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-bold text-blue-900">Edit Overall Attendance</h4>
                                                <div className="flex space-x-1">
                                                    <button onClick={() => handleSaveEdit(stat.id)} disabled={isSaving} className="text-green-600 hover:bg-green-100 p-1 rounded transition-colors" title="Save">
                                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={handleCancelEdit} disabled={isSaving} className="text-red-500 hover:bg-red-100 p-1 rounded transition-colors" title="Cancel">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-800 mb-1 tracking-wide">TOTAL HELD</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editForm.total_held}
                                                        onChange={e => setEditForm({ ...editForm, total_held: e.target.value })}
                                                        className="w-full px-3 py-1.5 text-sm bg-white border border-blue-200 rounded focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-800 mb-1 tracking-wide">TOTAL ATTENDED</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editForm.total_attended}
                                                        onChange={e => setEditForm({ ...editForm, total_attended: e.target.value })}
                                                        className="w-full px-3 py-1.5 text-sm bg-white border border-blue-200 rounded focus:ring-blue-500 focus:border-blue-500 rounded-lg shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-blue-600 mt-2 opacity-80">Adjusting this updates your past records so the card totals match your input exactly.</p>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
                                        <div
                                            className={`h - 3 rounded - full ${isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                                                } `}
                                            style={{ width: `${stat.total === 0 ? 0 : Math.min(100, Math.max(0, parseFloat(stat.percentage)))}% ` }}
                                        ></div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="text-xs text-gray-500 font-medium mb-1">Total</div>
                                            <div className="text-xl font-semibold text-gray-900">{stat.total}</div>
                                        </div>
                                        <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100">
                                            <div className="text-xs text-green-600 font-medium mb-1">Attended</div>
                                            <div className="text-xl font-semibold text-green-700">{stat.attended}</div>
                                        </div>
                                        <div className="text-center p-3 bg-red-50 rounded-xl border border-red-100">
                                            <div className="text-xs text-red-600 font-medium mb-1">Missed</div>
                                            <div className="text-xl font-semibold text-red-700">{stat.absent}</div>
                                        </div>
                                    </div>

                                    {stat.total > 0 && (
                                        <div className={`flex items-start p-3 rounded-xl text-sm mb-4 ${stat.safeLeaves < 0 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                                            } `}>
                                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                {stat.safeLeaves < 0 ? (
                                                    <span>Currently, you need to attend <strong>{Math.abs(stat.safeLeaves)}</strong> more consecutive classes to reach your {target}% target.</span>
                                                ) : stat.safeLeaves === 0 ? (
                                                    <span>Currently, you are exactly at the safe limit. Do not miss the next class.</span>
                                                ) : (
                                                    <span>Currently, you can safely miss <strong>{stat.safeLeaves}</strong> more class{stat.safeLeaves !== 1 ? 'es' : ''} to stay above {target}%.</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {profile?.sem_end_date && stat.futureClasses > 0 && (
                                        <div className="flex items-start p-3 rounded-xl text-sm bg-purple-50 text-purple-800 border border-purple-100">
                                            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold mb-1">Semester End Projection ({stat.futureClasses} est. classes left)</p>
                                                {stat.projectedSafeLeaves < 0 ? (
                                                    <span>Even if you attend all remaining classes, you'll fall short of the {target}% target. You need {stat.projectedRequired} classes but only {stat.futureClasses} are left.</span>
                                                ) : stat.projectedRequired > 0 ? (
                                                    <span>You must attend <strong>{stat.projectedRequired}</strong> out of the {stat.futureClasses} remaining classes to hit {target}% by the end of the semester.</span>
                                                ) : (
                                                    <span>You have already secured attendance. You can miss <strong>{stat.projectedSafeLeaves}</strong> classes before the end of the semester.</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Reports;
