import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    ShieldCheck,
    Tv,
    CheckCircle2,
    Loader2,
    LogOut,
    ArrowRight
} from 'lucide-react';

const AdAgreementModal = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [hasAccepted, setHasAccepted] = useState(true); // default true to avoid flash before check
    const [isChecking, setIsChecking] = useState(true);
    const [isChecked, setIsChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setIsChecking(false);
            return;
        }

        checkAdAgreementStatus();
    }, [user]);

    const checkAdAgreementStatus = async () => {
        setIsChecking(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('has_accepted_ads')
                .eq('id', user.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            // If profile exists and has_accepted_ads is explicitly true, hide modal
            if (data && data.has_accepted_ads === true) {
                setHasAccepted(true);
            } else {
                // Either false, null, or profile pending creation
                setHasAccepted(false);
            }
        } catch (err) {
            console.error('Error checking ad agreement status:', err);
            // Default to requiring acceptance if check fails
            setHasAccepted(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleAcceptAgreement = async () => {
        if (!isChecked || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ has_accepted_ads: true })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Successfully accepted
            setHasAccepted(true);
        } catch (err) {
            console.error('Error saving ad agreement:', err);
            setError(err.message || 'Failed to save agreement. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeclineAndSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (err) {
            console.error('Error signing out:', err);
        }
    };

    // If still checking initial state or user already accepted, don't show modal
    if (isChecking || hasAccepted) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                {/* Header Banner */}
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4 shadow-lg shadow-blue-900/20">
                        <Tv className="w-8 h-8 text-white" />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Free Access Agreement
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Welcome to AttendWise!
                    </h2>
                    <p className="mt-2 text-blue-100 text-sm font-medium">
                        Please review and confirm our ad-supported agreement to activate your account.
                    </p>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Information Box */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100/80">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700 leading-snug">
                                <span className="font-bold text-gray-900">100% Free Forever:</span> AttendWise provides real-time attendance calculations, safe absence predictions, and timetables without any subscription fees.
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100/80">
                            <Tv className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700 leading-snug">
                                <span className="font-bold text-gray-900">Supported by Ads:</span> In exchange for free access, you agree to watch and view non-intrusive sponsor ads displayed within the app.
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100/80">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-gray-700 leading-snug">
                                <span className="font-bold text-gray-900">Fair Use Policy:</span> Disabling ad blockers ensures continuous feature updates and uninterrupted service for all students.
                            </div>
                        </div>
                    </div>

                    {/* Checkbox Agreement */}
                    <label className="flex items-start gap-3.5 p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-300 bg-gray-50/60 cursor-pointer transition-all select-none group">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="w-5 h-5 mt-0.5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 cursor-pointer transition-all"
                        />
                        <div className="text-sm text-gray-700 leading-snug">
                            <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                I confirm and agree to watch and display advertisements
                            </span>{' '}
                            while using AttendWise to keep this service free.
                        </div>
                    </label>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-2">
                        <button
                            type="button"
                            onClick={handleAcceptAgreement}
                            disabled={!isChecked || isSubmitting}
                            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all duration-200 ${
                                isChecked && !isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99] cursor-pointer'
                                    : 'bg-gray-300 shadow-none cursor-not-allowed opacity-70'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Activating Account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Accept Agreement & Enter App</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleDeclineAndSignOut}
                            className="w-full py-2.5 px-4 text-xs font-semibold text-gray-500 hover:text-red-600 flex items-center justify-center gap-1.5 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Decline and Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdAgreementModal;

