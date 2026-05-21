export type AuthUser = {
    id: number;
    username: string;
    phone_number?: string | null;
    role?: string | null;
    login_by_google?: boolean;
};

type AuthResponse = {
    message: string;
    user: AuthUser;
};

type MessageResponse = {
    message: string;
};

export class ApiRequestError extends Error {
    public errors: Record<string, string[]>;

    public constructor(message: string, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = 'ApiRequestError';
        this.errors = errors;
    }
}

export async function login(payload: { username: string; password: string }): Promise<AuthResponse> {
    return postJson<AuthResponse>('/api/login', payload);
}

export async function register(payload: { username: string; phone_number: string; password: string }): Promise<AuthResponse> {
    return postJson<AuthResponse>('/api/register', payload);
}

export async function changePassword(payload: { username: string; phone_number: string; new_password: string }): Promise<MessageResponse> {
    return postJson<MessageResponse>('/api/forgot-password', payload);
}

export function rememberAuthUser(user: AuthUser): void {
    localStorage.setItem('fleur-auth-user', JSON.stringify(user));
    window.dispatchEvent(new Event('fleur-auth-updated'));
}

export function readAuthUser(): AuthUser | null {
    const rawUser = localStorage.getItem('fleur-auth-user');

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser) as AuthUser;
    } catch {
        localStorage.removeItem('fleur-auth-user');

        return null;
    }
}

export function forgetAuthUser(): void {
    localStorage.removeItem('fleur-auth-user');
    window.dispatchEvent(new Event('fleur-auth-updated'));
}

export function isAdminUser(user: AuthUser | null): boolean {
    return user?.role?.toLowerCase() === 'admin';
}

async function postJson<T>(url: string, payload: object): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errors = getValidationErrors(data);
        throw new ApiRequestError(getErrorMessage(data, errors), errors);
    }

    return data as T;
}

function getValidationErrors(data: unknown): Record<string, string[]> {
    if (typeof data !== 'object' || data === null || !('errors' in data)) {
        return {};
    }

    const errors = (data as { errors: unknown }).errors;

    return typeof errors === 'object' && errors !== null ? (errors as Record<string, string[]>) : {};
}

function getErrorMessage(data: unknown, errors: Record<string, string[]>): string {
    if (Object.keys(errors).length > 0) {
        return Object.values(errors).flat()[0] ?? 'Dữ liệu chưa hợp lệ.';
    }

    if (typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
        return (data as { message: string }).message;
    }

    return 'Có lỗi xảy ra, vui lòng thử lại.';
}
