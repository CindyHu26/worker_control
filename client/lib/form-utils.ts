import { FieldConfig } from "../types/form-config";

/**
 * Transforms flat form submission data into a hybrid structure.
 * Fields marked with `isCore: false` are moved into an `attributes` object.
 *
 * @param data - The flat form data from react-hook-form
 * @param config - The field configuration array
 * @returns The transformed data object
 */
export function transformSubmission(data: Record<string, any>, config: FieldConfig[]) {
    const result: Record<string, any> = { attributes: {} };

    // Create a lookup map for field config for faster access
    const fieldMap = new Map<string, FieldConfig>();
    config.forEach(field => fieldMap.set(field.name, field));

    Object.entries(data).forEach(([key, value]) => {
        const field = fieldMap.get(key);

        // If field is found in config
        if (field) {
            if (field.isCore) {
                // Core field: goes to root
                result[key] = value;
            } else {
                // Non-core field: goes to attributes
                result.attributes[key] = value;
            }
        } else {
            // Extra fields (not in config) - decide behavior.
            // For now, let's assume they are core or separate logic.
            // But typically we only want strict fields.
            // To be safe, we can put unknown fields in root or drop them.
            // Let's put them in root to support "id", "createdAt" etc preservation if passed.
            result[key] = value;
        }
    });

    return result;
}
