export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface FieldConfig {
    name: string;
    label: string;
    type: FieldType;
    /**
     * Critical! If true, it maps to the root object.
     * If false, it maps to the `attributes` object (JSONB).
     */
    isCore: boolean;
    options?: { label: string; value: string }[];
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
    };
    /**
     * Group identifier for UI layout (e.g., 'basic', 'passport', 'deployment', 'personal')
     */
    group?: string;
    className?: string;
}
