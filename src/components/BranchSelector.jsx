import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, GraduationCap, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const BranchSelector = ({ value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [branches, setBranches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        fetchBranches();

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const { data, error: bError } = await supabase
                .from('branches')
                .select('name')
                .order('name');
            if (bError) throw bError;
            setBranches(data.map(b => b.name));

            // If current value is not in the list and list is not empty, 
            // maybe we should default to something or just leave it?
            // For now, let's keep it as is.
        } catch (err) {
            console.error('Error fetching branches:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedBranch = value || "Select Branch";

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative w-full bg-white border px-4 py-3 text-left cursor-default rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all sm:text-sm",
                    error ? "border-red-300" : "border-gray-300",
                    isOpen ? "ring-2 ring-blue-500 border-blue-500" : "hover:border-gray-400"
                )}
            >
                <span className="flex items-center">
                    <GraduationCap className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3" />
                    <span className="block truncate font-medium text-gray-900">
                        {selectedBranch}
                    </span>
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className={cn(
                        "w-5 h-5 text-gray-400 transition-transform duration-200",
                        isOpen && "transform rotate-180"
                    )} />
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white shadow-2xl max-h-60 rounded-2xl py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    {isLoading ? (
                        <div className="py-4 text-center text-gray-500 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading branches...
                        </div>
                    ) : branches.length === 0 ? (
                        <div className="py-4 text-center text-gray-400">No branches available</div>
                    ) : (
                        branches.map((branch) => (
                            <div
                                key={branch}
                                className={cn(
                                    "relative cursor-default select-none py-3 pl-10 pr-4 hover:bg-blue-50 transition-colors group",
                                    branch === value ? "bg-blue-50/50" : "text-gray-900"
                                )}
                                onClick={() => {
                                    onChange(branch);
                                    setIsOpen(false);
                                }}
                            >
                                <span className={cn(
                                    "block truncate",
                                    branch === value ? "font-bold text-blue-600" : "font-normal group-hover:text-blue-600"
                                )}>
                                    {branch}
                                </span>

                                {branch === value && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <Check className="w-5 h-5" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default BranchSelector;
