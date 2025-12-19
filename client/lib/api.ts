import Cookies from 'js-cookie';

/**
 * Centralized API utility that automatically attaches Authorization headers
 */

const API_BASE_URL = 'http://localhost:3001';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}


/**
 * Make an authenticated API request
 * @param url - API endpoint (e.g., '/api/employers' or full URL)
 * @param options - Fetch options
 * @returns Response object
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Prepend BASE_URL if url starts with /
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

    // Get token from cookies
    const token = Cookies.get('token');

    // Build headers - use Record type to allow string indexing
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    // Add Authorization header if token exists and not skipped
    if (token && !skipAuth) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Make request
    const response = await fetch(fullUrl, {
        ...restOptions,
        headers: requestHeaders,
    });

    return response;
}

/**
 * Make an authenticated API request and parse JSON response
 * Throws error with message if response is not ok
 */
export async function apiRequest<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    const response = await apiFetch(url, options);

    if (!response.ok) {
        // Try to parse error message from JSON
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * Shorthand for GET request
 */
export async function apiGet<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    return apiRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * Shorthand for POST request
 */
export async function apiPost<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
    return apiRequest<T>(url, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Shorthand for PUT request
 */
export async function apiPut<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
    return apiRequest<T>(url, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Shorthand for PATCH request
 */
export async function apiPatch<T = any>(url: string, data: any, options: FetchOptions = {}): Promise<T> {
    return apiRequest<T>(url, {
        ...options,
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

/**
 * Shorthand for DELETE request
 */
export async function apiDelete<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    return apiRequest<T>(url, { ...options, method: 'DELETE' });
}
