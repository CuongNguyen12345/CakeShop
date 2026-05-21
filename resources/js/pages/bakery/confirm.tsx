import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter } from '@/components/bakery/shared';
import { formatMoney } from '@/data/bakery';

export default function Confirm({
    amount,
    bankAccountName,
    bankAccountNumber,
    bankCode,
    customerAddress,
    customerDistrict,
    deliverySlot,
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
    message?: string | null;
    orderCode?: string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    qrUrl?: string | null;
    transferContent?: string | null;
}) {
    const isPaid = paymentStatus === 'paid';
    const isFailed = paymentStatus === 'failed';
    const isPartial = paymentStatus === 'partial';
    const isBankPayment = paymentMethod === 'bank';
    const paymentLabel = isBankPayment ? 'Ngân hàng' : paymentMethod === 'cod' ? 'COD' : 'Chưa xác định';
    const statusLabel = isPaid ? 'Đã thanh toán' : isFailed ? 'Thanh toán thất bại' : isPartial ? 'Thanh toán thiếu' : isBankPayment ? 'Chờ chuyển khoản' : 'Chờ xử lý';
    const amountLabel = amount ? formatMoney(Number(amount)) : 'Đang cập nhật';
    const deliveryAddress = [customerAddress, customerDistrict].filter(Boolean).join(', ') || 'Đang cập nhật';

    return (
        <BakeryLayout>
            <Head title={isFailed ? 'Thanh toán chưa thành công' : 'Đặt hàng thành công'} />
            <div className="mx-auto max-w-xl px-[5%] py-16 text-center">
                <div className="mb-5 text-7xl">{isFailed ? '⚠️' : '🎉'}</div>
                <h1 className="bakery-section-title">
                    {isFailed ? 'Thanh toán' : 'Đặt hàng'} <em>{isFailed ? 'chưa thành công' : 'thành công!'}</em>
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">{message ?? 'Cảm ơn bạn đã tin tưởng Fleur Bakery'}</p>
                <div className="bakery-serif my-4 text-3xl text-[var(--bakery-lav)]">#{orderCode ?? 'FL2025-08471'}</div>
                <div className="my-6 rounded-[18px] bg-[var(--bakery-lav-light)] p-6 text-left">
                    {[
                        ['Tổng tiền', amountLabel],
                        ['Thanh toán', paymentLabel],
                        ['Trạng thái', statusLabel],
                        ...(bankCode ? [['Ngân hàng', bankCode]] : []),
                        ...(bankAccountNumber ? [['Số tài khoản', bankAccountNumber]] : []),
                        ...(bankAccountName ? [['Chủ tài khoản', bankAccountName]] : []),
                        ...(transferContent ? [['Nội dung CK', transferContent]] : []),
                        ['Giao đến', deliveryAddress],
                        ['Thời gian', deliverySlot ?? 'Theo thời gian bạn đã chọn'],
                    ].map(([label, value]) => (
                        <div className="flex justify-between border-b border-[rgba(124,125,184,.15)] py-2 text-sm last:border-b-0" key={label}>
                            <span className="text-[var(--bakery-gray)]">{label}</span>
                            <span className="font-medium">{value}</span>
                        </div>
                    ))}
                </div>
                {isBankPayment && qrUrl && (
                    <div className="mb-6 rounded-[18px] border border-[var(--bakery-border)] bg-white p-5">
                        <img className="mx-auto h-64 w-64 rounded-[12px] object-contain" src={qrUrl} alt="QR thanh toán ngân hàng" />
                        <p className="mt-3 text-[12px] text-[var(--bakery-gray)]">
                            Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung để đơn hàng được xác nhận.
                        </p>
                    </div>
                )}
                <div className="flex flex-wrap justify-center gap-3">
                    <BakeryButton href="/tracking">Theo dõi đơn hàng →</BakeryButton>
                    <BakeryButton href="/" variant="secondary">
                        Về trang chủ
                    </BakeryButton>
                </div>
            </div>
            <BakeryFooter />
        </BakeryLayout>
    );
}
