export type PaymentMethod = 'bank' | 'cod';

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
    payment_url: string;
    bank?: BankPaymentInfo;
};

export async function checkoutPayment(payload: {
    payment_method: PaymentMethod;
    amount: number;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    customer_address?: string;
    customer_district?: string;
    customer_note?: string;
    delivery_date?: string;
    delivery_slot?: string;
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
