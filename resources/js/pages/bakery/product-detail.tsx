import { Head } from '@inertiajs/react';
import { Heart, Minus, PackageCheck, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard, { addProductToCart } from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { products as fallbackProducts, type BakeryProduct } from '@/data/bakery';
import { readAuthUser } from '@/lib/auth-api';
import type { CakeProduct } from '@/lib/product-api';
import { mapCakeProductToBakeryProduct } from '@/lib/product-presenter';
import { toggleWishlist } from '@/lib/wishlist-api';

type ProductDetailProps = {
    product?: CakeProduct;
    relatedProducts?: CakeProduct[];
};

export default function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
    const bakeryProduct = useMemo(() => (product ? mapCakeProductToBakeryProduct(product) : fallbackProducts[0]), [product]);
    const relatedBakeryProducts = useMemo(() => {
        const mappedProducts = relatedProducts.map(mapCakeProductToBakeryProduct);

        return mappedProducts.length > 0 ? mappedProducts : fallbackProducts.filter((item) => item.id !== bakeryProduct.id).slice(0, 4);
    }, [bakeryProduct.id, relatedProducts]);
    const [qty, setQty] = useState(1);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSavingFavorite, setIsSavingFavorite] = useState(false);
    const maxQty = Math.max(0, bakeryProduct.stockQuantity ?? 0);
    const canBuy = bakeryProduct.stockQuantity === undefined || maxQty > 0;

    useEffect(() => {
        setQty(1);
        setIsFavorite(false);
    }, [bakeryProduct.id]);

    function handleDecreaseQuantity(): void {
        setQty((currentQuantity) => Math.max(1, currentQuantity - 1));
    }

    function handleIncreaseQuantity(): void {
        setQty((currentQuantity) => (maxQty > 0 ? Math.min(maxQty, currentQuantity + 1) : currentQuantity + 1));
    }

    async function handleToggleFavorite(): Promise<void> {
        const authUser = readAuthUser();

        if (!authUser) {
            window.location.href = '/auth';

            return;
        }

        if (isSavingFavorite) {
            return;
        }

        setIsSavingFavorite(true);

        try {
            const response = await toggleWishlist(authUser.id, bakeryProduct.id);

            setIsFavorite(response.is_favorite);
        } finally {
            setIsSavingFavorite(false);
        }
    }

    return (
        <BakeryLayout>
            <Head title={bakeryProduct.name} />
            <section className="bakery-section">
                <Breadcrumbs items={['Thực đơn', bakeryProduct.name]} />
                <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)] lg:gap-12">
                    <div>
                        <div className="relative grid aspect-square min-h-[320px] place-items-center overflow-hidden rounded-[24px]" style={{ background: bakeryProduct.bg }}>
                            <span className={`bakery-product-tag z-10 ${bakeryProduct.tagClass ?? 'bakery-pill-lav'}`}>
                                <Sparkles size={14} /> {bakeryProduct.tag ?? 'Nổi bật'}
                            </span>
                            {bakeryProduct.imageUrl ? (
                                <img className="absolute inset-0 h-full w-full object-cover" src={bakeryProduct.imageUrl} alt={bakeryProduct.name} />
                            ) : (
                                <span className="relative z-10 text-[110px] md:text-[132px]">{bakeryProduct.emoji}</span>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {[bakeryProduct.emoji, bakeryProduct.categoryId ? '🍰' : '🌿', '🎀'].map((item, index) => (
                                <div
                                    className="grid aspect-square max-h-24 min-h-20 place-items-center rounded-[16px] border border-[var(--bakery-border)] text-3xl"
                                    key={`${item}-${index}`}
                                    style={{ background: bakeryProduct.bg }}
                                >
                                    {index === 0 && bakeryProduct.imageUrl ? (
                                        <img className="h-full w-full rounded-[16px] object-cover" src={bakeryProduct.imageUrl} alt={bakeryProduct.name} />
                                    ) : (
                                        item
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-1">
                        <h1 className="bakery-serif mb-2 text-[clamp(34px,4vw,52px)] leading-tight text-[var(--bakery-dark)]">{bakeryProduct.name}</h1>
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-[#F2B84B]">★★★★★</span>
                            <span className="text-[var(--bakery-gray)]">4.9 (128 đánh giá)</span>
                            {bakeryProduct.soldCount !== undefined && bakeryProduct.soldCount > 0 && (
                                <span className="rounded-full bg-[var(--bakery-lav-light)] px-3 py-1 text-[12px] font-semibold text-[var(--bakery-lav)]">
                                    Đã bán {bakeryProduct.soldCount}
                                </span>
                            )}
                        </div>
                        <div className="mb-4 text-[32px] font-semibold text-[var(--bakery-lav)]">{bakeryProduct.price}</div>
                        <p className="mb-6 text-[15px] leading-8 text-[var(--bakery-gray)]">
                            {bakeryProduct.desc}. Bánh được làm thủ công mỗi ngày từ nguyên liệu chọn lọc, phù hợp cho tiệc nhỏ, sinh nhật hoặc những dịp cần một chút ngọt ngào thật chỉn chu.
                        </p>

                        <div className="mb-6 grid gap-3 rounded-[18px] border border-[var(--bakery-border)] bg-white p-4 text-sm text-[var(--bakery-gray)] sm:grid-cols-3">
                            <InfoItem label="Danh mục" value={product?.category?.name ?? 'Bánh ngọt'} />
                            <InfoItem label="Kích thước" value={bakeryProduct.stockQuantity === 0 ? 'Tạm hết' : `${product?.size_inch ?? 6} inch`} />
                            <InfoItem label="Tồn kho" value={bakeryProduct.stockQuantity !== undefined ? `${bakeryProduct.stockQuantity} bánh` : 'Còn hàng'} />
                        </div>

                        <OptionGroup activeSize={`${product?.size_inch ?? 6} inch`} title="Chọn kích thước" />
                        <div className="mt-6 mb-2 text-[14px] font-semibold text-[var(--bakery-dark)]">Số lượng</div>
                        <div className="mb-7 flex items-center gap-4">
                            <QtyButton disabled={qty <= 1} onClick={handleDecreaseQuantity}>
                                <Minus size={16} />
                            </QtyButton>
                            <span className="min-w-8 text-center text-lg font-semibold">{qty}</span>
                            <QtyButton disabled={maxQty > 0 && qty >= maxQty} onClick={handleIncreaseQuantity}>
                                <Plus size={16} />
                            </QtyButton>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <BakeryButton
                                className={`flex-1 ${!canBuy ? 'pointer-events-none opacity-60' : ''}`}
                                onClick={() => {
                                    if (canBuy) {
                                        addProductToCart(bakeryProduct, qty);
                                    }
                                }}
                            >
                                <ShoppingBag size={17} /> {canBuy ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
                            </BakeryButton>
                            <button
                                aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                                className={`grid h-[52px] w-[64px] place-items-center rounded-full border border-[var(--bakery-border)] bg-white transition hover:border-[var(--bakery-lav)] disabled:cursor-not-allowed disabled:opacity-70 ${
                                    isFavorite ? 'text-rose-500' : 'text-[var(--bakery-dark)]'
                                }`}
                                disabled={isSavingFavorite}
                                onClick={() => void handleToggleFavorite()}
                                type="button"
                            >
                                <Heart fill={isFavorite ? 'currentColor' : 'none'} size={18} />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 rounded-[16px] bg-[var(--bakery-gray-light)] p-4 text-[12px] text-[var(--bakery-gray)] sm:grid-cols-4">
                            {['Giao trong ngày', 'Nguyên liệu chọn lọc', 'Có thể đặt riêng', 'Đóng gói cẩn thận'].map((item) => (
                                <span className="flex items-center justify-center gap-1.5 text-center" key={item}>
                                    <PackageCheck size={14} /> {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <hr className="my-10 border-[var(--bakery-border)]" />
                <h2 className="bakery-section-title mb-5">Có thể bạn thích</h2>
                <div className="bakery-product-grid">
                    {relatedBakeryProducts.map((item) => (
                        <ProductCard key={item.id} product={item} />
                    ))}
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="mb-1 text-[11px] font-semibold tracking-[.04em] text-[var(--bakery-lav)] uppercase">{label}</div>
            <div className="font-medium text-[var(--bakery-dark)]">{value}</div>
        </div>
    );
}

function OptionGroup({ activeSize, title }: { activeSize: string; title: string }) {
    const options = ['4 inch', '6 inch', '8 inch'];
    const [active, setActive] = useState(options.includes(activeSize) ? activeSize : options[1]);

    useEffect(() => {
        setActive(options.includes(activeSize) ? activeSize : options[1]);
    }, [activeSize]);

    return (
        <>
            <div className="mb-2 text-[14px] font-semibold text-[var(--bakery-dark)]">{title}</div>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        className={`rounded-full border px-5 py-2 text-[13px] font-semibold transition ${
                            active === option ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white' : 'border-[var(--bakery-border)] bg-white'
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

function QtyButton({ children, disabled = false, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--bakery-border)] bg-white transition hover:text-[var(--bakery-lav)] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={disabled}
            onClick={onClick}
            type="button"
        >
            {children}
        </button>
    );
}
