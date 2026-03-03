import React, { useState } from 'react';
import { ShieldCheck, X, Key, AlertCircle, Loader2 } from 'lucide-react';

const AdminLoginModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsVerifying(true);

        // Simulate a tiny delay for "verifying" feel
        await new Promise(resolve => setTimeout(resolve, 800));

        if (password === 'ATTENDWISE@SAIKIRAN@45B4') {
            onConfirm();
            onClose();
            setPassword('');
        } else {
            setError('Invalid access key. Please try again.');
        }
        setIsVerifying(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative p-8 pb-0 text-center">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="inline-flex items-center justify-center w-full mb-6">
                        <img src="/admin_logo.png" alt="AttendAdmin Logo" className="h-32 w-auto object-contain" />
                    </div>

                    <h2 className="text-2xl font-black text-gray-900">Admin Access</h2>
                    <p className="text-gray-500 mt-2 font-medium px-4">
                        Please enter your secret system key to access the administrator dashboard.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 pt-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                autoFocus
                                type="password"
                                placeholder="Enter Access Key..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`
                                    w-full pl-12 pr-4 py-4 bg-gray-50 border rounded-2xl text-sm font-bold focus:ring-4 transition-all focus:outline-none
                                    ${error
                                        ? 'border-red-200 focus:ring-red-100 text-red-900'
                                        : 'border-gray-100 focus:ring-purple-100 focus:bg-white focus:border-purple-200 text-gray-900'}
                                `}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                {error}
                            </div>
                        )}

                        <button
                            disabled={isVerifying || !password}
                            className={`
                                w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg
                                ${isVerifying || !password
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-purple-200'}
                            `}
                        >
                            {isVerifying ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Verifying...
                                </span>
                            ) : (
                                'Unlock Dashboard'
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        System Security Node v4.5B4
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginModal;
