import React, { ReactNode } from 'react';

/**
 * Standard Table Wrapper for consistent horizontal scrolling
 * Usage: <TableWrapper><Table>...</Table></TableWrapper>
 */
export function TableWrapper({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`w-full max-w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white ${className}`}>
            {children}
        </div>
    );
}
