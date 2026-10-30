import React, { useEffect, useRef } from 'react';

/**
 * AdPlaceholder component for the bottom ad banner slot
 * Configured with Google AdSense Publisher: ca-pub-3061018181237771 and Slot: 1473158835
 */
const AdPlaceholder = ({
    slot = '1473158835',
    client = 'ca-pub-3061018181237771',
    className = ''
}) => {
    const adInitialized = useRef(false);

    useEffect(() => {
        // Prevent duplicate adsbygoogle.push calls on re-renders
        if (!adInitialized.current && typeof window !== 'undefined') {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adInitialized.current = true;
            } catch (err) {
                console.warn('AdSense notice:', err);
            }
        }
    }, [slot, client]);

    return (
        <div className={`w-full max-w-7xl mx-auto px-4 lg:px-8 mb-6 ${className}`}>
            <div
                id={`ad-slot-${slot}`}
                className="relative w-full rounded-2xl border border-gray-200/90 bg-white p-3 min-h-[90px] md:min-h-[105px] flex flex-col items-center justify-center text-center shadow-sm overflow-hidden"
            >
                {/* Small sponsored label */}
                <div className="w-full flex justify-end mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60">
                        Advertisement
                    </span>
                </div>

                {/* Google Ad Tag */}
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '100%', minHeight: '90px' }}
                    data-ad-client={client}
                    data-ad-slot={slot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                />
            </div>
        </div>
    );
};

export default AdPlaceholder;
