import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        if (!email.endsWith('@vishnu.edu.in')) {
            setError('Only @vishnu.edu.in email addresses are allowed.');
            setIsLoading(false);
            return;
        }

        const { error: resetError } = await resetPassword(email);

        if (resetError) {
            setError(resetError.message);
        } else {
            setSuccess(true);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-inter">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900">Reset Password</h2>
                    <p className="mt-2 text-center text-sm text-gray-500 font-medium">
                        We'll send a link to your email to reset your password.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl flex items-start animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {success ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                        <div className="bg-green-50 p-6 rounded-2xl flex flex-col items-center text-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                            <p className="text-sm text-green-800 font-bold">Email Sent!</p>
                            <p className="text-xs text-green-600 mt-1">Please check your inbox for the reset link.</p>
                        </div>
                        <Link
                            to="/login"
                            className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Sign In
                        </Link>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="you@vishnu.edu.in"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <Link
                            to="/login"
                            className="flex items-center justify-center w-full text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Login
                        </Link>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
