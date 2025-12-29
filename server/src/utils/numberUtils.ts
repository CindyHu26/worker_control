
/**
 * Safely parse a value into a number.
 * Returns undefined if the input is null, undefined, empty string, or results in NaN.
 * 
 * @param value - Input value to parse
 * @returns number or undefined
 */
export function parseNumber(value: string | number | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;

    const num = Number(value);
    return isNaN(num) ? undefined : num;
}

/**
 * Safely parse a value into a number, returning a default value if parsing fails.
 * 
 * @param value - Input value to parse
 * @param defaultValue - Value to return if parsing fails (default: 0)
 * @returns number
 */
export function parseNumberOrDefault(value: string | number | null | undefined, defaultValue: number = 0): number {
    const parsed = parseNumber(value);
    return parsed !== undefined ? parsed : defaultValue;
}
