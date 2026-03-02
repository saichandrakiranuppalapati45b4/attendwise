import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Calendar as CalendarIcon, CheckCircle, XCircle, Slash } from 'lucide-react';

const Attendance = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [timetable, setTimetable] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user && selectedDate) {
            fetchDayData();
        }
    }, [user, selectedDate]);

    const fetchDayData = async () => {
        setIsLoading(true);
        try {
            // Get day of week for selected date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
            const dateObj = new Date(selectedDate);
            const dayOfWeek = dateObj.getDay();

            // Fetch timetable for this day
            const { data: timetableData, error: timetableError } = await supabase
                .from('timetable')
                .select(`
                  id,
                  period_number,
                  subject_id,
                  subjects (
                    subject_name,
                    subject_code
                  )
                `)
                .eq('user_id', user.id)
                .eq('day_of_week', dayOfWeek)
                .order('period_number', { ascending: true });

            if (timetableError) throw timetableError;
            setTimetable(timetableData || []);

            // Fetch existing attendance records for this date
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', selectedDate);

            if (attendanceError) throw attendanceError;

            // Index attendance records by subject_id for quick lookup
            const recordsMap = {};
            (attendanceData || []).forEach(record => {
                recordsMap[record.subject_id] = record.status;
            });
            setAttendanceRecords(recordsMap);

        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (subjectId, newStatus) => {
        setIsSaving(true);

        // Optimistic update
        setAttendanceRecords(prev => ({
            ...prev,
            [subjectId]: newStatus
        }));

        try {
            // Check if we already have a record
            const { data: existingData } = await supabase
                .from('attendance')
                .select('id')
                .eq('user_id', user.id)
                .eq('subject_id', subjectId)
                .eq('date', selectedDate)
                .maybeSingle();

            if (existingData) {
                // Update existing record
                const { error } = await supabase
                    .from('attendance')
                    .update({ status: newStatus })
                    .eq('id', existingData.id);
                if (error) throw error;
            } else {
                // Insert new record
                const { error } = await supabase
                    .from('attendance')
                    .insert([{
                        user_id: user.id,
                        subject_id: subjectId,
                        date: selectedDate,
                        status: newStatus
                    }]);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('Failed to save attendance. Please try again.');
            // Revert optimistic update (could be improved by reverting to actual previous state)
            fetchDayData();
        } finally {
            setIsSaving(false);
        }
    };

    // Helper date formatter
    const displayDate = new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Daily Attendance</h1>
                    <p className="mt-1 text-sm text-gray-500">Track your attendance for your scheduled classes.</p>
                </div>

                <div className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm">
                    <CalendarIcon className="w-5 h-5 text-gray-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{displayDate}</h3>
                    {isSaving && <span className="text-sm text-blue-600 flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</span>}
                </div>

                <div className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : timetable.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <p className="text-lg mb-2">No classes scheduled for this day.</p>
                            <p className="text-sm">You can update your schedule in the Timetable section.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {timetable.map((entry) => {
                                const currentStatus = attendanceRecords[entry.subject_id];

                                return (
                                    <div key={entry.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center hidden sm:block min-w-[100px] border border-blue-100">
                                                <div className="text-xs font-medium uppercase tracking-wider opacity-75">Period</div>
                                                <div className="text-xl font-extrabold">{entry.period_number}</div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                                        {entry.subjects?.subject_code || entry.subjects?.subject_name.substring(0, 3).toUpperCase()}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-semibold text-gray-900 leading-tight">{entry.subjects?.subject_name}</h4>
                                                <p className="text-sm text-gray-500 sm:hidden">Period {entry.period_number}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center bg-gray-100/50 p-1.5 rounded-xl self-start sm:self-auto border border-gray-200">
                                            <button
                                                onClick={() => handleStatusChange(entry.subject_id, 'present')}
                                                className={`
                          flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${currentStatus === 'present'
                                                        ? 'bg-green-100 text-green-700 shadow-sm border border-green-200'
                                                        : 'text-gray-500 hover:text-green-600'}
                        `}
                                            >
                                                <CheckCircle className={`w-4 h-4 mr-2 ${currentStatus === 'present' ? 'text-green-600' : ''}`} />
                                                Present
                                            </button>

                                            <button
                                                onClick={() => handleStatusChange(entry.subject_id, 'absent')}
                                                className={`
                          flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all mx-1
                          ${currentStatus === 'absent'
                                                        ? 'bg-red-100 text-red-700 shadow-sm border border-red-200'
                                                        : 'text-gray-500 hover:text-red-600'}
                        `}
                                            >
                                                <XCircle className={`w-4 h-4 mr-2 ${currentStatus === 'absent' ? 'text-red-600' : ''}`} />
                                                Absent
                                            </button>

                                            <button
                                                onClick={() => handleStatusChange(entry.subject_id, 'cancelled')}
                                                className={`
                          flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all
                          ${currentStatus === 'cancelled'
                                                        ? 'bg-gray-200 text-gray-800 shadow-sm border border-gray-300'
                                                        : 'text-gray-500 hover:text-gray-700'}
                        `}
                                            >
                                                <Slash className={`w-4 h-4 mr-2 ${currentStatus === 'cancelled' ? 'text-gray-600' : ''}`} />
                                                Cancelled
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;
