'use client';

/**
 * RelationLink Component
 * 
 * Displays a clickable count that navigates to a filtered child list.
 * Used for "Relation Drill-down" functionality in list views.
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Users, FileText } from 'lucide-react';

interface RelationLinkProps {
    /** The count to display */
    count: number;
    /** Target entity slug (e.g., "workers", "recruitment/job-orders") */
    targetEntity: string;
    /** Query parameter key for filtering (e.g., "employerId") */
    filterKey: string;
    /** The parent ID value to filter by */
    filterValue: string;
    /** Icon type to display */
    icon?: 'users' | 'document';
    /** Optional label for screen readers */
    label?: string;
}

export default function RelationLink({
    count,
    targetEntity,
    filterKey,
    filterValue,
    icon = 'users',
    label,
}: RelationLinkProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (count > 0) {
            router.push(`/${targetEntity}?${filterKey}=${filterValue}`);
        }
    };

    const IconComponent = icon === 'users' ? Users : FileText;

    if (count === 0) {
        return (
            <span className="text-slate-400 text-sm flex items-center gap-1">
                <IconComponent className="h-3.5 w-3.5" />
                0
            </span>
        );
    }

    return (
        <Badge
            variant="outline"
            className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-1"
            onClick={handleClick}
            title={label || `View ${count} related records`}
        >
            <IconComponent className="h-3 w-3" />
            {count}
        </Badge>
    );
}
