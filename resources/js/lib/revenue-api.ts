export type RevenuePeriod = 'day' | 'month' | 'year';

export type RevenueChartPoint = {
    label: string;
    revenue: number;
    revenue_formatted: string;
    height_percent: number;
};

export type TopRevenueProduct = {
    name: string;
    quantity: number;
    orders_count: number;
    revenue: number;
    revenue_formatted: string;
};

export type RevenueStats = {
    summary: {
        period: RevenuePeriod;
        total_revenue: number;
        total_revenue_formatted: string;
        previous_revenue: number;
        previous_revenue_formatted: string;
        revenue_change_percent: number;
        paid_orders_count: number;
        completion_rate: number;
    };
    chart: RevenueChartPoint[];
    top_products: TopRevenueProduct[];
    best_seller?: TopRevenueProduct | null;
    tables: string[];
};

export async function listRevenueStats(period: RevenuePeriod): Promise<RevenueStats> {
    return requestJson<RevenueStats>(`/api/revenue/stats?period=${encodeURIComponent(period)}`);
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
