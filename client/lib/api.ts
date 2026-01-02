import Cookies from 'js-cookie';
import { toast } from 'sonner';

/**
 * Centralized API utility that automatically attaches Authorization headers
 * with global error handling and user-friendly toast notifications
 */

const API_BASE_URL = 'http://localhost:3001';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
    skipErrorToast?: boolean; // Allow individual requests to suppress toasts
}


/**
 * Make an authenticated API request
 * @param url - API endpoint (e.g., '/api/employers' or full URL)
 * @param options - Fetch options
 * @returns Response object
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const { skipAuth = false, skipErrorToast = false, headers = {}, ...restOptions } = options;

    // Use relative path to leverage Next.js proxy (avoids CORS and port issues)
    const fullUrl = url;

    // Get token from cookies or localStorage (fallback)
    const token = Cookies.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

    // Build headers - use Record type to allow string indexing
    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    };

    // Add Authorization header if token exists and not skipped
    if (token && !skipAuth) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Make request with network error handling
    try {
        const response = await fetch(fullUrl, {
            ...restOptions,
            headers: requestHeaders,
        });
        return response;
    } catch (networkError) {
        // Case D: Network Error (Backend down or no internet)
        console.error('Network Error:', networkError);
        if (!skipErrorToast) {
            toast.error('無法連線至伺服器，請檢查網路 (Cannot connect to server)');
        }
        throw networkError;
    }
}

/**
 * Make an authenticated API request and parse JSON response
 * Handles errors globally with user-friendly toast notifications
 */
export async function apiRequest<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    const { skipErrorToast = false, ...restOptions } = options;
    const response = await apiFetch(url, { ...restOptions, skipErrorToast });

    if (!response.ok) {
        // Try to parse error message from JSON
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
            // If parsing fails, use status text
            errorMessage = response.statusText || errorMessage;
        }

        // Handle different error status codes with appropriate UI feedback
        switch (response.status) {
            case 401:
                // Case A: 401 Unauthorized (Invalid/Expired Token)
                console.error('Auth Error: Token invalid or expired');
                if (!skipErrorToast) {
                    toast.error('登入憑證已過期，請重新登入 (Session expired, please login again)');
                }
                // Clear all auth data
                Cookies.remove('token');
                Cookies.remove('user');
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    // Small delay to allow toast to show before redirect
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1500);
                }
                break;

            case 403:
                // Case B: 403 Forbidden (No Permission)
                console.error('Permission Error:', errorMessage);
                if (!skipErrorToast) {
                    toast.error('您沒有權限執行此動作 (Permission Denied)');
                }
                break;

            case 500:
                // Case C: 500 Internal Server Error
                console.error('Server Error:', errorMessage);
                if (!skipErrorToast) {
                    toast.error('系統發生內部錯誤，工程師已收到通知 (Internal System Error)');
                }
                break;

            default:
                // Other errors (400, 404, etc.)
                console.error(`API Error (${response.status}):`, errorMessage);
                if (!skipErrorToast) {
                    toast.error(errorMessage);
                }
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
