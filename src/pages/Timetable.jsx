import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Save, X, Plus } from 'lucide-react';

const DAYS_OF_WEEK = [
    { id: 1, name: 'Mon' },
    { id: 2, name: 'Tue' },
    { id: 3, name: 'Wed' },
    { id: 4, name: 'Thu' },
    { id: 5, name: 'Fri' },
    { id: 6, name: 'Sat' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const Timetable = () => {
    const { user } = useAuth();

    // State
    const [subjects, setSubjects] = useState([]);
    const [timetable, setTimetable] = useState({}); // format: { 'dayId-periodId': subjectId }
    const [originalTimetable, setOriginalTimetable] = useState({});

    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null); // { day, period }
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*');
            if (subjectsError) throw subjectsError;
            setSubjects(subjectsData || []);

            // Fetch Timetable
            const { data: timetableData, error: timetableError } = await supabase
                .from('timetable')
                .select('*');
            if (timetableError) throw timetableError;

            // Map DB array to dictionary { 'dayId-periodId': subjectId }
            const mappedTimetable = {};
            (timetableData || []).forEach(entry => {
                mappedTimetable[`${entry.day_of_week}-${entry.period_number}`] = entry.subject_id;
            });

            setTimetable(mappedTimetable);
            setOriginalTimetable(mappedTimetable);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCellClick = (dayId, periodId) => {
        setSelectedCell({ day: dayId, period: periodId });
    };

    const handleCellAssign = (subjectId) => {
        if (!selectedCell) return;

        const cellKey = `${selectedCell.day}-${selectedCell.period}`;
        const newTimetable = { ...timetable };

        if (subjectId === null) {
            delete newTimetable[cellKey];
        } else {
            newTimetable[cellKey] = subjectId;
        }

        setTimetable(newTimetable);
        setSelectedCell(null);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // 1. Delete all existing user records (simpler to re-insert than calculating diffs)
            const { error: deleteError } = await supabase
                .from('timetable')
                .delete()
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            // 2. Prepare bulk insert array
            const insertPayload = [];
            for (const [key, subjectId] of Object.entries(timetable)) {
                const [dayStr, periodStr] = key.split('-');
                insertPayload.push({
                    user_id: user.id,
                    day_of_week: parseInt(dayStr),
                    period_number: parseInt(periodStr),
                    subject_id: subjectId
                });
            }

            // 3. Insert new records
            if (insertPayload.length > 0) {
                const { error: insertError } = await supabase
                    .from('timetable')
                    .insert(insertPayload);
                if (insertError) throw insertError;
            }

            setOriginalTimetable(timetable);
            setHasChanges(false);
            alert('Timetable saved successfully!');

        } catch (error) {
            console.error('Error saving timetable:', error);
            alert('Failed to save timetable.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (confirm('Are you sure you want to discard your unsaved changes?')) {
            setTimetable(originalTimetable);
            setHasChanges(false);
            setSelectedCell(null);
        }
    };

    const getSubjectCode = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) return '';
        return subject.subject_code || subject.subject_name.substring(0, 3).toUpperCase();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (subjects.length === 0) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">College Timetable</h1>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-800 font-medium mb-2">No subjects found</p>
                    <p className="text-yellow-600 text-sm mb-4">You need to add subjects in your Profile before creating a timetable grid.</p>
                    <a href="/profile" className="inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900 bg-yellow-100 px-4 py-2 rounded-lg transition-colors">
                        Go to Profile
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">College Timetable</h1>
                    <p className="mt-1 text-sm text-gray-500">Click any box to assign a subject to that period.</p>
                </div>

                {hasChanges && (
                    <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                        <span className="text-sm font-medium text-blue-800 hidden sm:block">Unsaved Changes</span>
                        <button
                            onClick={handleDiscard}
                            disabled={isSaving}
                            className="text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors disabled:opacity-70"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Grid
                        </button>
                    </div>
                )}
            </div>

            {/* Selected Cell Floating Toolbar */}
            {selectedCell && (
                <div className="bg-white border-2 border-blue-400 shadow-lg rounded-2xl p-4 sticky top-4 z-10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-bold text-gray-700">
                            Assigning: <span className="text-blue-600">{DAYS_OF_WEEK.find(d => d.id === selectedCell.day)?.name} - Period {selectedCell.period}</span>
                        </div>
                        <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCellAssign(null)}
                            className="px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                        >
                            Clear Period
                        </button>
                        {subjects.map(sub => {
                            const shortCode = sub.subject_code || sub.subject_name.substring(0, 3).toUpperCase();
                            const isCurrentlySelected = timetable[`${selectedCell.day}-${selectedCell.period}`] === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => handleCellAssign(sub.id)}
                                    className={`px-3 py-1.5 border text-sm rounded-lg font-bold transition-colors ${isCurrentlySelected
                                            ? 'bg-blue-100 border-blue-300 text-blue-800 shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                                        }`}
                                    title={sub.subject_name}
                                >
                                    {shortCode}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Desktop Timetable Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse relative">
                    <thead>
                        <tr>
                            <th className="p-4 border-b border-r border-gray-200 bg-gray-50 sticky left-0 z-10 w-24">
                                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider text-center">Day / P</div>
                            </th>
                            {PERIODS.map(period => (
                                <th key={period} className="p-4 border-b border-gray-200 bg-gray-50 text-center w-[12%]">
                                    <div className="text-sm font-bold text-gray-700">Period {period}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DAYS_OF_WEEK.map((day) => (
                            <tr key={day.id} className="group">
                                <td className="p-4 border-b border-r border-gray-200 bg-gray-50 sticky left-0 z-10 text-center font-bold text-gray-700">
                                    {day.name}
                                </td>

                                {PERIODS.map(period => {
                                    const cellKey = `${day.id}-${period}`;
                                    const subjectId = timetable[cellKey];
                                    const isSelected = selectedCell?.day === day.id && selectedCell?.period === period;

                                    return (
                                        <td
                                            key={period}
                                            onClick={() => handleCellClick(day.id, period)}
                                            className={`
                                                p-2 border-b border-r border-gray-100 text-center relative cursor-pointer
                                                h-16 transition-all duration-150
                                                ${isSelected ? 'bg-blue-50 ring-2 ring-inset ring-blue-500 z-10' : 'hover:bg-gray-50'}
                                            `}
                                        >
                                            {subjectId ? (
                                                <div
                                                    className="inline-flex items-center justify-center w-full h-full rounded-md font-bold text-sm bg-blue-100 text-blue-800 px-1 py-2 shadow-sm"
                                                    title={subjects.find(s => s.id === subjectId)?.subject_name}
                                                >
                                                    {getSubjectCode(subjectId)}
                                                </div>
                                            ) : (
                                                <div className="w-full h-full border-2 border-dashed border-transparent group-hover:border-gray-200 rounded-md flex items-center justify-center text-gray-300">
                                                    <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Subject Legend */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Subject Codes Legend</h3>
                <div className="flex flex-wrap gap-4">
                    {subjects.map(sub => (
                        <div key={sub.id} className="flex items-center text-sm">
                            <span className="font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded mr-2">
                                {sub.subject_code || sub.subject_name.substring(0, 3).toUpperCase()}
                            </span>
                            <span className="text-gray-600">{sub.subject_name}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Timetable;
