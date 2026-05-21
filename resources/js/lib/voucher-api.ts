export type Voucher = {
    id: number;
    code: string;
    discount_percent: number;
    usage_limit: number;
    used_count: number;
    remaining_uses: number;
    is_active: boolean;
};

type ResourceCollection<T> = {
    data: T[];
};

type VoucherResponse = {
    message: string;
    voucher: Voucher;
};

export type ApplyVoucherResponse = {
    message: string;
    voucher: Voucher;
    discount_amount: number;
    discount_amount_formatted: string;
    total: number;
    total_formatted: string;
};

export async function listVouchers(): Promise<Voucher[]> {
    const response = await requestJson<ResourceCollection<Voucher>>('/api/vouchers');

    return response.data;
}

export async function createVoucher(payload: {
    code: string;
    discount_percent: number;
    usage_limit: number;
    used_count?: number;
    is_active: boolean;
}): Promise<Voucher> {
    const response = await requestJson<VoucherResponse>('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    return response.voucher;
}

export async function updateVoucher(
    voucherId: number,
    payload: {
        code: string;
        discount_percent: number;
        usage_limit: number;
        used_count?: number;
        is_active: boolean;
    },
): Promise<Voucher> {
    const response = await requestJson<{ data: Voucher }>(`/api/vouchers/${voucherId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });

    return response.data;
}

export async function deleteVoucher(voucherId: number): Promise<void> {
    await requestJson<{ message: string }>(`/api/vouchers/${voucherId}`, {
        method: 'DELETE',
    });
}

export async function applyVoucher(payload: { code: string; subtotal: number }): Promise<ApplyVoucherResponse> {
    return requestJson<ApplyVoucherResponse>('/api/vouchers/apply', {
        method: 'POST',
        body: JSON.stringify(payload),
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
