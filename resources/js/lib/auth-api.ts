export type AuthUser = {
    id: number;
    username: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    login_by_google?: boolean;
    full_name?: string | null;
    phone_number?: string | null;
    delivery_address?: string | null;
    delivery_district?: string | null;
};

type AuthResponse = {
    message: string;
    user: AuthUser;
};

type MessageResponse = {
    message: string;
};

type UserProfilePayload = Partial<
    Pick<AuthUser, 'name' | 'username' | 'email' | 'full_name' | 'phone_number' | 'delivery_address' | 'delivery_district'>
>;

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

export async function register(payload: { username: string; email: string; password: string }): Promise<AuthResponse> {
    return postJson<AuthResponse>('/api/register', payload);
}

export async function googleLogin(payload: { credential: string }): Promise<AuthResponse> {
    return postJson<AuthResponse>('/api/login/google', payload);
}

export async function changePassword(payload: { username: string; email: string; new_password: string }): Promise<MessageResponse> {
    return postJson<MessageResponse>('/api/forgot-password', payload);
}

export async function updateUserProfile(userId: number, payload: UserProfilePayload): Promise<AuthResponse> {
    return requestJson<AuthResponse>(`/api/users/${encodeURIComponent(String(userId))}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
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
    return requestJson<T>(url, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

async function requestJson<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...options.headers,
        },
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
