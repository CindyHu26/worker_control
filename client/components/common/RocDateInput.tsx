import React, { useState, useEffect, forwardRef, ChangeEvent } from 'react';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RocDateInputProps extends Omit<InputProps, 'onChange' | 'value'> {
    value?: string; // ISO Date "YYYY-MM-DD"
    onChange?: (value: string) => void;
    // placeholder?: string;
}

// Helper: 2024-01-01 -> 113/01/01
const toRoc = (isoDate: string | undefined): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';
    
    // Ensure we parse YYYY-MM-DD correctly in local time (or treat as UTC to avoid shift)
    // Actually, isoDate "YYYY-MM-DD" is best parsed by splitting strings to avoid timezone issues.
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return '';
    
    const rocYear = y - 1911;
    const mm = m.toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    return `${rocYear}/${mm}/${dd}`;
};

// Helper: 113/01/01 -> 2024-01-01
// Also accepts 1130101
const fromRoc = (rocStr: string): string | null => {
    const clean = rocStr.replace(/[^0-9]/g, '');
    if (clean.length < 6 || clean.length > 7) return null;

    let y, m, d;
    if (clean.length === 7) {
        y = parseInt(clean.substring(0, 3));
        m = parseInt(clean.substring(3, 5));
        d = parseInt(clean.substring(5, 7));
    } else { // length 6, e.g. 990101
        y = parseInt(clean.substring(0, 2));
        m = parseInt(clean.substring(2, 4));
        d = parseInt(clean.substring(4, 6));
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) return null;

    const westYear = y + 1911;
    const mm = m.toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    
    // Validate date exists (e.g. Feb 30)
    const date = new Date(`${westYear}-${mm}-${dd}`);
    if (isNaN(date.getTime()) || date.getDate() !== d) return null;

    return `${westYear}-${mm}-${dd}`;
};

const RocDateInput = forwardRef<HTMLInputElement, RocDateInputProps>(
    ({ value, onChange, className, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState('');
        const [error, setError] = useState(false);

        // Sync internal state with external prop
        useEffect(() => {
            setDisplayValue(toRoc(value));
        }, [value]);

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setDisplayValue(val);

            if (!val) {
                setError(false);
                onChange?.('');
                return;
            }

            const iso = fromRoc(val);
            if (iso) {
                setError(false);
                onChange?.(iso);
            } else {
                setError(true);
                // Don't propagate invalid changes to parent if they expect valid ISO
                // Or maybe propagate partial? No, keep it specific.
            }
        };

        const handleBlur = () => {
             // Optional: Format input on blur (e.g. 1130101 -> 113/01/01)
             if (displayValue && !error) {
                 const iso = fromRoc(displayValue);
                 if (iso) {
                     setDisplayValue(toRoc(iso));
                 }
             }
        };

        return (
            <div className="relative">
                <Input
                    ref={ref}
                    {...props}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="例: 112/01/01"
                    className={cn(error && "border-red-500 focus-visible:ring-red-500", className)}
                />
                {error && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500 bg-white px-1">
                        格式錯誤
                    </span>
                )}
            </div>
        );
    }
);

RocDateInput.displayName = "RocDateInput";

export default RocDateInput;
