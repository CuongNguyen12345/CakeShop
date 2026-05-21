import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { CartItem, defaultCart, formatMoney } from '@/data/bakery';
import { readAuthUser } from '@/lib/auth-api';
import { applyVoucher, type Voucher } from '@/lib/voucher-api';

export default function Cart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherError, setVoucherError] = useState('');
    const [voucherMessage, setVoucherMessage] = useState('');

    useEffect(() => {
        if (!readAuthUser()) {
            router.visit('/auth', { replace: true });

            return;
        }

        const cart = JSON.parse(localStorage.getItem('fleur-cart') ?? 'null') as CartItem[] | null;
        const storedVoucher = JSON.parse(localStorage.getItem('fleur-applied-voucher') ?? 'null') as Voucher | null;

        setItems(cart?.length ? cart : defaultCart());
        setAppliedVoucher(storedVoucher);
        setHasCheckedAuth(true);
    }, []);

    const subtotal = items.reduce((total, item) => total + item.priceN * item.qty, 0);
    const discountAmount = appliedVoucher ? Math.round((subtotal * appliedVoucher.discount_percent) / 100) : 0;
    const total = Math.max(0, subtotal - discountAmount);

    function updateItems(nextItems: CartItem[]) {
        setItems(nextItems);
        localStorage.setItem('fleur-cart', JSON.stringify(nextItems));
        window.dispatchEvent(new Event('fleur-cart-updated'));
    }

    async function handleApplyVoucher(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setVoucherError('');
        setVoucherMessage('');

        if (!voucherCode.trim()) {
            setVoucherError('Vui lòng nhập mã giảm giá.');

            return;
        }

        setIsApplyingVoucher(true);

        try {
            const response = await applyVoucher({
                code: voucherCode,
                subtotal,
            });

            setAppliedVoucher(response.voucher);
            setVoucherCode(response.voucher.code);
            localStorage.setItem('fleur-applied-voucher', JSON.stringify(response.voucher));
            setVoucherMessage(`Đã áp dụng mã ${response.voucher.code}, giảm ${response.voucher.discount_percent}%.`);
        } catch (error) {
            setAppliedVoucher(null);
            setVoucherError(error instanceof Error ? error.message : 'Không áp dụng được mã giảm giá.');
        } finally {
            setIsApplyingVoucher(false);
        }
    }

    function clearVoucher() {
        setAppliedVoucher(null);
        setVoucherCode('');
        localStorage.removeItem('fleur-applied-voucher');
        setVoucherError('');
        setVoucherMessage('');
    }

    if (!hasCheckedAuth) {
        return (
            <BakeryLayout>
                <Head title="Giỏ hàng" />
                <div className="grid min-h-[60vh] place-items-center px-[5%] text-center text-sm text-[var(--bakery-gray)]">
                    Đang kiểm tra đăng nhập...
                </div>
            </BakeryLayout>
        );
    }

    return (
        <BakeryLayout>
            <Head title="Giỏ hàng" />
            <section className="bakery-section">
                <Breadcrumbs items={['Giỏ hàng']} />
                <h1 className="bakery-section-title mb-7">
                    Giỏ <em>hàng</em> của bạn
                </h1>
                <div className="grid items-start gap-7 lg:grid-cols-[1fr_360px]">
                    <div>
                        {items.length === 0 ? (
                            <div className="py-16 text-center text-[var(--bakery-gray)]">
                                <div className="mb-4 text-6xl">🛒</div>
                                <div className="mb-5 text-base">Giỏ hàng đang trống</div>
                                <BakeryButton href="/menu">Xem thực đơn →</BakeryButton>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <div className="flex items-center gap-4 border-b border-[var(--bakery-border)] py-4" key={item.id}>
                                    <div
                                        className="grid h-[88px] w-[88px] shrink-0 place-items-center overflow-hidden rounded-[16px] text-4xl"
                                        style={{ background: item.bg }}
                                    >
                                        {item.imageUrl ? (
                                            <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                                        ) : (
                                            <span>{item.emoji}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="bakery-serif text-[17px]">{item.name}</div>
                                        <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{item.desc}</div>
                                        <div className="mt-1 text-[15px] font-semibold text-[var(--bakery-lav)]">{item.price}</div>
                                        <div className="mt-2 flex items-center gap-3">
                                            <button className="cart-qty-btn" onClick={() => updateItems(adjustQty(items, index, -1))} type="button">
                                                -
                                            </button>
                                            <span>{item.qty}</span>
                                            <button className="cart-qty-btn" onClick={() => updateItems(adjustQty(items, index, 1))} type="button">
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <button
                                        className="ml-auto text-[var(--bakery-gray)] hover:text-red-700"
                                        onClick={() => updateItems(items.filter((_, itemIndex) => itemIndex !== index))}
                                        type="button"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <OrderSummary
                        appliedVoucher={appliedVoucher}
                        discountAmount={discountAmount}
                        isApplyingVoucher={isApplyingVoucher}
                        onApplyVoucher={handleApplyVoucher}
                        onClearVoucher={clearVoucher}
                        setVoucherCode={setVoucherCode}
                        subtotal={subtotal}
                        total={total}
                        voucherCode={voucherCode}
                        voucherError={voucherError}
                        voucherMessage={voucherMessage}
                    />
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function adjustQty(items: CartItem[], index: number, delta: number): CartItem[] {
    return items.map((item, itemIndex) => (itemIndex === index ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
}

function OrderSummary({
    appliedVoucher,
    discountAmount,
    isApplyingVoucher,
    onApplyVoucher,
    onClearVoucher,
    setVoucherCode,
    subtotal,
    total,
    voucherCode,
    voucherError,
    voucherMessage,
}: {
    appliedVoucher: Voucher | null;
    discountAmount: number;
    isApplyingVoucher: boolean;
    onApplyVoucher: (event: FormEvent<HTMLFormElement>) => void;
    onClearVoucher: () => void;
    setVoucherCode: (code: string) => void;
    subtotal: number;
    total: number;
    voucherCode: string;
    voucherError: string;
    voucherMessage: string;
}) {
    return (
        <div className="sticky top-20 rounded-[20px] border border-[var(--bakery-border)] bg-white p-6">
            <div className="bakery-serif mb-5 text-xl">Tóm tắt đơn hàng</div>
            <form className="mb-4 flex gap-2" onSubmit={onApplyVoucher}>
                <input
                    className="min-w-0 flex-1 rounded-full border border-[var(--bakery-border)] px-4 py-2 text-[13px] outline-none"
                    onChange={(event) => setVoucherCode(event.target.value)}
                    placeholder="Mã giảm giá"
                    value={voucherCode}
                />
                <button
                    className="rounded-full bg-[var(--bakery-lav-light)] px-4 py-2 text-[13px] font-medium text-[var(--bakery-lav)] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isApplyingVoucher}
                    type="submit"
                >
                    {isApplyingVoucher ? 'Đang áp dụng' : 'Áp dụng'}
                </button>
            </form>
            {(voucherError || voucherMessage) && (
                <div
                    className={`mb-4 rounded-[12px] px-3 py-2 text-[12px] ${voucherError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                    {voucherError || voucherMessage}
                </div>
            )}
            {appliedVoucher && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] bg-[var(--bakery-lav-light)] px-3 py-2 text-[12px] text-[var(--bakery-lav)]">
                    <span>
                        {appliedVoucher.code} - giảm {appliedVoucher.discount_percent}%
                    </span>
                    <button className="font-medium" onClick={onClearVoucher} type="button">
                        Bỏ mã
                    </button>
                </div>
            )}
            <SummaryRow label="Tạm tính" value={formatMoney(subtotal)} />
            <SummaryRow label="Phí giao hàng" value="Miễn phí" />
            <SummaryRow label="Giảm giá" value={discountAmount > 0 ? `-${formatMoney(discountAmount)}` : '-'} />
            <div className="mt-4 flex justify-between border-t border-[var(--bakery-border)] pt-4 text-[17px] font-semibold">
                <span>Tổng cộng</span>
                <span className="text-[var(--bakery-lav)]">{formatMoney(total)}</span>
            </div>
            <BakeryButton className="mt-5 w-full" href="/checkout">
                Thanh toán →
            </BakeryButton>
            <BakeryButton className="mt-2 w-full" href="/menu" variant="secondary">
                ← Tiếp tục mua
            </BakeryButton>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="mb-3 flex justify-between text-sm text-[var(--bakery-gray)]">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
