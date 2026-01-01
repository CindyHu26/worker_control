
import React from 'react';
import { useFormContext } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface SmartInputProps {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
}

export const SmartInput = ({ name, label, type = "text", placeholder, required }: SmartInputProps) => {
    const { control } = useFormContext();
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>{label}</FormLabel>
                    <FormControl>
                        <Input type={type} placeholder={placeholder} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
