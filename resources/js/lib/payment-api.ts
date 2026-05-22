export type PaymentMethod = 'bank' | 'cod';

export type OrderItem = {
    id: number;
    product_id?: number | null;
    name: string;
    description?: string | null;
    image_url?: string | null;
    quantity: number;
    price: number;
    line_total: number;
};

export type OrderTimelineItem = {
    status: string;
    label: string;
    state: 'done' | 'active' | 'pending';
    note: string;
};

type BankPaymentInfo = {
    code: string;
    account_number: string;
    account_name?: string;
    transfer_content: string;
    qr_url: string;
};

type CheckoutPaymentResponse = {
    message: string;
    order_code: string;
    payment_method: PaymentMethod;
    payment_status?: string;
    payment_url: string;
    bank?: BankPaymentInfo;
};

export type OrderPaymentStatusResponse = {
    order_code: string;
    payment_method: string;
    payment_status: string;
    order_status: string;
    order_status_label: string;
    amount: number;
    transfer_content?: string | null;
    paid_at?: string | null;
    customer_address?: string | null;
    customer_district?: string | null;
    delivery_date?: string | null;
    delivery_slot?: string | null;
    items: OrderItem[];
    timeline: OrderTimelineItem[];
};

export async function checkoutPayment(payload: {
    user_id?: number;
    payment_method: PaymentMethod;
    amount: number;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_district?: string;
    customer_note?: string;
    delivery_date?: string;
    delivery_slot?: string;
    items: Array<{
        product_id?: number | null;
        name: string;
        description?: string;
        image_url?: string | null;
        quantity: number;
        price: number;
    }>;
}): Promise<CheckoutPaymentResponse> {
    const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(getResponseMessage(data));
    }

    return data as CheckoutPaymentResponse;
}

export async function getOrderPaymentStatus(orderCode: string): Promise<OrderPaymentStatusResponse> {
    const response = await fetch(`/api/payments/orders/${encodeURIComponent(orderCode)}`, {
        headers: {
            Accept: 'application/json',
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(getResponseMessage(data));
    }

    return data as OrderPaymentStatusResponse;
}

export async function listUserOrders(userId: number): Promise<OrderPaymentStatusResponse[]> {
    const response = await fetch(`/api/users/${encodeURIComponent(String(userId))}/orders`, {
        headers: {
            Accept: 'application/json',
        },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(getResponseMessage(data));
    }

    return (data as { data: OrderPaymentStatusResponse[] }).data;
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
