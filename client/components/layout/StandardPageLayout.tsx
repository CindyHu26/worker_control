"use client";

import { ReactNode } from 'react';

interface StandardPageLayoutProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
}

/**
 * StandardPageLayout - Universal layout shell for all administrative pages
 * 
 * Provides:
 * - Fixed header with title and actions
 * - Scrollable content area (fixes viewport overflow bug)
 * - Consistent spacing and responsive design
 */
export default function StandardPageLayout({
    title,
    description,
    actions,
    children
}: StandardPageLayoutProps) {
    return (
        <div className="flex flex-col h-full">
            {/* Header Section - Fixed */}
            <div className="flex-none border-b bg-white">
                <div className="px-4 py-6 md:px-6">
                    <div className="flex items-start justify-between gap-4">
                        {/* Title Area */}
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Actions Area */}
                        {actions && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Section - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                <div className="px-4 py-6 md:px-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
