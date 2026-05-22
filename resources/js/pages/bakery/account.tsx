import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { BakeryProduct, CartItem, formatMoney } from '@/data/bakery';
import { ApiRequestError, forgetAuthUser, readAuthUser, rememberAuthUser, updateUserProfile, type AuthUser } from '@/lib/auth-api';
import { listCustomCakes, type CustomCakeRequest } from '@/lib/custom-cake-api';
import { listUserOrders, type OrderPaymentStatusResponse } from '@/lib/payment-api';
import { mapCakeProductToBakeryProduct } from '@/lib/product-presenter';
import { listWishlist } from '@/lib/wishlist-api';

type AccountTab = 'orders' | 'custom' | 'wishlist' | 'address' | 'profile' | 'notifications';

type ProfileForm = {
    full_name: string;
    username: string;
    email: string;
};

type AddressForm = {
    phone_number: string;
    delivery_address: string;
    delivery_district: string;
};

const districtOptions = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh'];

const statusNotifications: Record<string, { title: string; body: string }> = {
    pending: {
        title: 'Đơn hàng đang chờ xác nhận',
        body: 'Tiệm đã nhận đơn và sẽ kiểm tra thông tin trước khi chuẩn bị bánh.',
    },
    confirmed: {
        title: 'Đơn hàng đã xác nhận',
        body: 'Đơn đã được xác nhận, tiệm sẽ bắt đầu chuẩn bị theo lịch giao.',
    },
    baking: {
        title: 'Đơn hàng đang làm',
        body: 'Bánh đang được chuẩn bị trong bếp.',
    },
    ready_for_shipper: {
        title: 'Đơn hàng sẵn sàng giao',
        body: 'Bánh đã hoàn tất và đang chờ bàn giao cho shipper.',
    },
    shipping: {
        title: 'Đơn hàng đang giao',
        body: 'Shipper đang giao bánh đến địa chỉ của bạn.',
    },
    delivered: {
        title: 'Đơn hàng đã giao',
        body: 'Đơn đã hoàn tất. Cảm ơn bạn đã đặt bánh tại Fleur.',
    },
};

export default function Account() {
    const [activeTab, setActiveTab] = useState<AccountTab>('orders');
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isLoadingCustomCakes, setIsLoadingCustomCakes] = useState(false);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [customCakeError, setCustomCakeError] = useState('');
    const [customCakes, setCustomCakes] = useState<CustomCakeRequest[]>([]);
    const [orderError, setOrderError] = useState('');
    const [orders, setOrders] = useState<OrderPaymentStatusResponse[]>([]);
    const [profileForm, setProfileForm] = useState<ProfileForm>({ full_name: '', username: '', email: '' });
    const [addressForm, setAddressForm] = useState<AddressForm>({ phone_number: '', delivery_address: '', delivery_district: '' });
    const [saveError, setSaveError] = useState('');
    const [saveMessage, setSaveMessage] = useState('');
    const [wishlistError, setWishlistError] = useState('');
    const [wishlistProducts, setWishlistProducts] = useState<BakeryProduct[]>([]);

    const notifications = useMemo(() => buildOrderNotifications(orders), [orders]);

    useEffect(() => {
        const storedUser = readAuthUser();

        if (!storedUser) {
            router.visit('/auth', { replace: true });

            return;
        }

        setAuthUser(storedUser);
        setProfileForm(profileFormFromUser(storedUser));
        setAddressForm(addressFormFromUser(storedUser));
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

        const loadCustomCakes = async () => {
            setIsLoadingCustomCakes(true);
            setCustomCakeError('');

            try {
                const response = await listCustomCakes({ user_id: authUser.id });

                if (isActive) {
                    setCustomCakes(response.data);
                }
            } catch (error) {
                if (isActive) {
                    setCustomCakeError(error instanceof Error ? error.message : 'Không tải được yêu cầu bánh riêng.');
                }
            } finally {
                if (isActive) {
                    setIsLoadingCustomCakes(false);
                }
            }
        };

        void loadCustomCakes();

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

    async function handleSaveProfile() {
        if (!authUser) {
            return;
        }

        setIsSavingProfile(true);
        setSaveError('');
        setSaveMessage('');

        try {
            const response = await updateUserProfile(authUser.id, {
                full_name: profileForm.full_name,
                username: profileForm.username,
                email: profileForm.email,
            });

            rememberAuthUser(response.user);
            setAuthUser(response.user);
            setProfileForm(profileFormFromUser(response.user));
            setSaveMessage('Đã lưu thông tin cá nhân.');
        } catch (error) {
            setSaveError(getProfileError(error));
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handleSaveAddress() {
        if (!authUser) {
            return;
        }

        setIsSavingAddress(true);
        setSaveError('');
        setSaveMessage('');

        try {
            const response = await updateUserProfile(authUser.id, addressForm);

            rememberAuthUser(response.user);
            setAuthUser(response.user);
            setAddressForm(addressFormFromUser(response.user));
            setSaveMessage('Đã lưu địa chỉ giao hàng.');
        } catch (error) {
            setSaveError(getProfileError(error));
        } finally {
            setIsSavingAddress(false);
        }
    }

    function handleStartCustomCakeCheckout(customCake: CustomCakeRequest) {
        if (!customCake.estimated_price) {
            return;
        }

        const cart = JSON.parse(localStorage.getItem('fleur-cart') ?? '[]') as CartItem[];
        const customCartItem: CartItem = {
            id: 100000000 + customCake.id,
            customCakeId: customCake.id,
            name: `Bánh đặt riêng #${customCake.id}`,
            desc: [customCake.cake_size, customCake.flavor, customCake.desired_date ? `Nhận ${formatDisplayDate(customCake.desired_date)}` : null]
                .filter(Boolean)
                .join(' · '),
            price: customCake.estimated_price_formatted ?? formatMoney(customCake.estimated_price),
            priceN: customCake.estimated_price,
            emoji: 'FL',
            bg: 'var(--bakery-lav-light)',
            imageUrl: customCake.reference_image_url ?? undefined,
            qty: 1,
        };

        localStorage.setItem('fleur-cart', JSON.stringify([...cart.filter((item) => item.customCakeId !== customCake.id), customCartItem]));
        window.dispatchEvent(new Event('fleur-cart-updated'));
        router.visit('/checkout');
    }

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

    const displayName = authUser.full_name || authUser.name || authUser.username;
    const email = authUser.email ?? 'Chưa cập nhật email';
    const initials = displayName
        .split(/[\s_]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    const tabs: Array<{ id: AccountTab; label: string; count?: number }> = [
        { id: 'orders', label: 'Lịch sử đơn hàng', count: orders.length },
        { id: 'custom', label: 'Bánh đặt riêng', count: customCakes.length },
        { id: 'wishlist', label: 'Wishlist', count: wishlistProducts.length },
        { id: 'address', label: 'Địa chỉ giao hàng' },
        { id: 'profile', label: 'Thông tin cá nhân' },
        { id: 'notifications', label: 'Thông báo', count: notifications.length },
    ];

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
                            <div className="text-[15px] font-medium">{displayName}</div>
                            <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{email}</div>
                        </div>
                        {tabs.map((tab) => (
                            <button
                                className={`flex w-full items-center justify-between gap-3 border-b border-[var(--bakery-border)] px-5 py-3 text-left text-[13px] font-medium last:border-b-0 ${
                                    activeTab === tab.id ? 'bg-[var(--bakery-lav-light)] text-[var(--bakery-lav)]' : 'text-[var(--bakery-gray)]'
                                }`}
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                type="button"
                            >
                                <span>{tab.label}</span>
                                {typeof tab.count === 'number' && (
                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[var(--bakery-gray)]">{tab.count}</span>
                                )}
                            </button>
                        ))}
                        <button
                            className="w-full px-5 py-3 text-left text-[13px] font-medium text-[var(--bakery-gray)]"
                            onClick={() => {
                                forgetAuthUser();
                                window.location.href = '/auth';
                            }}
                            type="button"
                        >
                            Đăng xuất
                        </button>
                    </aside>
                    <div>
                        {(saveMessage || saveError) && (
                            <div
                                className={`mb-5 rounded-2xl border p-4 text-sm ${
                                    saveError ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                }`}
                            >
                                {saveError || saveMessage}
                            </div>
                        )}

                        {activeTab === 'orders' && <OrdersPanel isLoading={isLoadingOrders} error={orderError} orders={orders} />}

                        {activeTab === 'custom' && (
                            <CustomCakesPanel
                                customCakes={customCakes}
                                error={customCakeError}
                                isLoading={isLoadingCustomCakes}
                                onCheckout={handleStartCustomCakeCheckout}
                            />
                        )}

                        {activeTab === 'wishlist' && (
                            <WishlistPanel
                                error={wishlistError}
                                isLoading={isLoadingWishlist}
                                products={wishlistProducts}
                                onRemove={(productId) => setWishlistProducts((current) => current.filter((item) => item.id !== productId))}
                            />
                        )}

                        {activeTab === 'address' && (
                            <AddressPanel
                                form={addressForm}
                                isSaving={isSavingAddress}
                                onChange={(field, value) => setAddressForm((current) => ({ ...current, [field]: value }))}
                                onSubmit={handleSaveAddress}
                            />
                        )}

                        {activeTab === 'profile' && (
                            <ProfilePanel
                                form={profileForm}
                                isSaving={isSavingProfile}
                                onChange={(field, value) => setProfileForm((current) => ({ ...current, [field]: value }))}
                                onSubmit={handleSaveProfile}
                            />
                        )}

                        {activeTab === 'notifications' && <NotificationsPanel notifications={notifications} />}
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function OrdersPanel({ error, isLoading, orders }: { error: string; isLoading: boolean; orders: OrderPaymentStatusResponse[] }) {
    return (
        <>
            <h1 className="bakery-section-title mb-5">
                Lịch sử <em>đơn hàng</em>
            </h1>
            {isLoading && (
                <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6 text-sm text-[var(--bakery-gray)]">
                    Đang tải lịch sử đơn hàng...
                </div>
            )}
            {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}
            {!isLoading && !error && orders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                    Bạn chưa có đơn hàng nào trong tài khoản này.
                </div>
            )}
            {!isLoading && orders.map((order) => <OrderHistoryCard key={order.order_code} order={order} />)}
        </>
    );
}

function CustomCakesPanel({
    customCakes,
    error,
    isLoading,
    onCheckout,
}: {
    customCakes: CustomCakeRequest[];
    error: string;
    isLoading: boolean;
    onCheckout: (customCake: CustomCakeRequest) => void;
}) {
    return (
        <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h1 className="bakery-section-title">
                    Bánh <em>đặt riêng</em>
                </h1>
                <BakeryButton className="px-4 py-2 text-[12px]" href="/custom-order" variant="lavender">
                    Gửi yêu cầu mới
                </BakeryButton>
            </div>
            {isLoading && (
                <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6 text-sm text-[var(--bakery-gray)]">
                    Đang tải yêu cầu bánh riêng...
                </div>
            )}
            {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}
            {!isLoading && !error && customCakes.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                    Bạn chưa gửi yêu cầu bánh đặt riêng nào.
                </div>
            )}
            <div className="grid gap-4">
                {!isLoading &&
                    customCakes.map((customCake) => (
                        <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-5" key={customCake.id}>
                            <div className="flex flex-wrap gap-4">
                                <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--bakery-lav-light)] text-sm font-semibold text-[var(--bakery-lav)]">
                                    {customCake.reference_image_url ? (
                                        <img
                                            className="h-full w-full object-cover"
                                            src={customCake.reference_image_url}
                                            alt={`Mẫu bánh #${customCake.id}`}
                                        />
                                    ) : (
                                        'FL'
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-sm font-semibold">Yêu cầu #{customCake.id}</h2>
                                        <span className="bakery-pill bakery-pill-lav">{customCake.status_label}</span>
                                    </div>
                                    <div className="mt-2 grid gap-1 text-[13px] text-[var(--bakery-gray)]">
                                        <span>
                                            {[customCake.cake_size, customCake.flavor, customCake.servings ? `${customCake.servings} người ăn` : null]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </span>
                                        {customCake.desired_date && <span>Ngày muốn nhận: {formatDisplayDate(customCake.desired_date)}</span>}
                                        {customCake.budget_formatted && <span>Ngân sách dự kiến: {customCake.budget_formatted}</span>}
                                        {customCake.admin_note && <span>Phản hồi từ tiệm: {customCake.admin_note}</span>}
                                    </div>
                                </div>
                                <div className="ml-auto shrink-0 text-right">
                                    <div className="font-semibold text-[var(--bakery-lav)]">
                                        {customCake.estimated_price_formatted ?? 'Chờ báo giá'}
                                    </div>
                                    {customCake.status === 'quoted' && customCake.estimated_price && (
                                        <button
                                            className="bakery-btn bakery-btn-primary mt-3 px-4 py-2 text-[12px]"
                                            onClick={() => onCheckout(customCake)}
                                            type="button"
                                        >
                                            Đặt bánh này
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </>
    );
}

function WishlistPanel({
    error,
    isLoading,
    onRemove,
    products,
}: {
    error: string;
    isLoading: boolean;
    onRemove: (productId: number) => void;
    products: BakeryProduct[];
}) {
    return (
        <>
            <h1 className="bakery-section-title mb-5">
                Wishlist <em>yêu thích</em>
            </h1>
            {isLoading && (
                <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6 text-sm text-[var(--bakery-gray)]">
                    Đang tải wishlist...
                </div>
            )}
            {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>}
            {!isLoading && !error && products.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                    Bạn chưa yêu thích chiếc bánh nào.
                </div>
            )}
            {!isLoading && products.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {products.map((product) => (
                        <ProductCard
                            compact
                            initialIsFavorite
                            key={product.id}
                            onFavoriteChange={(productId, isFavorite) => {
                                if (!isFavorite) {
                                    onRemove(productId);
                                }
                            }}
                            product={product}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

function AddressPanel({
    form,
    isSaving,
    onChange,
    onSubmit,
}: {
    form: AddressForm;
    isSaving: boolean;
    onChange: (field: keyof AddressForm, value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6">
            <h1 className="bakery-section-title mb-5">
                Địa chỉ <em>giao hàng</em>
            </h1>
            <div className="grid gap-4 md:grid-cols-2">
                <Field
                    label="Số điện thoại"
                    onChange={(value) => onChange('phone_number', value)}
                    placeholder="0901 234 567"
                    value={form.phone_number}
                />
                <SelectField
                    label="Quận/Huyện"
                    onChange={(value) => onChange('delivery_district', value)}
                    options={districtOptions}
                    value={form.delivery_district}
                />
            </div>
            <Field
                label="Địa chỉ"
                onChange={(value) => onChange('delivery_address', value)}
                placeholder="Số nhà, tên đường"
                value={form.delivery_address}
            />
            <button
                className="bakery-btn bakery-btn-primary mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={onSubmit}
                type="button"
            >
                {isSaving ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
        </div>
    );
}

function ProfilePanel({
    form,
    isSaving,
    onChange,
    onSubmit,
}: {
    form: ProfileForm;
    isSaving: boolean;
    onChange: (field: keyof ProfileForm, value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-6">
            <h1 className="bakery-section-title mb-5">
                Thông tin <em>cá nhân</em>
            </h1>
            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Họ và tên" onChange={(value) => onChange('full_name', value)} placeholder="Nguyễn Văn A" value={form.full_name} />
                <Field label="Tên đăng nhập" onChange={(value) => onChange('username', value)} placeholder="ten_dang_nhap" value={form.username} />
            </div>
            <Field label="Email" onChange={(value) => onChange('email', value)} placeholder="ban@example.com" type="email" value={form.email} />
            <button
                className="bakery-btn bakery-btn-primary mt-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
                onClick={onSubmit}
                type="button"
            >
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
        </div>
    );
}

function NotificationsPanel({
    notifications,
}: {
    notifications: Array<{
        body: string;
        code: string;
        date: string | null;
        label: string;
        title: string;
    }>;
}) {
    return (
        <>
            <h1 className="bakery-section-title mb-5">
                Thông <em>báo</em>
            </h1>
            {notifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--bakery-border)] bg-white p-8 text-center text-sm text-[var(--bakery-gray)]">
                    Chưa có thông báo đơn hàng.
                </div>
            )}
            <div className="grid gap-3">
                {notifications.map((notification) => (
                    <div className="rounded-2xl border border-[var(--bakery-border)] bg-white p-5" key={notification.code}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold">{notification.title}</div>
                                <div className="mt-1 text-[13px] text-[var(--bakery-gray)]">{notification.body}</div>
                                <div className="mt-2 text-[12px] text-[var(--bakery-gray)]">
                                    Đơn #{notification.code}
                                    {notification.date ? ` · ${notification.date}` : ''}
                                </div>
                            </div>
                            <span className="bakery-pill bakery-pill-lav">{notification.label}</span>
                        </div>
                        <BakeryButton
                            className="mt-4 px-4 py-1.5 text-[12px]"
                            href={`/tracking?order_code=${encodeURIComponent(notification.code)}`}
                            variant="lavender"
                        >
                            Theo dõi đơn
                        </BakeryButton>
                    </div>
                ))}
            </div>
        </>
    );
}

function OrderHistoryCard({ order }: { order: OrderPaymentStatusResponse }) {
    const firstItem = order.items[0];
    const itemTitle = firstItem ? `${firstItem.name}${firstItem.quantity > 1 ? ` · x${firstItem.quantity}` : ''}` : 'Đơn hàng';
    const itemMeta = [formatDisplayDate(order.delivery_date), `#${order.order_code}`].filter(Boolean).join(' · ');

    return (
        <div className="mb-3 flex items-center gap-4 rounded-2xl border border-[var(--bakery-border)] bg-white p-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--bakery-lav-light)] text-sm font-semibold text-[var(--bakery-lav)]">
                {firstItem?.image_url ? <img className="h-full w-full object-cover" src={firstItem.image_url} alt={firstItem.name} /> : 'FL'}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-medium">{itemTitle}</div>
                <div className="mt-0.5 text-[12px] text-[var(--bakery-gray)]">{itemMeta}</div>
                <span className="bakery-pill bakery-pill-lav mt-2">{order.order_status_label}</span>
            </div>
            <div className="ml-auto shrink-0 text-right">
                <div className="font-semibold text-[var(--bakery-lav)]">{formatMoney(order.amount)}</div>
                <BakeryButton
                    className="mt-2 px-4 py-1.5 text-[12px]"
                    href={`/tracking?order_code=${encodeURIComponent(order.order_code)}`}
                    variant="lavender"
                >
                    Theo dõi
                </BakeryButton>
            </div>
        </div>
    );
}

function Field({
    label,
    onChange,
    placeholder,
    type = 'text',
    value,
}: {
    label: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    value: string;
}) {
    return (
        <label className="mb-4 block">
            <span className="bakery-label">{label}</span>
            <input className="bakery-input" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />
        </label>
    );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: string[]; value: string }) {
    return (
        <label className="mb-4 block">
            <span className="bakery-label">{label}</span>
            <select className="bakery-input" onChange={(event) => onChange(event.target.value)} value={value}>
                <option value="">Chọn quận/huyện</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function profileFormFromUser(user: AuthUser): ProfileForm {
    return {
        full_name: user.full_name ?? user.name ?? '',
        username: user.username ?? '',
        email: user.email ?? '',
    };
}

function addressFormFromUser(user: AuthUser): AddressForm {
    return {
        phone_number: user.phone_number ?? '',
        delivery_address: user.delivery_address ?? '',
        delivery_district: user.delivery_district ?? '',
    };
}

function buildOrderNotifications(orders: OrderPaymentStatusResponse[]) {
    return orders.map((order) => {
        const copy = statusNotifications[order.order_status] ?? {
            title: 'Đơn hàng đã cập nhật',
            body: 'Trạng thái đơn hàng của bạn vừa được cập nhật.',
        };

        return {
            ...copy,
            code: order.order_code,
            date: formatDisplayDate(order.delivery_date),
            label: order.order_status_label,
        };
    });
}

function getProfileError(error: unknown): string {
    if (error instanceof ApiRequestError) {
        return error.message;
    }

    return error instanceof Error ? error.message : 'Không thể lưu thông tin. Vui lòng thử lại.';
}

function formatDisplayDate(value?: string | null): string | null {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleDateString('vi-VN');
}
