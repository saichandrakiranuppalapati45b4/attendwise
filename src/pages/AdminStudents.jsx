import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    Search,
    UserCircle,
    Calendar,
    Loader2,
    AlertCircle,
    ArrowLeft,
    Filter,
    X,
    TrendingUp,
    CheckCircle2,
    XCircle,
    BookOpen,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminStudents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(null);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

    // Detail Panel State
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentData, setStudentData] = useState({
        subjects: [],
        attendance: [],
        timetable: [],
        loading: false
    });

    const isAdmin = user?.email === '24pa1a45b4@vishnu.edu.in';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        fetchProfiles();
    }, [user, isAdmin, navigate]);

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profileError) throw profileError;
            setProfiles(data);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStudent = async (e, studentId, studentName) => {
        e.stopPropagation(); // Prevent opening detail panel

        if (!confirm(`Are you sure you want to delete ${studentName}? This will permanently remove all their attendance records and data.`)) {
            return;
        }

        setIsDeleting(studentId);
        try {
            const { error: deleteError } = await supabase
                .rpc('delete_user', { target_user_id: studentId });

            if (deleteError) throw deleteError;

            setProfiles(prev => prev.filter(p => p.id !== studentId));
            if (selectedStudent?.id === studentId) setSelectedStudent(null);

        } catch (err) {
            console.error('Error deleting student:', err);
            alert('Failed to delete student: ' + err.message);
        } finally {
            setIsDeleting(null);
        }
    };

    const fetchStudentData = async (student) => {
        setStudentData(prev => ({ ...prev, loading: true }));
        try {
            const userId = student.id;

            // Fetch Subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .eq('user_id', userId);

            if (subjectsError) throw subjectsError;

            // Fetch Attendance - Filter by status to match Reports logic
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['present', 'absent']);

            if (attendanceError) throw attendanceError;

            // Fetch Timetable
            const { data: timetableData, error: timetableError } = await supabase
                .from('timetable')
                .select('*')
                .eq('user_id', userId);

            if (timetableError) throw timetableError;

            setStudentData({
                subjects: subjectsData || [],
                attendance: attendanceData || [],
                timetable: timetableData || [],
                loading: false
            });
        } catch (err) {
            console.error('Error fetching student details:', err);
            setStudentData(prev => ({ ...prev, loading: false }));
        }
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        fetchStudentData(student);
    };

    const studentReports = useMemo(() => {
        if (!selectedStudent || studentData.loading) return [];

        const target = selectedStudent.required_percentage || 75;

        // Calculate remaining weeks for projection
        let remainingWeeks = 0;
        if (selectedStudent.sem_end_date) {
            const today = new Date();
            const endDate = new Date(selectedStudent.sem_end_date);
            if (endDate > today) {
                const diffTime = Math.abs(endDate - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                remainingWeeks = diffDays / 7;
            }
        }

        return studentData.subjects.map(subject => {
            const records = studentData.attendance.filter(a => a.subject_id === subject.id);
            const appAttended = records.filter(r => r.status === 'present').length;
            const appAbsent = records.filter(r => r.status === 'absent').length;

            const pastAttended = subject.past_attended || 0;
            const pastConducted = subject.past_conducted || 0;

            const attended = appAttended + pastAttended;
            const absent = appAbsent + (pastConducted - pastAttended);
            const total = attended + absent;
            const percentage = total > 0 ? ((attended / total) * 100).toFixed(1) : 0;

            const maxAllowed = total - ((target / 100) * total);
            const safeLeaves = Math.floor(maxAllowed - absent);

            // Future projection logic matching Reports.jsx
            let futureClasses = 0;
            let projectedRequired = 0;
            let projectedSafeLeaves = safeLeaves;

            if (remainingWeeks > 0) {
                const weeklyFrequency = studentData.timetable.filter(t => t.subject_id === subject.id).length;
                futureClasses = Math.floor(weeklyFrequency * remainingWeeks);

                const projectedTotal = total + futureClasses;
                const requiredTotalAttended = Math.ceil((target / 100) * projectedTotal);
                projectedRequired = Math.max(0, requiredTotalAttended - attended);

                const projectedMaxAllowed = projectedTotal - ((target / 100) * projectedTotal);
                projectedSafeLeaves = Math.floor(projectedMaxAllowed - absent);
            }

            return {
                ...subject,
                stats: {
                    attended,
                    total,
                    percentage,
                    safeLeaves,
                    futureClasses,
                    projectedRequired,
                    projectedSafeLeaves
                }
            };
        }).sort((a, b) => a.subject_name.localeCompare(b.subject_name));
    }, [selectedStudent, studentData]);

    const aggregateStats = useMemo(() => {
        if (studentReports.length === 0) return { percentage: '0.0', status: 'N/A' };

        const totalAttended = studentReports.reduce((acc, curr) => acc + curr.stats.attended, 0);
        const totalHeld = studentReports.reduce((acc, curr) => acc + curr.stats.total, 0);

        const percentage = totalHeld > 0 ? ((totalAttended / totalHeld) * 100).toFixed(1) : '0.0';
        const hasShortfall = studentReports.some(s => s.stats.safeLeaves < 0);

        return {
            percentage,
            status: hasShortfall ? 'Shortfall' : 'On Track'
        };
    }, [studentReports]);

    const branches = useMemo(() => {
        const uniqueBranches = new Set(profiles.map(p => p.branch).filter(Boolean));
        return ['All', ...Array.from(uniqueBranches).sort()];
    }, [profiles]);

    const filteredProfiles = useMemo(() => {
        let result = profiles;

        if (activeTab !== 'All') {
            result = result.filter(p => p.branch === activeTab);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                (p.name?.toLowerCase().includes(q)) ||
                (p.branch?.toLowerCase().includes(q))
            );
        }

        return result;
    }, [profiles, searchQuery, activeTab]);

    if (!isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-6 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 leading-tight">Student Directory</h1>
                    <p className="text-sm text-gray-500">Manage and view all registered students.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            {/* Branch Tabs */}
            {!isLoading && !error && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="p-1.5 bg-gray-100 rounded-2xl flex items-center space-x-1">
                        {branches.map((branch) => (
                            <button
                                key={branch}
                                onClick={() => setActiveTab(branch)}
                                className={`
                                    px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap
                                    ${activeTab === branch
                                        ? 'bg-white text-purple-600 shadow-sm scale-105'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}
                                `}
                            >
                                {branch}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === branch ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {branch === 'All'
                                        ? profiles.length
                                        : profiles.filter(p => p.branch === branch).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                    <p className="text-gray-500 font-medium">Loading directory...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start text-red-700">
                    <AlertCircle className="w-6 h-6 mr-3 mt-0.5" />
                    <p>{error}</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Student Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Branch</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Joined Date</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProfiles.map((p) => (
                                    <tr
                                        key={p.id}
                                        onClick={() => handleStudentClick(p)}
                                        className="hover:bg-purple-50/50 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4 flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-black mr-3 text-xs transition-transform group-hover:scale-110">
                                                {p.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{p.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold uppercase border border-transparent group-hover:border-purple-200 transition-all">
                                                {p.branch || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                            <Calendar className="w-3.5 h-3.5 mr-2" />
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '---'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => handleDeleteStudent(e, p.id, p.name)}
                                                disabled={isDeleting === p.id}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                                title="Delete student"
                                            >
                                                {isDeleting === p.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredProfiles.length === 0 && (
                            <div className="py-20 text-center text-gray-500 bg-gray-50/30">
                                <Filter className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                                <p className="font-bold text-gray-400">No students found in "{activeTab}"</p>
                                <p className="text-sm">Try changing the tab or searching for another student.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Detail Overlay / Sliding Panel */}
            <div className={`
                fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col
                ${selectedStudent ? 'translate-x-0' : 'translate-x-full'}
            `}>
                {selectedStudent && (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-purple-200">
                                    {selectedStudent.name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedStudent.name}</h2>
                                    <div className="flex items-center text-xs font-bold text-purple-600 uppercase tracking-wide bg-purple-50 px-2 py-0.5 rounded-md mt-1 border border-purple-100 inline-block">
                                        {selectedStudent.branch || 'General'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {studentData.loading ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                                    <span className="font-bold tracking-tight">Generating detailed report...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Overview Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
                                            </div>
                                            <div className="text-2xl font-black text-gray-900">
                                                {aggregateStats.percentage}%
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <TrendingUp className="w-4 h-4 mr-2 text-purple-500" />
                                                <span className="text-xs font-bold uppercase tracking-wider">Target Status</span>
                                            </div>
                                            <div className={`text-sm font-black uppercase ${aggregateStats.status === 'Shortfall' ? 'text-red-600' : 'text-green-600'}`}>
                                                {aggregateStats.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subjects List */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                                                <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                                                Subject Breakdown
                                            </h3>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">
                                                {studentReports.length} Subjects
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {studentReports.map((report) => (
                                                <div key={report.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:border-purple-100 transition-colors">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="font-black text-gray-900 text-sm leading-tight">{report.subject_name}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{report.subject_code || 'No Code'}</div>
                                                        </div>
                                                        <div className={`text-lg font-black ${parseFloat(report.stats.percentage) < (selectedStudent.required_percentage || 75) ? 'text-red-500' : 'text-green-600'}`}>
                                                            {report.stats.percentage}%
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                                        <div className="bg-gray-50 px-3 py-1.5 rounded-xl text-center">
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-1">Held</div>
                                                            <div className="text-xs font-black text-gray-700">{report.stats.total}</div>
                                                        </div>
                                                        <div className="bg-green-50 px-3 py-1.5 rounded-xl text-center">
                                                            <div className="text-[9px] font-bold text-green-500 uppercase leading-none mb-1">Att.</div>
                                                            <div className="text-xs font-black text-green-700">{report.stats.attended}</div>
                                                        </div>
                                                        <div className="bg-red-50/50 px-3 py-1.5 rounded-xl text-center">
                                                            <div className="text-[9px] font-bold text-red-400 uppercase leading-none mb-1">Safe</div>
                                                            <div className={`text-xs font-black ${report.stats.safeLeaves < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {report.stats.safeLeaves}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Goal Progress */}
                                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${report.stats.safeLeaves < 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}
                                                            style={{ width: `${Math.min(100, Math.max(0, parseFloat(report.stats.percentage)))}%` }}
                                                        ></div>
                                                    </div>

                                                    {/* Projection Message */}
                                                    {report.stats.futureClasses > 0 && (
                                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5">
                                                            <div className="flex items-start">
                                                                <AlertCircle className="w-3.5 h-3.5 mr-2 text-purple-400 mt-0.5 flex-shrink-0" />
                                                                <div className="text-[10px] text-purple-700 leading-tight">
                                                                    <span className="font-bold">Projected: </span>
                                                                    {report.stats.projectedSafeLeaves < 0 ? (
                                                                        <span>Will fall short ({report.stats.projectedRequired} classes needed)</span>
                                                                    ) : report.stats.projectedRequired > 0 ? (
                                                                        <span>Need {report.stats.projectedRequired} more sessions to hit {selectedStudent.required_percentage || 75}%</span>
                                                                    ) : (
                                                                        <span>Safe (can miss {report.stats.projectedSafeLeaves})</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {studentReports.length === 0 && (
                                        <div className="py-20 text-center text-gray-400">
                                            <AlertCircle className="w-10 h-10 mx-auto opacity-20 mb-3" />
                                            <p className="text-sm font-bold opacity-40 uppercase tracking-widest">No subject data found</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                            Admin Detail View &bull; Professional Attendance tracking
                        </div>
                    </>
                )}
            </div>

            {/* Backdrop for detail panel */}
            {selectedStudent && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity animate-in fade-in"
                    onClick={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default AdminStudents;
