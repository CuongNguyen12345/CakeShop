import type { OrderPaymentStatusResponse } from '@/lib/payment-api';

export type AdminOrder = OrderPaymentStatusResponse & {
    id: number;
    code: string;
    customer_name: string;
    customer_phone: string;
    customer_address?: string | null;
    customer_district?: string | null;
    customer_note?: string | null;
    shipping_address: string;
    total_amount: number;
    created_date?: string | null;
};

export type OrderStatusMap = Record<string, string>;

type ListOrdersResponse = {
    data: AdminOrder[];
    statuses: OrderStatusMap;
};

type UpdateOrderStatusResponse = {
    message: string;
    order: AdminOrder;
};

export async function listOrders(): Promise<ListOrdersResponse> {
    return requestJson<ListOrdersResponse>('/api/orders');
}

export async function updateOrderStatus(orderCode: string, orderStatus: string): Promise<AdminOrder> {
    const response = await requestJson<UpdateOrderStatusResponse>(`/api/orders/${encodeURIComponent(orderCode)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ order_status: orderStatus }),
    });

    return response.order;
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
