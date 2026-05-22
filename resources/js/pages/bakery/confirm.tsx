import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter } from '@/components/bakery/shared';
import { formatMoney } from '@/data/bakery';
import { rememberOrderCode } from '@/lib/order-history';
import { getOrderPaymentStatus, type OrderItem } from '@/lib/payment-api';

export default function Confirm({
    amount,
    bankAccountName,
    bankAccountNumber,
    bankCode,
    customerAddress,
    customerDistrict,
    deliverySlot,
    items = [],
    message,
    orderCode,
    paymentMethod,
    paymentStatus,
    qrUrl,
    transferContent,
}: {
    amount?: number | string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankCode?: string | null;
    customerAddress?: string | null;
    customerDistrict?: string | null;
    deliverySlot?: string | null;
    items?: OrderItem[];
    message?: string | null;
    orderCode?: string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    qrUrl?: string | null;
    transferContent?: string | null;
}) {
    const [currentPaymentStatus, setCurrentPaymentStatus] = useState(paymentStatus ?? null);
    const isPaid = currentPaymentStatus === 'paid';
    const isFailed = currentPaymentStatus === 'failed';
    const isPartial = currentPaymentStatus === 'partial';
    const isBankPayment = paymentMethod === 'bank';
    const paymentLabel = isBankPayment ? 'Ngân hàng' : paymentMethod === 'cod' ? 'COD' : 'Chưa xác định';
    const statusLabel = isPaid ? 'Đã thanh toán' : isFailed ? 'Thanh toán thất bại' : isPartial ? 'Thanh toán thiếu' : isBankPayment ? 'Chờ chuyển khoản' : 'Chờ xử lý';
    const amountLabel = amount ? formatMoney(Number(amount)) : 'Đang cập nhật';
    const deliveryAddress = [customerAddress, customerDistrict].filter(Boolean).join(', ') || 'Đang cập nhật';
    const orderDetails = [
        ['Tổng tiền', amountLabel],
        ['Thanh toán', paymentLabel],
        ['Trạng thái', statusLabel],
        ...(bankCode ? [['Ngân hàng', bankCode]] : []),
        ...(bankAccountNumber ? [['Số tài khoản', bankAccountNumber]] : []),
        ...(bankAccountName ? [['Chủ tài khoản', bankAccountName]] : []),
        ...(transferContent ? [['Nội dung CK', transferContent]] : []),
        ['Giao đến', deliveryAddress],
        ['Thời gian', deliverySlot ?? 'Theo thời gian bạn đã chọn'],
    ];

    useEffect(() => {
        setCurrentPaymentStatus(paymentStatus ?? null);
    }, [paymentStatus]);

    useEffect(() => {
        rememberOrderCode(orderCode);
        localStorage.removeItem('fleur-cart');
        localStorage.removeItem('fleur-applied-voucher');
        window.dispatchEvent(new Event('fleur-cart-updated'));
    }, [orderCode]);

    useEffect(() => {
        if (!isBankPayment || !orderCode || currentPaymentStatus === 'paid' || currentPaymentStatus === 'failed') {
            return;
        }

        let isActive = true;

        const refreshPaymentStatus = async () => {
            try {
                const order = await getOrderPaymentStatus(orderCode);

                if (isActive) {
                    setCurrentPaymentStatus(order.payment_status);
                }
            } catch {
                // Keep current payment instructions visible if the status check is temporarily unavailable.
            }
        };

        void refreshPaymentStatus();
        const intervalId = window.setInterval(refreshPaymentStatus, 3000);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);
        };
    }, [currentPaymentStatus, isBankPayment, orderCode]);

    return (
        <BakeryLayout>
            <Head title={isFailed ? 'Thanh toán chưa thành công' : 'Đặt hàng thành công'} />
            <div className="mx-auto max-w-6xl px-[5%] py-10">
                <div className="mx-auto mb-7 max-w-3xl text-center">
                    <div className="mb-3 text-6xl">{isFailed ? '⚠️' : '🎉'}</div>
                    <h1 className="bakery-section-title">
                        {isFailed ? 'Thanh toán' : 'Đặt hàng'} <em>{isFailed ? 'chưa thành công' : 'thành công!'}</em>
                    </h1>
                    <p className="mt-2 text-sm text-[var(--bakery-gray)]">{message ?? 'Cảm ơn bạn đã tin tưởng Fleur Bakery'}</p>
                    <div className="bakery-serif mt-3 text-3xl text-[var(--bakery-lav)]">#{orderCode ?? 'FL2025-08471'}</div>
                </div>

                <div className={`grid gap-6 ${isBankPayment && qrUrl ? 'lg:grid-cols-[minmax(0,1fr)_380px]' : 'mx-auto max-w-xl'}`}>
                    <div className="grid gap-4">
                        <div className="rounded-[18px] bg-[var(--bakery-lav-light)] p-5 text-left">
                            {orderDetails.map(([label, value]) => (
                                <div
                                    className="flex items-start justify-between gap-5 border-b border-[rgba(124,125,184,.15)] py-2.5 text-sm last:border-b-0"
                                    key={label}
                                >
                                    <span className="shrink-0 text-[var(--bakery-gray)]">{label}</span>
                                    <span className="text-right font-medium break-words">{value}</span>
                                </div>
                            ))}
                        </div>
                        <OrderItems items={items} />
                    </div>

                    {isBankPayment && qrUrl && (
                        <div className="rounded-[18px] border border-[var(--bakery-border)] bg-white p-5 text-center">
                            <img className="mx-auto h-72 w-full max-w-[300px] rounded-[12px] object-contain" src={qrUrl} alt="QR thanh toán ngân hàng" />
                            <p className="mt-3 text-[12px] text-[var(--bakery-gray)]">
                                Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung để đơn hàng được xác nhận.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <BakeryButton href={`/tracking${orderCode ? `?order_code=${encodeURIComponent(orderCode)}` : ''}`}>Theo dõi đơn hàng →</BakeryButton>
                    <BakeryButton href="/" variant="secondary">
                        Về trang chủ
                    </BakeryButton>
                </div>
            </div>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function OrderItems({ items }: { items: OrderItem[] }) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="rounded-[18px] border border-[var(--bakery-border)] bg-white p-5 text-left">
            <div className="bakery-serif mb-3 text-lg">Sản phẩm đã đặt</div>
            <div className="grid gap-3">
                {items.map((item) => (
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--bakery-border)] pb-3 last:border-b-0 last:pb-0" key={item.id}>
                        <div>
                            <div className="text-sm font-semibold">{item.name}</div>
                            {item.description && <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{item.description}</div>}
                            <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">Số lượng: {item.quantity}</div>
                        </div>
                        <div className="shrink-0 text-right text-sm font-semibold text-[var(--bakery-lav)]">{formatMoney(item.line_total)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
