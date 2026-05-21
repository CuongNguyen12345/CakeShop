export type ProductCategory = {
    id: number;
    name: string;
    slug: string;
    products_count?: number;
};

export type CakeProduct = {
    id: number;
    category_id: number;
    name: string;
    description?: string | null;
    price: number;
    price_formatted: string;
    image_url?: string | null;
    size_inch?: number | null;
    stock_quantity: number;
    tag?: string | null;
    is_available: boolean;
    category?: ProductCategory;
};

type ResourceCollection<T> = {
    data: T[];
};

type CategoryResponse = {
    message: string;
    category: ProductCategory;
};

type ProductResponse = {
    message: string;
    product: CakeProduct;
};

export async function listCategories(): Promise<ProductCategory[]> {
    const response = await requestJson<ResourceCollection<ProductCategory>>('/api/categories');

    return response.data;
}

export async function createCategory(payload: { name: string }): Promise<ProductCategory> {
    const response = await requestJson<CategoryResponse>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    return response.category;
}

export async function deleteCategory(categoryId: number): Promise<void> {
    await requestJson<{ message: string }>(`/api/categories/${categoryId}`, {
        method: 'DELETE',
    });
}

export async function listProducts(): Promise<CakeProduct[]> {
    const response = await requestJson<ResourceCollection<CakeProduct>>('/api/products');

    return response.data;
}

export async function createProduct(payload: {
    category_id: number;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    size_inch?: number;
    stock_quantity?: number;
    tag?: string;
    is_available: boolean;
}): Promise<CakeProduct> {
    const response = await requestJson<ProductResponse>('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    return response.product;
}

export async function updateProduct(
    productId: number,
    payload: {
        category_id: number;
        name: string;
        description?: string;
        price: number;
        image_url?: string;
        size_inch?: number;
        stock_quantity?: number;
        tag?: string;
        is_available: boolean;
    },
): Promise<CakeProduct> {
    const response = await requestJson<{ data: CakeProduct }>(`/api/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    return response.data;
}

export async function deleteProduct(productId: number): Promise<void> {
    await requestJson<{ message: string }>(`/api/products/${productId}`, {
        method: 'DELETE',
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

    return 'Co loi xay ra, vui long thu lai.';
}
