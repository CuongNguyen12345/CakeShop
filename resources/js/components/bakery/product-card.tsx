import { Link } from '@inertiajs/react';
import { Heart, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { BakeryProduct, CartItem } from '@/data/bakery';
import { readAuthUser } from '@/lib/auth-api';
import { toggleWishlist } from '@/lib/wishlist-api';

function readCart(): CartItem[] {
    return JSON.parse(localStorage.getItem('fleur-cart') ?? '[]') as CartItem[];
}

function writeCart(cart: CartItem[]): void {
    localStorage.setItem('fleur-cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('fleur-cart-updated'));
}

export function addProductToCart(product: BakeryProduct, qty = 1): void {
    const cart = readCart();
    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({ ...product, qty });
    }

    writeCart(cart);
}

export default function ProductCard({
    product,
    compact = false,
    initialIsFavorite = false,
    onFavoriteChange,
}: {
    product: BakeryProduct;
    compact?: boolean;
    initialIsFavorite?: boolean;
    onFavoriteChange?: (productId: number, isFavorite: boolean) => void;
}) {
    const imageFrameClass = compact ? 'h-40' : 'h-[260px]';
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isSavingFavorite, setIsSavingFavorite] = useState(false);

    useEffect(() => {
        setIsFavorite(initialIsFavorite);
    }, [initialIsFavorite]);

    async function handleToggleFavorite() {
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
            const response = await toggleWishlist(authUser.id, product.id);

            setIsFavorite(response.is_favorite);
            onFavoriteChange?.(product.id, response.is_favorite);
        } finally {
            setIsSavingFavorite(false);
        }
    }

    return (
        <Link className="bakery-product-card group" href={`/products/${product.id}`}>
            <div className={`relative grid ${imageFrameClass} place-items-center overflow-hidden`} style={{ background: product.bg }}>
                {product.tag && <span className={`bakery-product-tag z-10 ${product.tagClass ?? 'bakery-pill-lav'}`}>{product.tag}</span>}
                <button
                    aria-label={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                    className={`absolute top-2.5 right-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 transition group-hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70 ${
                        isFavorite ? 'text-rose-500 shadow-[0_6px_18px_rgba(244,63,94,.22)]' : 'text-[var(--bakery-gray)]'
                    }`}
                    disabled={isSavingFavorite}
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        void handleToggleFavorite();
                    }}
                    type="button"
                >
                    <Heart fill={isFavorite ? 'currentColor' : 'none'} size={15} />
                </button>
                {product.imageUrl ? (
                    <img
                        className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        src={product.imageUrl}
                        alt={product.name}
                    />
                ) : (
                    <span className={`relative z-10 ${compact ? 'text-4xl' : 'text-[52px]'}`}>{product.emoji}</span>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="bakery-serif mb-1 text-[17px] text-[var(--bakery-dark)]">{product.name}</h3>
                <p className="mb-3 text-[12px] text-[var(--bakery-gray)]">{product.desc}</p>
                <div className="mt-auto flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-[var(--bakery-lav)]">{product.price}</span>
                    <button
                        aria-label="Thêm vào giỏ"
                        className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bakery-lav)] text-white transition hover:bg-[#6B6CAA]"
                        onClick={(event) => {
                            event.preventDefault();
                            addProductToCart(product);
                        }}
                        type="button"
                    >
                        <Plus size={17} />
                    </button>
                </div>
            </div>
        </Link>
    );
}
