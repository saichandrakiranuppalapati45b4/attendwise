import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    BarChart,
    BookOpen,
    CheckCircle2,
    Loader2,
    AlertCircle,
    LayoutDashboard,
    PieChart,
    Plus,
    Edit2,
    Trash2,
    Settings,
    List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminStats = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSubjects: 0,
        totalAttendance: 0,
        branchCounts: []
    });
    const [branchesList, setBranchesList] = useState([]);
    const [newBranchName, setNewBranchName] = useState('');
    const [editingBranch, setEditingBranch] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isAdmin = user?.email === '24pa1a45b4@vishnu.edu.in';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/');
            return;
        }
        fetchStats();
    }, [user, isAdmin, navigate]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            // Fetch Profiles for branch breakdown
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('branch');
            if (pError) throw pError;

            // Fetch Counts
            const { count: sCount, error: sError } = await supabase
                .from('subjects')
                .select('*', { count: 'exact', head: true });
            if (sError) throw sError;

            const { count: aCount, error: aError } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true });
            if (aError) throw aError;

            const breakdown = {};
            profiles.forEach(p => {
                const b = p.branch || 'Not Specified';
                breakdown[b] = (breakdown[b] || 0) + 1;
            });

            setStats({
                totalUsers: profiles.length,
                totalSubjects: sCount || 0,
                totalAttendance: aCount || 0,
                branchCounts: Object.entries(breakdown).sort((a, b) => b[1] - a[1])
            });

            // Fetch actual branch list
            const { data: bList, error: bError } = await supabase
                .from('branches')
                .select('*')
                .order('name');
            if (bError) throw bError;
            setBranchesList(bList);

        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        if (!newBranchName.trim()) return;
        setIsActionLoading(true);
        try {
            const { data, error: bError } = await supabase
                .from('branches')
                .insert([{ name: newBranchName.trim() }])
                .select()
                .single();
            if (bError) throw bError;
            setBranchesList(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewBranchName('');
        } catch (err) {
            alert('Error adding branch: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUpdateBranch = async (e) => {
        e.preventDefault();
        if (!editingBranch || !editingBranch.name.trim()) return;
        setIsActionLoading(true);
        try {
            const { error: bError } = await supabase
                .from('branches')
                .update({ name: editingBranch.name.trim() })
                .eq('id', editingBranch.id);
            if (bError) throw bError;
            setBranchesList(prev => prev.map(b => b.id === editingBranch.id ? editingBranch : b).sort((a, b) => a.name.localeCompare(b.name)));
            setEditingBranch(null);
        } catch (err) {
            alert('Error updating branch: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteBranch = async (branchId, branchName) => {
        // Check if any students are enrolled in this branch
        const { count, error: cError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('branch', branchName);

        if (count > 0) {
            alert(`Cannot delete "${branchName}" because ${count} student(s) are currently enrolled in it.`);
            return;
        }

        if (!confirm(`Are you sure you want to delete the branch "${branchName}"?`)) return;

        setIsActionLoading(true);
        try {
            const { error: bError } = await supabase
                .from('branches')
                .delete()
                .eq('id', branchId);
            if (bError) throw bError;
            setBranchesList(prev => prev.filter(b => b.id !== branchId));
        } catch (err) {
            alert('Error deleting branch: ' + err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Statistics</h1>
                <p className="text-sm text-gray-500">High-level performance and usage metrics.</p>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
                    <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                    <p className="text-gray-500 font-medium">Calculating metrics...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start text-red-700">
                    <AlertCircle className="w-6 h-6 mr-3 mt-0.5" />
                    <p>{error}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <LayoutDashboard className="w-8 h-8 text-blue-500 mb-4" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global Subjects</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalSubjects}</h3>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Attendance Marks</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalAttendance}</h3>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <PieChart className="w-8 h-8 text-orange-500 mb-4" />
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Accounts</p>
                            <h3 className="text-4xl font-black text-gray-900 mt-1">{stats.totalUsers}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center mb-8">
                            <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                            <h3 className="text-xl font-bold text-gray-900">Branch distribution</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                {stats.branchCounts.map(([branch, count]) => (
                                    <div key={branch} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-gray-700">{branch}</span>
                                            <span className="text-xs font-medium text-gray-500">{count} Active</span>
                                        </div>
                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 rounded-full"
                                                style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-purple-50/50 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                                <BarChart className="w-16 h-16 text-purple-200 mb-4" />
                                <h4 className="text-lg font-bold text-purple-900">Deep Analytics</h4>
                                <p className="text-purple-700/70 text-sm mt-2 max-w-xs">
                                    More detailed charts and department-wise attendance trends are coming soon to this section.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center">
                                <Settings className="w-6 h-6 text-blue-600 mr-3" />
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Branch Management</h3>
                                    <p className="text-sm text-gray-500 font-medium">Add or edit available college branches.</p>
                                </div>
                            </div>
                            <form onSubmit={handleAddBranch} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    placeholder="Enter branch name (e.g., CIVIL)"
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all w-64"
                                />
                                <button
                                    type="submit"
                                    disabled={isActionLoading || !newBranchName.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Branch
                                </button>
                            </form>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {branchesList.map((branch) => (
                                    <div key={branch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group border border-transparent hover:border-gray-200 transition-all">
                                        {editingBranch && editingBranch.id === branch.id ? (
                                            <form onSubmit={handleUpdateBranch} className="flex-1 flex gap-2 mr-4">
                                                <input
                                                    type="text"
                                                    value={editingBranch.name}
                                                    onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    autoFocus
                                                />
                                                <button
                                                    type="submit"
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingBranch(null)}
                                                    className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold"
                                                >
                                                    Cancel
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                <div className="flex items-center">
                                                    <List className="w-4 h-4 text-gray-400 mr-3" />
                                                    <span className="text-gray-700 font-medium">{branch.name}</span>
                                                </div>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setEditingBranch(branch)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Edit branch name"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete branch"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminStats;
