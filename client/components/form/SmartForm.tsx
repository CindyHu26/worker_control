'use client';

import React, { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { SmartField } from '@/components/ui/smart-form/SmartField';
import { FieldConfig } from '../../types/form-config';

import { transformSubmission } from '@/lib/form-utils';

interface SmartFormProps {
    config: FieldConfig[];
    defaultValues?: any;
    onSubmit: (data: any) => void;
    submitLabel?: string;
    className?: string;
    /** When true, all fields are disabled and submit button is hidden */
    readonly?: boolean;
}

export default function SmartForm({
    config,
    defaultValues = {},
    onSubmit,
    submitLabel = 'Submit',
    className,
    readonly = false
}: SmartFormProps) {
    // 1. Dynamic Zod Schema Generation
    const formSchema = useMemo(() => {
        const shape: Record<string, z.ZodTypeAny> = {};

        config.forEach((field) => {
            let fieldSchema: z.ZodTypeAny;

            switch (field.type) {
                case 'number':
                    fieldSchema = z.coerce.number(); // Use coerce to handle string input for numbers
                    if (field.validation?.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min);
                    if (field.validation?.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max);
                    break;
                case 'date':
                    // Basic date string validation or coerce to date object if needed
                    // For now keeping it simple as string
                    fieldSchema = z.string();
                    break;
                case 'boolean':
                    fieldSchema = z.boolean();
                    break;
                case 'text':
                case 'select':
                default:
                    fieldSchema = z.string();
                    break;
            }

            if (field.validation?.required) {
                if (field.type === 'text' || field.type === 'select' || field.type === 'date') {
                    fieldSchema = (fieldSchema as z.ZodString).min(1, { message: `${field.label} is required` });
                }
                // For boolean/number, simple existence check (usually implied by type unless optional)
            } else {
                fieldSchema = fieldSchema.optional();
            }

            shape[field.name] = fieldSchema;
        });

        return z.object(shape);
    }, [config]);

    // 2. Form Initialization
    const methods = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const { handleSubmit } = methods;

    // Handle Submission with Transformation
    const onFormSubmit = (data: any) => {
        const transformedData = transformSubmission(data, config);
        onSubmit(transformedData);
    };

    // 3. Render
    return (
        <FormProvider {...methods}>
            <Form {...methods}>
                <form onSubmit={handleSubmit(onFormSubmit)} className={`space-y-6 ${className}`}>
                    {/* Form Fields */}
                    <fieldset disabled={readonly} className={readonly ? 'opacity-80' : ''}>
                        <div className="space-y-6">
                            {config.map((field) => (
                                <SmartField
                                    key={field.name}
                                    name={field.name}
                                    label={field.label}
                                    type={field.type as any} // Cast because FieldType vs SmartField type might slightly differ
                                    required={field.validation?.required}
                                    options={field.options}
                                    core={field.isCore}
                                    placeholder={readonly ? undefined : `Enter ${field.label}`}
                                    group={field.group}
                                />
                            ))}
                        </div>
                    </fieldset>

                    {/* Submit Button - Hidden in readonly mode */}
                    {!readonly && (
                        <Button type="submit">{submitLabel}</Button>
                    )}
                </form>
            </Form>
        </FormProvider>
    );
}
