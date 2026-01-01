
import React from 'react';
import { SmartInput } from './SmartInput';
import { SmartSelect } from './SmartSelect';

export interface FieldDefinition {
    name: string;
    label: string;
    type: 'text' | 'date' | 'select' | 'number' | 'text-area';
    required?: boolean;
    core?: boolean;
    options?: { label: string; value: string }[];
    placeholder?: string;
    group?: string; // Added group property
}

export const SmartField = (field: FieldDefinition) => {
    switch (field.type) {
        case 'select':
            return <SmartSelect {...field} />;
        case 'date':
            // Reuse SmartInput with type='date' for now, or create dedicated SmartDate
            return <SmartInput {...field} type="date" />;
        case 'number':
            return <SmartInput {...field} type="number" />;
        case 'text':
        default:
            return <SmartInput {...field} />;
    }
};
