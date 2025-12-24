import React, { ReactNode } from 'react';

interface TableWrapperProps {
    children: ReactNode;
}

/**
 * Standard Table Wrapper to handle horizontal overflow
 * Use this to wrap <Table> components in list views
 */
export default function TableWrapper({ children }: TableWrapperProps) {
    return (
        <div className="w-full max-w-full overflow-x-auto border rounded-md bg-white">
            {children}
        </div>
    );
}
