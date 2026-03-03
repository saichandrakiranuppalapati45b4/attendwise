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
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminStudents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');

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

    const branches = useMemo(() => {
        const uniqueBranches = new Set(profiles.map(p => p.branch).filter(Boolean));
        return ['All', ...Array.from(uniqueBranches).sort()];
    }, [profiles]);

    const filteredProfiles = useMemo(() => {
        let result = profiles;

        // Apply Tab Filter
        if (activeTab !== 'All') {
            result = result.filter(p => p.branch === activeTab);
        }

        // Apply Search Filter
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
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProfiles.map((p) => (
                                    <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-6 py-4 flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold mr-3 text-xs">
                                                {p.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="font-bold text-gray-900">{p.name || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold uppercase">
                                                {p.branch || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 flex items-center">
                                            <Calendar className="w-3.5 h-3.5 mr-2 opacity-40" />
                                            {p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB') : '---'}
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
        </div>
    );
};

export default AdminStudents;
