import type { CakeProduct } from '@/lib/product-api';

type WishlistResponse = {
    is_favorite: boolean;
    product: CakeProduct;
};

type ResourceCollection<T> = {
    data: T[];
};

export async function listWishlist(userId: number): Promise<CakeProduct[]> {
    const response = await requestJson<ResourceCollection<CakeProduct>>(`/api/wishlists?user_id=${encodeURIComponent(String(userId))}`);

    return response.data;
}

export async function toggleWishlist(userId: number, productId: number): Promise<WishlistResponse> {
    return requestJson<WishlistResponse>('/api/wishlists/toggle', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            product_id: productId,
        }),
    });
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
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

    return 'Có lỗi xảy ra, vui lòng thử lại.';
}
