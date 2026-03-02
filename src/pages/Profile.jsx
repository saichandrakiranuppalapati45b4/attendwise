import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Save, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const Profile = () => {
    const { user } = useAuth();

    // Profile State
    const [profile, setProfile] = useState({ name: '', required_percentage: 75, sem_end_date: '' });
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState(null);

    // Subjects State
    const [subjects, setSubjects] = useState([]);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [pastConducted, setPastConducted] = useState('');
    const [pastAttended, setPastAttended] = useState('');
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchProfileAndSubjects();
        }
    }, [user]);

    const fetchProfileAndSubjects = async () => {
        setIsLoading(true);
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            if (profileData) setProfile(profileData);

            // Fetch Subjects
            const { data: subjectsData, error: subjectsError } = await supabase
                .from('subjects')
                .select('*')
                .order('created_at', { ascending: true });

            if (subjectsError) throw subjectsError;
            if (subjectsData) setSubjects(subjectsData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileMessage(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: profile.name,
                    required_percentage: parseInt(profile.required_percentage, 10),
                    sem_end_date: profile.sem_end_date || null
                })
                .eq('id', user.id);

            if (error) throw error;
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: error.message });
        } finally {
            setIsSavingProfile(false);
            setTimeout(() => setProfileMessage(null), 3000);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;

        setIsAddingSubject(true);
        try {
            const { data, error } = await supabase
                .from('subjects')
                .insert([{
                    user_id: user.id,
                    subject_name: newSubjectName.trim(),
                    subject_code: newSubjectCode.trim() || newSubjectName.trim().substring(0, 3).toUpperCase(),
                    past_conducted: parseInt(pastConducted || 0, 10),
                    past_attended: parseInt(pastAttended || 0, 10)
                }])
                .select();

            if (error) throw error;
            if (data) {
                setSubjects([...subjects, data[0]]);
                setNewSubjectName('');
                setNewSubjectCode('');
                setPastConducted('');
                setPastAttended('');
            }
        } catch (error) {
            console.error('Error adding subject:', error);
            alert('Failed to add subject.');
        } finally {
            setIsAddingSubject(false);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!confirm('Are you sure you want to delete this subject? All related attendance and timetable records will also be deleted.')) return;

        try {
            const { error } = await supabase
                .from('subjects')
                .delete()
                .eq('id', subjectId);

            if (error) throw error;
            setSubjects(subjects.filter(s => s.id !== subjectId));
        } catch (error) {
            console.error('Error deleting subject:', error);
            alert('Failed to delete subject.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="mt-1 text-sm text-gray-500">Manage your account details and subjects.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-medium text-gray-900">Account Details</h3>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input
                                    type="email"
                                    disabled
                                    value={user?.email || ''}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed sm:text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={profile.name || ''}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">
                                    Required Attendance (%)
                                </label>
                                <input
                                    type="number"
                                    id="percentage"
                                    min="1"
                                    max="100"
                                    value={profile.required_percentage || 75}
                                    onChange={(e) => setProfile({ ...profile, required_percentage: e.target.value })}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    required
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    This target is used to calculate your safe absence limits.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="sem_end_date" className="block text-sm font-medium text-gray-700">
                                    Semester End Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    id="sem_end_date"
                                    value={profile.sem_end_date || ''}
                                    onChange={(e) => setProfile({ ...profile, sem_end_date: e.target.value })}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Set this to predict how many classes you can miss until the semester ends.
                                </p>
                            </div>

                            {profileMessage && (
                                <div className={`p-3 rounded-lg flex items-center text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {profileMessage.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {profileMessage.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                                >
                                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Subjects Management Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-medium text-gray-900">Manage Subjects</h3>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        <form onSubmit={handleAddSubject} className="space-y-4 mb-6 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Subject Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Mathematics"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        required
                                    />
                                </div>
                                <div className="sm:w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Short Code</label>
                                    <input
                                        type="text"
                                        placeholder="e.g., MATH"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all uppercase"
                                        maxLength={6}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Past Periods Held (Optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 20"
                                        value={pastConducted}
                                        onChange={(e) => setPastConducted(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Past Periods Attended (Optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 18"
                                        value={pastAttended}
                                        onChange={(e) => setPastAttended(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isAddingSubject || !newSubjectName.trim()}
                                    className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all h-[42px]"
                                >
                                    {isAddingSubject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    <span className="ml-2 inline">Add Subject</span>
                                </button>
                            </div>
                        </form>

                        <div className="flex-1 overflow-y-auto min-h-[200px]">
                            {subjects.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                                    <span className="text-4xl text-gray-300">📚</span>
                                    <p className="text-sm">No subjects added yet.</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {subjects.map((subject) => (
                                        <li
                                            key={subject.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-100 transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center">
                                                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md mr-3 min-w-[3rem]">
                                                        {subject.subject_code || subject.subject_name.substring(0, 3).toUpperCase()}
                                                    </span>
                                                    <span className="font-medium text-gray-700">{subject.subject_name}</span>
                                                </div>
                                                {(subject.past_conducted > 0 || subject.past_attended > 0) && (
                                                    <span className="text-xs text-gray-500 mt-1 ml-16">
                                                        Past Records: {subject.past_attended || 0} Attended / {subject.past_conducted || 0} Held
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteSubject(subject.id)}
                                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Delete subject"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
