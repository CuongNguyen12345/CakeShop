export type CustomCakeStatusMap = Record<string, string>;

export type CustomCakeRequest = {
    id: number;
    user_id?: number | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    cake_size?: string | null;
    flavor?: string | null;
    servings?: number | null;
    desired_date?: string | null;
    budget?: number | null;
    budget_formatted?: string | null;
    text_on_cake?: string | null;
    accessories?: string | null;
    reference_image_url?: string | null;
    note?: string | null;
    estimated_price?: number | null;
    estimated_price_formatted?: string | null;
    status: string;
    status_label: string;
    admin_note?: string | null;
    quoted_at?: string | null;
    converted_order_id?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    user?: {
        id: number;
        username?: string | null;
        email?: string | null;
        full_name?: string | null;
    };
};

type CustomCakeCollectionResponse = {
    data: CustomCakeRequest[];
    statuses: CustomCakeStatusMap;
};

type CustomCakeStoreResponse = {
    message: string;
    custom_cake: CustomCakeRequest;
};

export type CustomCakeListFilters = {
    user_id?: number;
    status?: string;
};

export async function listCustomCakes(filters: CustomCakeListFilters = {}): Promise<CustomCakeCollectionResponse> {
    return requestJson<CustomCakeCollectionResponse>(`/api/custom-cakes${buildQueryString(filters)}`);
}

export async function createCustomCake(payload: FormData): Promise<CustomCakeRequest> {
    const response = await requestJson<CustomCakeStoreResponse>('/api/custom-cakes', {
        method: 'POST',
        body: payload,
    });

    return response.custom_cake;
}

export async function updateCustomCake(
    customCakeId: number,
    payload: {
        status: string;
        estimated_price?: number | null;
        admin_note?: string | null;
    },
): Promise<CustomCakeRequest> {
    const response = await requestJson<{ data: CustomCakeRequest }>(`/api/custom-cakes/${customCakeId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

function buildQueryString(filters: CustomCakeListFilters): string {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();

    return queryString ? `?${queryString}` : '';
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    headers.set('Accept', 'application/json');

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(getResponseMessage(data));
    }

    return data as T;
}

function getResponseMessage(data: unknown): string {
    if (typeof data === 'object' && data !== null && 'errors' in data) {
        const errors = (data as { errors: Record<string, string[]> }).errors;
        const firstError = Object.values(errors).flat()[0];

        if (firstError) {
            return firstError;
        }
    }

    if (typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
        return (data as { message: string }).message;
    }

    return 'Co loi xay ra, vui long thu lai.';
}
