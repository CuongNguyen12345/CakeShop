import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { BakeryProduct, formatMoney } from '@/data/bakery';
import { AuthUser, forgetAuthUser, readAuthUser } from '@/lib/auth-api';
import { listUserOrders, type OrderPaymentStatusResponse } from '@/lib/payment-api';
import { mapCakeProductToBakeryProduct } from '@/lib/product-presenter';
import { listWishlist } from '@/lib/wishlist-api';

export default function Account() {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [orders, setOrders] = useState<OrderPaymentStatusResponse[]>([]);
    const [wishlistError, setWishlistError] = useState('');
    const [wishlistProducts, setWishlistProducts] = useState<BakeryProduct[]>([]);

    useEffect(() => {
        const storedUser = readAuthUser();

        if (!storedUser) {
            router.visit('/auth', { replace: true });

            return;
        }

        setAuthUser(storedUser);
        setHasCheckedAuth(true);
    }, []);

    useEffect(() => {
        if (!authUser) {
            return;
        }

        let isActive = true;

        const loadOrders = async () => {
            setIsLoadingOrders(true);
            setOrderError('');

            try {
                const nextOrders = await listUserOrders(authUser.id);

                if (isActive) {
                    setOrders(nextOrders);
                }
            } catch (error) {
                if (isActive) {
                    setOrderError(error instanceof Error ? error.message : 'Không tải được lịch sử đơn hàng.');
                }
            } finally {
                if (isActive) {
                    setIsLoadingOrders(false);
                }
            }
        };

        void loadOrders();

        return () => {
            isActive = false;
        };
    }, [authUser]);

    useEffect(() => {
        if (!authUser) {
            return;
        }

        let isActive = true;

        const loadWishlist = async () => {
            setIsLoadingWishlist(true);
            setWishlistError('');

            try {
                const products = await listWishlist(authUser.id);

                if (isActive) {
                    setWishlistProducts(products.map(mapCakeProductToBakeryProduct));
                }
            } catch (error) {
                if (isActive) {
                    setWishlistError(error instanceof Error ? error.message : 'Không tải được wishlist.');
                }
            } finally {
                if (isActive) {
                    setIsLoadingWishlist(false);
                }
            }
        };

        void loadWishlist();

        return () => {
            isActive = false;
        };
    }, [authUser]);

    if (!hasCheckedAuth || !authUser) {
        return (
            <BakeryLayout>
                <Head title="Tài khoản" />
                <div className="grid min-h-[60vh] place-items-center px-[5%] text-center text-sm text-[var(--bakery-gray)]">
                    Đang kiểm tra đăng nhập...
                </div>
            </BakeryLayout>
        );
    }

    const username = authUser.username;
    const email = authUser.email ?? 'Chưa cập nhật email';
    const initials = username
        .split(/[\s_]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <BakeryLayout>
            <Head title="Tài khoản" />
            <section className="bakery-section">
                <Breadcrumbs items={['Tài khoản']} />
                <div className="grid items-start gap-7 lg:grid-cols-[240px_1fr]">
                    <aside className="sticky top-20 overflow-hidden rounded-[20px] border border-[var(--bakery-border)] bg-white">
                        <div className="bg-[var(--bakery-lav-light)] p-7 text-center">
                            <div className="bakery-serif mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full bg-[var(--bakery-lav)] text-2xl text-white">
                                {initials || 'FL'}
                            </div>
                            <div className="text-[15px] font-medium">{username}</div>
                            <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{email}</div>
                        </div>
                        {['📋 Lịch sử đơn hàng', '💜 Wishlist', '📍 Địa chỉ giao hàng', '⚙️ Thông tin cá nhân', '🔔 Thông báo'].map((item, index) => (
                            <div
                                className={`border-b border-[var(--bakery-border)] px-5 py-3 text-[13px] font-medium last:border-b-0 ${index === 0 ? 'bg-[var(--bakery-lav-light)] text-[var(--bakery-lav)]' : 'text-[var(--bakery-gray)]'}`}
                                key={item}
                            >
                                {item}
                            </div>
                        ))}
                        <button
                            className="w-full px-5 py-3 text-left text-[13px] font-medium text-[var(--bakery-gray)]"
                            onClick={() => {
                                forgetAuthUser();
                                window.location.href = '/auth';
                            }}
                            type="button"
                        >
                            🚪 Đăng xuất
                        </button>
                    </aside>
                    <div>
                        <h1 className="bakery-section-title mb-5">
                            Lịch sử <em>đơn hàng</em>
                        </h1>
                        {isLoadingOrders && <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6 text-sm text-[var(--bakery-gray)]">Đang tải lịch sử đơn hàng...</div>}
                        {orderError && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">{orderError}</div>}
                        {!isLoadingOrders && !orderError && orders.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                                Bạn chưa có đơn hàng nào trong tài khoản này.
                            </div>
                        )}
                        {!isLoadingOrders && orders.map((order) => <OrderHistoryCard key={order.order_code} order={order} />)}

                        <hr className="my-10 border-[var(--bakery-border)]" />

                        <h2 className="bakery-section-title mb-5">
                            Wishlist <em>yêu thích</em>
                        </h2>
                        {isLoadingWishlist && <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6 text-sm text-[var(--bakery-gray)]">Đang tải wishlist...</div>}
                        {wishlistError && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">{wishlistError}</div>}
                        {!isLoadingWishlist && !wishlistError && wishlistProducts.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                                Bạn chưa yêu thích chiếc bánh nào.
                            </div>
                        )}
                        {!isLoadingWishlist && wishlistProducts.length > 0 && (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {wishlistProducts.map((product) => (
                                    <ProductCard
                                        compact
                                        initialIsFavorite
                                        key={product.id}
                                        onFavoriteChange={(productId, isFavorite) => {
                                            if (!isFavorite) {
                                                setWishlistProducts((current) => current.filter((item) => item.id !== productId));
                                            }
                                        }}
                                        product={product}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function OrderHistoryCard({ order }: { order: OrderPaymentStatusResponse }) {
    const firstItem = order.items[0];
    const itemTitle = firstItem ? `${firstItem.name}${firstItem.quantity > 1 ? ` · ×${firstItem.quantity}` : ''}` : 'Đơn hàng';
    const itemMeta = [formatDisplayDate(order.delivery_date), `#${order.order_code}`].filter(Boolean).join(' · ');

    return (
        <div className="mb-3 flex items-center gap-4 rounded-2xl border border-[var(--bakery-border)] bg-white p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--bakery-lav-light)] text-2xl">
                {firstItem?.image_url ? <img className="h-full w-full object-cover" src={firstItem.image_url} alt={firstItem.name} /> : '🍰'}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-medium">{itemTitle}</div>
                <div className="mt-0.5 text-[12px] text-[var(--bakery-gray)]">{itemMeta}</div>
                <span className="bakery-pill bakery-pill-lav mt-2">{order.order_status_label}</span>
            </div>
            <div className="ml-auto shrink-0 text-right">
                <div className="font-semibold text-[var(--bakery-lav)]">{formatMoney(order.amount)}</div>
                <BakeryButton className="mt-2 px-4 py-1.5 text-[12px]" href={`/tracking?order_code=${encodeURIComponent(order.order_code)}`} variant="lavender">
                    Theo dõi
                </BakeryButton>
            </div>
        </div>
    );
}

function formatDisplayDate(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleDateString('vi-VN');
}
