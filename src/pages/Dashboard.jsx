import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader2, TrendingUp, TrendingDown, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        totalConducted: 0,
        totalAttended: 0,
        totalAbsent: 0,
        attendancePercentage: 0,
        safeLeavesLeft: 0,
        status: 'good' // good, warning, danger
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch Subjects to get past attendance details
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .eq('user_id', user.id);

            if (subjectsError) throw subjectsError;

            // Fetch Attendance Records
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', user.id)
                .in('status', ['present', 'absent']); // exclude cancelled

            if (attendanceError) throw attendanceError;

            calculateStats(attendanceData || [], profileData.required_percentage, subjectsData || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (records, requiredPercentage, subjects) => {
        let appTotalAttended = records.filter(r => r.status === 'present').length;
        let appTotalAbsent = records.filter(r => r.status === 'absent').length;

        // Add past subject totals
        let pastTotalAttended = 0;
        let pastTotalConducted = 0;
        if (subjects && subjects.length > 0) {
            subjects.forEach(sub => {
                pastTotalAttended += (sub.past_attended || 0);
                pastTotalConducted += (sub.past_conducted || 0);
            });
        }

        const totalAttended = appTotalAttended + pastTotalAttended;
        const totalAbsent = appTotalAbsent + (pastTotalConducted - pastTotalAttended); // Estimate past absents
        const totalConducted = totalAttended + totalAbsent;

        let attendancePercentage = 0;
        if (totalConducted > 0) {
            attendancePercentage = (totalAttended / totalConducted) * 100;
        }

        // Safe Absence Formula: Max Allowed Absents = T - (R/100 * T)
        const maxAllowedAbsents = totalConducted - ((requiredPercentage / 100) * totalConducted);
        const safeLeavesLeft = Math.floor(maxAllowedAbsents - totalAbsent);

        let status = 'good';
        if (attendancePercentage < requiredPercentage) {
            status = 'danger';
        } else if (attendancePercentage < requiredPercentage + 5) {
            status = 'warning';
        }

        setStats({
            totalConducted,
            totalAttended,
            totalAbsent,
            attendancePercentage: attendancePercentage.toFixed(1),
            safeLeavesLeft,
            status
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const { status, attendancePercentage, safeLeavesLeft, totalConducted, totalAttended, totalAbsent } = stats;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.name}!</h1>
                <p className="mt-1 text-sm text-gray-500">Here's your attendance overview at a glance.</p>
            </div>

            {totalConducted === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance data yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Start tracking your attendance in the "Attendance" tab to see your statistics and safe absence limits.
                    </p>
                    <a href="/attendance" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                        Mark Attendance Now
                    </a>
                </div>
            ) : (
                <>
                    {/* Main Status Card */}
                    <div className={`rounded-3xl shadow-sm border overflow-hidden p-8 sm:p-10 ${status === 'danger' ? 'bg-red-50 border-red-100' :
                        status === 'warning' ? 'bg-yellow-50 border-yellow-100' :
                            'bg-green-50 border-green-100'
                        }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <div className="flex items-center space-x-2 mb-4">
                                    {status === 'danger' ? <AlertTriangle className="w-6 h-6 text-red-600" /> :
                                        status === 'warning' ? <AlertTriangle className="w-6 h-6 text-yellow-600" /> :
                                            <CheckCircle className="w-6 h-6 text-green-600" />}
                                    <span className={`font-semibold ${status === 'danger' ? 'text-red-700' :
                                        status === 'warning' ? 'text-yellow-700' :
                                            'text-green-700'
                                        }`}>
                                        {status === 'danger' ? 'Action Required' :
                                            status === 'warning' ? 'Close to Limit' :
                                                'On Track'}
                                    </span>
                                </div>
                                <h2 className={`text-5xl font-extrabold mb-2 ${status === 'danger' ? 'text-red-700' :
                                    status === 'warning' ? 'text-yellow-700' :
                                        'text-green-700'
                                    }`}>
                                    {attendancePercentage}%
                                </h2>
                                <p className={`text-lg opacity-90 ${status === 'danger' ? 'text-red-800' :
                                    status === 'warning' ? 'text-yellow-800' :
                                        'text-green-800'
                                    }`}>
                                    Overall Attendance • Target: {profile?.required_percentage}%
                                </p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
                                <div className="text-sm font-medium text-gray-600 mb-1">Safe Leaves Left</div>
                                <div className="text-4xl font-bold text-gray-900 mb-2">
                                    {safeLeavesLeft > 0 ? safeLeavesLeft : 0}
                                </div>
                                {safeLeavesLeft < 0 && (
                                    <p className="text-sm text-red-600 font-medium">
                                        You are currently short by {Math.abs(safeLeavesLeft)} classes to reach your target!
                                    </p>
                                )}
                                {safeLeavesLeft === 0 && (
                                    <p className="text-sm text-yellow-600 font-medium">
                                        Currently exact! You cannot miss any more classes.
                                    </p>
                                )}
                                {safeLeavesLeft > 0 && (
                                    <p className="text-sm text-green-600 font-medium">
                                        You can currently safely miss {safeLeavesLeft} more class{safeLeavesLeft !== 1 ? 'es' : ''}.
                                    </p>
                                )}
                                {profile?.sem_end_date && (
                                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                                        <p className="text-xs text-gray-600 mb-1 font-medium">Check 'Reports' to see exact projections until the semester ends.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Classes Conducted</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalConducted}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Classes Attended</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalAttended}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Classes Missed</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalAbsent}</h3>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
