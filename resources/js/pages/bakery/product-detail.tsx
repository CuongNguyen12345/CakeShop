import { Head } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard, { addProductToCart } from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { products } from '@/data/bakery';

export default function ProductDetail({ productId = 1 }: { productId?: number | string }) {
    const product = useMemo(() => products.find((item) => item.id === Number(productId)) ?? products[0], [productId]);
    const [qty, setQty] = useState(1);

    return (
        <BakeryLayout>
            <Head title={product.name} />
            <section className="bakery-section">
                <Breadcrumbs items={['Thực đơn', product.name]} />
                <div className="grid items-start gap-12 lg:grid-cols-2">
                    <div>
                        <div
                            className="relative grid aspect-square place-items-center rounded-[24px] text-[120px]"
                            style={{ background: product.bg }}
                        >
                            <span className="bakery-pill bakery-pill-lav absolute top-4 left-4">✨ {product.tag ?? 'Bán chạy'}</span>
                            {product.emoji}
                        </div>
                        <div className="mt-4 flex gap-3">
                            {[product.emoji, '🌿', '🎀'].map((item) => (
                                <div
                                    className="grid h-16 w-16 place-items-center rounded-xl border-2 border-[var(--bakery-lav)] text-3xl"
                                    key={item}
                                    style={{ background: product.bg }}
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h1 className="bakery-serif mb-2 text-4xl text-[var(--bakery-dark)]">{product.name}</h1>
                        <div className="mb-4 flex items-center gap-3">
                            <span className="text-[#F2C94C]">★★★★★</span>
                            <span className="text-[13px] text-[var(--bakery-gray)]">4.9 (128 đánh giá)</span>
                        </div>
                        <div className="mb-4 text-[28px] font-semibold text-[var(--bakery-lav)]">{product.price}</div>
                        <p className="mb-5 text-sm leading-7 text-[var(--bakery-gray)]">
                            Được làm thủ công từ nguyên liệu tự nhiên cao cấp. {product.desc}. Lớp bánh mềm mịn, hương vị thanh và không ngán.
                        </p>
                        <OptionGroup title="Chọn kích thước" options={['4 inch', '6 inch', '8 inch']} />
                        <div className="mt-5 mb-2 text-[13px] font-medium">Số lượng</div>
                        <div className="mb-6 flex items-center gap-4">
                            <QtyButton onClick={() => setQty(Math.max(1, qty - 1))}>
                                <Minus size={16} />
                            </QtyButton>
                            <span className="min-w-8 text-center text-lg font-medium">{qty}</span>
                            <QtyButton onClick={() => setQty(qty + 1)}>
                                <Plus size={16} />
                            </QtyButton>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <BakeryButton
                                className="flex-1"
                                onClick={() => {
                                    addProductToCart(product, qty);
                                }}
                            >
                                <ShoppingBag size={16} /> Thêm vào giỏ hàng
                            </BakeryButton>
                            <BakeryButton variant="secondary">♡</BakeryButton>
                        </div>
                        <div className="mt-6 grid grid-cols-4 gap-3 rounded-[14px] bg-[var(--bakery-gray-light)] p-4 text-center text-[12px] text-[var(--bakery-gray)]">
                            {['🚀 Giao 2h', '🌿 Tự nhiên', '🎨 Tùy chỉnh', '↩️ Đổi trả'].map((item) => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <hr className="my-10 border-[var(--bakery-border)]" />
                <h2 className="bakery-section-title mb-5">Có thể bạn thích</h2>
                <div className="bakery-product-grid">
                    {products.slice(0, 4).map((item) => (
                        <ProductCard key={item.id} product={item} />
                    ))}
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function OptionGroup({ title, options }: { title: string; options: string[] }) {
    const [active, setActive] = useState(options[1] ?? options[0]);

    return (
        <>
            <div className="mb-2 text-[13px] font-medium">{title}</div>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        className={`rounded-full border px-5 py-2 text-[13px] font-medium ${
                            active === option
                                ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white'
                                : 'border-[var(--bakery-border)] bg-white'
                        }`}
                        key={option}
                        onClick={() => setActive(option)}
                        type="button"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </>
    );
}

function QtyButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--bakery-border)] bg-white hover:text-[var(--bakery-lav)]"
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    );
}
