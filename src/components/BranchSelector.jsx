import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, GraduationCap } from 'lucide-react';
import { BRANCHES } from '../utils/branches';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const BranchSelector = ({ value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedBranch = BRANCHES.find(b => b === value) || BRANCHES[0];

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
                    {BRANCHES.map((branch) => (
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default BranchSelector;
