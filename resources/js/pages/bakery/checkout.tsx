import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryCard, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { CartItem, formatMoney } from '@/data/bakery';
import { readAuthUser } from '@/lib/auth-api';
import { rememberOrderCode } from '@/lib/order-history';
import { checkoutPayment, type PaymentMethod } from '@/lib/payment-api';
import type { Voucher } from '@/lib/voucher-api';

type DeliverySlot = {
    label: string;
    startHour: number;
};

type CustomerInfo = {
    name: string;
    phone: string;
    address: string;
    district: string;
    note: string;
};

type CustomerErrors = Partial<Record<keyof CustomerInfo, string>>;

const districtOptions = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh'];

const deliverySlots: DeliverySlot[] = Array.from({ length: 13 }, (_, index) => {
    const startHour = index + 8;
    const endHour = startHour + 1;

    return {
        label: `${formatHour(startHour)} - ${formatHour(endHour)}`,
        startHour,
    };
});

export default function Checkout() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [deliveryDate, setDeliveryDate] = useState(() => formatDateInput(new Date()));
    const [deliverySlot, setDeliverySlot] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: '',
        phone: '',
        address: '',
        district: '',
        note: '',
    });
    const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
    const subtotal = items.reduce((total, item) => total + item.priceN * item.qty, 0);
    const discountAmount = appliedVoucher ? Math.round((subtotal * appliedVoucher.discount_percent) / 100) : 0;
    const total = Math.max(0, subtotal - discountAmount);
    const availableDeliverySlots = useMemo(() => getAvailableDeliverySlots(deliveryDate), [deliveryDate]);

    useEffect(() => {
        const cart = removeLegacyDefaultCart(JSON.parse(localStorage.getItem('fleur-cart') ?? 'null') as CartItem[] | null);
        const storedVoucher = JSON.parse(localStorage.getItem('fleur-applied-voucher') ?? 'null') as Voucher | null;

        setItems(cart ?? []);
        setAppliedVoucher(storedVoucher);
    }, []);

    useEffect(() => {
        if (availableDeliverySlots.length === 0) {
            setDeliverySlot('');

            return;
        }

        if (!availableDeliverySlots.some((slot) => slot.label === deliverySlot)) {
            setDeliverySlot(availableDeliverySlots[0].label);
        }
    }, [availableDeliverySlots, deliverySlot]);

    async function handleConfirmOrder() {
        setPaymentError('');

        if (!validateCustomerInfo()) {
            setPaymentError('Vui lòng nhập đầy đủ thông tin nhận hàng.');

            return;
        }

        if (!deliverySlot) {
            setPaymentError('Vui lòng chọn thời gian nhận bánh.');

            return;
        }

        if (items.length === 0) {
            setPaymentError('Giỏ hàng đang trống.');

            return;
        }

        setIsCheckingOut(true);

        try {
            const authUser = readAuthUser();
            const response = await checkoutPayment({
                user_id: authUser?.id,
                payment_method: paymentMethod,
                amount: total,
                customer_name: customerInfo.name.trim(),
                customer_phone: customerInfo.phone.trim(),
                customer_address: customerInfo.address.trim(),
                customer_district: customerInfo.district,
                customer_note: customerInfo.note.trim() || undefined,
                delivery_date: deliveryDate,
                delivery_slot: deliverySlot,
                items: items.map((item) => ({
                    product_id: item.id,
                    name: item.name,
                    description: item.desc,
                    image_url: item.imageUrl,
                    quantity: item.qty,
                    price: item.priceN,
                })),
            });

            rememberOrderCode(response.order_code);
            clearCheckoutStorage();
            window.location.href = response.payment_url;
        } catch (error) {
            setPaymentError(error instanceof Error ? error.message : 'Không tạo được thanh toán.');
        } finally {
            setIsCheckingOut(false);
        }
    }

    function updateCustomerInfo(field: keyof CustomerInfo, value: string) {
        setCustomerInfo((current) => ({ ...current, [field]: value }));
        setCustomerErrors((current) => ({ ...current, [field]: undefined }));
    }

    function validateCustomerInfo(): boolean {
        const nextErrors: CustomerErrors = {};

        if (!customerInfo.name.trim()) {
            nextErrors.name = 'Vui lòng nhập họ và tên.';
        }

        if (!customerInfo.phone.trim()) {
            nextErrors.phone = 'Vui lòng nhập số điện thoại.';
        }

        if (!customerInfo.address.trim()) {
            nextErrors.address = 'Vui lòng nhập địa chỉ.';
        }

        if (!customerInfo.district) {
            nextErrors.district = 'Vui lòng chọn quận/huyện.';
        }

        setCustomerErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    }

    return (
        <BakeryLayout>
            <Head title="Thanh toán" />
            <section className="bakery-section">
                <Breadcrumbs items={['Giỏ hàng', 'Thanh toán']} />
                <h1 className="bakery-section-title mb-7">
                    Thanh <em>toán</em>
                </h1>
                <div className="mb-8 flex items-center gap-3 text-[13px] font-medium">
                    {['Thông tin', 'Giao hàng', 'Thanh toán'].map((step, index) => (
                        <div className="flex flex-1 items-center gap-3" key={step}>
                            <span
                                className={`grid h-7 w-7 place-items-center rounded-full text-[12px] ${index === 0 ? 'bg-[var(--bakery-lav)] text-white' : 'bg-[var(--bakery-gray-light)] text-[var(--bakery-gray)]'}`}
                            >
                                {index + 1}
                            </span>
                            <span>{step}</span>
                            {index < 2 && <span className="h-px flex-1 bg-[var(--bakery-border)]" />}
                        </div>
                    ))}
                </div>
                <div className="grid items-start gap-7 lg:grid-cols-[1fr_340px]">
                    <div className="grid gap-5">
                        <BakeryCard className="p-6">
                            <div className="bakery-serif mb-5 text-xl">Thông tin nhận hàng</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    error={customerErrors.name}
                                    label="Họ và tên"
                                    onChange={(value) => updateCustomerInfo('name', value)}
                                    placeholder="Nguyễn Văn A"
                                    required
                                    value={customerInfo.name}
                                />
                                <Field
                                    error={customerErrors.phone}
                                    label="Số điện thoại"
                                    onChange={(value) => updateCustomerInfo('phone', value)}
                                    placeholder="0901 234 567"
                                    required
                                    value={customerInfo.phone}
                                />
                            </div>
                            <Field
                                error={customerErrors.address}
                                label="Địa chỉ"
                                onChange={(value) => updateCustomerInfo('address', value)}
                                placeholder="Số nhà, tên đường"
                                required
                                value={customerInfo.address}
                            />
                            <div className="grid gap-4 md:grid-cols-2">
                                <SelectField
                                    error={customerErrors.district}
                                    label="Quận/Huyện"
                                    onChange={(value) => updateCustomerInfo('district', value)}
                                    options={districtOptions}
                                    required
                                    value={customerInfo.district}
                                />
                                <Field
                                    label="Ghi chú"
                                    onChange={(value) => updateCustomerInfo('note', value)}
                                    placeholder="Gọi trước 30 phút..."
                                    value={customerInfo.note}
                                />
                            </div>
                        </BakeryCard>
                        <BakeryCard className="p-6">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="bakery-serif text-xl">Thời gian giao hàng</div>
                                    <p className="mt-1 text-[12px] text-[var(--bakery-gray)]">
                                        Đơn đặt trong ngày cần tối thiểu 4 tiếng để chuẩn bị.
                                    </p>
                                </div>
                                <label className="grid gap-1 text-[12px] font-medium text-[var(--bakery-gray)]">
                                    Ngày nhận bánh
                                    <input
                                        className="rounded-full border border-[var(--bakery-border)] bg-white px-4 py-2 text-[13px] text-[var(--bakery-dark)] outline-none focus:border-[var(--bakery-lav)]"
                                        min={formatDateInput(new Date())}
                                        onChange={(event) => setDeliveryDate(event.target.value)}
                                        type="date"
                                        value={deliveryDate}
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableDeliverySlots.map((slot) => (
                                    <button
                                        className={`rounded-full border px-4 py-2 text-[13px] transition ${
                                            deliverySlot === slot.label
                                                ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav-light)] text-[var(--bakery-lav)]'
                                                : 'border-[var(--bakery-border)] hover:border-[var(--bakery-lav)] hover:text-[var(--bakery-lav)]'
                                        }`}
                                        key={slot.label}
                                        onClick={() => setDeliverySlot(slot.label)}
                                        type="button"
                                    >
                                        {slot.label}
                                    </button>
                                ))}
                            </div>
                            {availableDeliverySlots.length === 0 && (
                                <div className="rounded-[14px] border border-amber-100 bg-amber-50 p-4 text-[13px] text-amber-700">
                                    Hôm nay đã hết khung giờ phù hợp. Vui lòng chọn ngày mai hoặc ngày khác.
                                </div>
                            )}
                            {deliverySlot && (
                                <div className="mt-4 rounded-[14px] bg-[var(--bakery-gray-light)] px-4 py-3 text-[13px] text-[var(--bakery-gray)]">
                                    Nhận bánh ngày {formatDisplayDate(deliveryDate)}, khung giờ {deliverySlot}.
                                </div>
                            )}
                        </BakeryCard>
                        <BakeryCard className="p-6">
                            <div className="bakery-serif mb-4 text-xl">Phương thức thanh toán</div>
                            <div className="grid gap-3 md:grid-cols-2">
                                <PaymentMethodButton
                                    active={paymentMethod === 'cod'}
                                    description="Thanh toán khi nhận bánh"
                                    icon="💵"
                                    label="Tiền mặt (COD)"
                                    onClick={() => setPaymentMethod('cod')}
                                />
                                <PaymentMethodButton
                                    active={paymentMethod === 'bank'}
                                    description="Quét QR hoặc chuyển khoản"
                                    icon="🏦"
                                    label="Ngân hàng"
                                    onClick={() => setPaymentMethod('bank')}
                                />
                            </div>
                            {paymentError && <div className="mt-4 rounded-[14px] bg-rose-50 p-4 text-[13px] text-rose-700">{paymentError}</div>}
                        </BakeryCard>
                    </div>
                    <BakeryCard className="sticky top-20 p-6">
                        <div className="bakery-serif mb-5 text-xl">Đơn hàng của bạn</div>
                        <div className="grid gap-3">
                            {items.map((item) => (
                                <div className="flex items-center gap-3" key={item.id}>
                                    <div
                                        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[var(--bakery-lav-light)] text-2xl"
                                        style={{ background: item.bg }}
                                    >
                                        {item.imageUrl ? (
                                            <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                                        ) : (
                                            item.emoji
                                        )}
                                    </div>
                                    <div className="flex-1 text-[13px]">
                                        {item.name}
                                        <br />
                                        <span className="text-[11px] text-[var(--bakery-gray)]">×{item.qty}</span>
                                    </div>
                                    <span className="text-[13px] font-medium text-[var(--bakery-lav)]">{formatMoney(item.priceN * item.qty)}</span>
                                </div>
                            ))}
                        </div>
                        <hr className="my-4 border-[var(--bakery-border)]" />
                        <div className="mb-3 flex justify-between text-sm text-[var(--bakery-gray)]">
                            <span>Tạm tính</span>
                            <span>{formatMoney(subtotal)}</span>
                        </div>
                        <div className="mb-3 flex justify-between text-sm text-[var(--bakery-gray)]">
                            <span>Phí giao hàng</span>
                            <span className="text-[var(--bakery-green)]">Miễn phí</span>
                        </div>
                        <div className="mb-3 flex justify-between text-sm text-[var(--bakery-gray)]">
                            <span>{appliedVoucher ? `Giảm giá (${appliedVoucher.code})` : 'Giảm giá'}</span>
                            <span>{discountAmount > 0 ? `-${formatMoney(discountAmount)}` : '-'}</span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--bakery-border)] pt-4 text-[17px] font-semibold">
                            <span>Tổng cộng</span>
                            <span className="text-[var(--bakery-lav)]">{formatMoney(total)}</span>
                        </div>
                        <button
                            className="bakery-btn bakery-btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isCheckingOut || !deliverySlot}
                            onClick={handleConfirmOrder}
                            type="button"
                        >
                            {isCheckingOut ? 'Đang xử lý...' : paymentMethod === 'bank' ? 'Tạo QR thanh toán →' : 'Xác nhận đặt hàng COD →'}
                        </button>
                    </BakeryCard>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function clearCheckoutStorage() {
    localStorage.removeItem('fleur-cart');
    localStorage.removeItem('fleur-applied-voucher');
    window.dispatchEvent(new Event('fleur-cart-updated'));
}

function Field({
    error,
    label,
    onChange,
    placeholder,
    required = false,
    type = 'text',
    value,
}: {
    error?: string;
    label: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
    type?: string;
    value: string;
}) {
    return (
        <label className="mb-4 block">
            <span className="bakery-label">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            <input
                className={`bakery-input ${error ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400' : ''}`}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
                type={type}
                value={value}
            />
            {error && <span className="mt-1 block text-[12px] font-medium text-rose-600">{error}</span>}
        </label>
    );
}

function SelectField({
    error,
    label,
    onChange,
    options,
    required = false,
    value,
}: {
    error?: string;
    label: string;
    onChange: (value: string) => void;
    options: string[];
    required?: boolean;
    value: string;
}) {
    return (
        <label className="mb-4 block">
            <span className="bakery-label">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            <select
                className={`bakery-input ${error ? 'border-rose-300 bg-rose-50/40 focus:border-rose-400' : ''}`}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                value={value}
            >
                <option value="">Chọn quận/huyện</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            {error && <span className="mt-1 block text-[12px] font-medium text-rose-600">{error}</span>}
        </label>
    );
}

function PaymentMethodButton({
    active,
    description,
    icon,
    label,
    onClick,
}: {
    active: boolean;
    description: string;
    icon: string;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            className={`rounded-[14px] border p-4 text-left transition ${
                active ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav-light)]' : 'border-[var(--bakery-border)] hover:border-[var(--bakery-lav)]'
            }`}
            onClick={onClick}
            type="button"
        >
            <span className="mb-2 block text-2xl">{icon}</span>
            <span className="block text-[13px] font-semibold text-[var(--bakery-dark)]">{label}</span>
            <span className="mt-1 block text-[11px] text-[var(--bakery-gray)]">{description}</span>
        </button>
    );
}

function removeLegacyDefaultCart(cart: CartItem[] | null): CartItem[] | null {
    const isLegacyDefaultCart =
        cart?.length === 2 &&
        cart[0]?.name === 'Sakura Mousse Cake' &&
        cart[1]?.name === 'Matcha Lavender Roll' &&
        cart.every((item) => item.qty === 1);

    if (isLegacyDefaultCart) {
        localStorage.removeItem('fleur-cart');
        window.dispatchEvent(new Event('fleur-cart-updated'));

        return [];
    }

    return cart;
}

function getAvailableDeliverySlots(deliveryDate: string): DeliverySlot[] {
    const selectedDate = parseDateInput(deliveryDate);

    if (!selectedDate) {
        return [];
    }

    const today = formatDateInput(new Date());

    if (deliveryDate !== today) {
        return deliverySlots;
    }

    const earliestDeliveryTime = new Date();
    earliestDeliveryTime.setHours(earliestDeliveryTime.getHours() + 4);

    return deliverySlots.filter((slot) => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(slot.startHour, 0, 0, 0);

        return slotStart >= earliestDeliveryTime;
    });
}

function parseDateInput(value: string): Date | null {
    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    return new Date(year, month - 1, day);
}

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
    const date = parseDateInput(value);

    if (!date) {
        return value;
    }

    return date.toLocaleDateString('vi-VN');
}

function formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
}
