import { Head } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter } from '@/components/bakery/shared';
import { formatMoney } from '@/data/bakery';
import { rememberOrderCode } from '@/lib/order-history';
import { getOrderPaymentStatus, type OrderPaymentStatusResponse, type OrderTimelineItem } from '@/lib/payment-api';

const timelineIcons: Record<string, string> = {
    pending: '✓',
    confirmed: '✓',
    baking: '🍰',
    ready_for_shipper: '📦',
    shipping: '🚚',
    delivered: '🎉',
};

export default function Tracking() {
    const initialCode = new URLSearchParams(window.location.search).get('order_code') ?? '';
    const [orderCode, setOrderCode] = useState(initialCode);
    const [order, setOrder] = useState<OrderPaymentStatusResponse | null>(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialCode) {
            void loadOrder(initialCode);
        }
    }, [initialCode]);

    async function loadOrder(code: string) {
        const cleanCode = code.replace(/^#/, '').trim();

        if (!cleanCode) {
            setError('Vui lòng nhập mã đơn hàng.');

            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const nextOrder = await getOrderPaymentStatus(cleanCode);

            rememberOrderCode(nextOrder.order_code);
            setOrder(nextOrder);
        } catch (error) {
            setOrder(null);
            setError(error instanceof Error ? error.message : 'Không tìm thấy đơn hàng.');
        } finally {
            setIsLoading(false);
        }
    }

    function handleSearch(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void loadOrder(orderCode);
    }

    return (
        <BakeryLayout>
            <Head title="Theo dõi đơn hàng" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10 text-center">
                <h1 className="bakery-section-title">
                    Theo dõi <em>đơn hàng</em>
                </h1>
                <form className="mx-auto mt-5 flex max-w-md gap-2" onSubmit={handleSearch}>
                    <input
                        className="bakery-input"
                        onChange={(event) => setOrderCode(event.target.value)}
                        placeholder="Nhập mã đơn hàng..."
                        value={orderCode}
                    />
                    <button className="bakery-btn bakery-btn-primary px-6" disabled={isLoading} type="submit">
                        {isLoading ? 'Đang tìm' : 'Tìm'}
                    </button>
                </form>
                {error && <div className="mx-auto mt-4 max-w-md rounded-[14px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            </div>
            <section className="bakery-section">
                <div className="mx-auto max-w-3xl">
                    {order ? (
                        <>
                            <div className="mb-7 rounded-[20px] bg-[var(--bakery-lav-light)] p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <div className="text-[12px] text-[var(--bakery-gray)]">Mã đơn hàng</div>
                                        <div className="bakery-serif my-1 text-[28px] text-[var(--bakery-lav)]">#{order.order_code}</div>
                                    </div>
                                    <span className="bakery-pill bakery-pill-lav">{order.order_status_label}</span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-6 text-[13px]">
                                    <Info label="Giao đến" value={[order.customer_address, order.customer_district].filter(Boolean).join(', ') || 'Đang cập nhật'} />
                                    <Info label="Thời gian" value={order.delivery_slot ?? 'Đang cập nhật'} />
                                    <Info label="Tổng tiền" value={formatMoney(order.amount)} />
                                </div>
                            </div>

                            <div className="mb-7 rounded-[18px] border border-[var(--bakery-border)] bg-white p-5">
                                <div className="bakery-serif mb-3 text-lg">Sản phẩm đã đặt</div>
                                <div className="grid gap-3">
                                    {order.items.map((item) => (
                                        <div className="flex justify-between gap-4 border-b border-[var(--bakery-border)] pb-3 last:border-b-0 last:pb-0" key={item.id}>
                                            <div>
                                                <div className="text-sm font-semibold">{item.name}</div>
                                                {item.description && <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{item.description}</div>}
                                                <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">Số lượng: {item.quantity}</div>
                                            </div>
                                            <div className="shrink-0 text-sm font-semibold text-[var(--bakery-lav)]">{formatMoney(item.line_total)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Timeline timeline={order.timeline} />
                        </>
                    ) : (
                        <div className="rounded-[20px] border border-dashed border-[var(--bakery-border)] bg-white p-10 text-center text-sm text-[var(--bakery-gray)]">
                            Nhập mã đơn hàng để xem sản phẩm đã đặt và tình trạng xử lý.
                        </div>
                    )}

                    <div className="mt-8 flex justify-center gap-3">
                        <BakeryButton href="/" variant="secondary">
                            ← Về trang chủ
                        </BakeryButton>
                        <BakeryButton href="/contact" variant="lavender">
                            Liên hệ hỗ trợ
                        </BakeryButton>
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function Timeline({ timeline }: { timeline: OrderTimelineItem[] }) {
    return (
        <div>
            {timeline.map((item) => (
                <div className="flex gap-4 py-4" key={item.status}>
                    <div
                        className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                            item.state === 'done'
                                ? 'bg-[var(--bakery-green-light)]'
                                : item.state === 'active'
                                  ? 'bg-[var(--bakery-lav-light)] shadow-[0_0_0_4px_rgba(124,125,184,.2)]'
                                  : 'bg-[var(--bakery-gray-light)]'
                        }`}
                    >
                        {timelineIcons[item.status] ?? '•'}
                    </div>
                    <div>
                        <div className="text-sm font-medium">{item.label}</div>
                        <div className="text-[12px] text-[var(--bakery-gray)]">{item.note}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] text-[var(--bakery-gray)]">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
