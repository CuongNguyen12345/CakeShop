import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { products } from '@/data/bakery';
import { AuthUser, forgetAuthUser, readAuthUser } from '@/lib/auth-api';

export default function Account() {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        const storedUser = readAuthUser();

        if (!storedUser) {
            router.visit('/auth', { replace: true });

            return;
        }

        setAuthUser(storedUser);
        setHasCheckedAuth(true);
    }, []);

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
    const phoneNumber = authUser.phone_number ?? 'Chưa cập nhật số điện thoại';
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
                            <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{phoneNumber}</div>
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
                        {[
                            ['🌸', 'Sakura Mousse Cake 6"', '20/05/2025 · #FL2025-08471', 'Đang giao', '185.000đ'],
                            ['🍵', 'Matcha Lavender Roll · ×2', '12/05/2025 · #FL2025-07203', 'Hoàn thành', '290.000đ'],
                            ['🫐', 'Blueberry Cheesecake 8"', '03/05/2025 · #FL2025-06115', 'Hoàn thành', '420.000đ'],
                        ].map(([emoji, name, meta, status, price]) => (
                            <div className="mb-3 flex items-center gap-4 rounded-2xl border border-[var(--bakery-border)] bg-white p-4" key={name}>
                                <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--bakery-lav-light)] text-3xl">{emoji}</div>
                                <div>
                                    <div className="text-sm font-medium">{name}</div>
                                    <div className="mt-0.5 text-[12px] text-[var(--bakery-gray)]">{meta}</div>
                                    <span className="bakery-pill bakery-pill-lav mt-2">{status}</span>
                                </div>
                                <div className="ml-auto text-right">
                                    <div className="font-semibold text-[var(--bakery-lav)]">{price}</div>
                                    <BakeryButton className="mt-2 px-4 py-1.5 text-[12px]" href="/tracking" variant="lavender">
                                        Theo dõi
                                    </BakeryButton>
                                </div>
                            </div>
                        ))}
                        <hr className="my-10 border-[var(--bakery-border)]" />
                        <h2 className="bakery-section-title mb-5">
                            Wishlist <em>yêu thích</em>
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {products.slice(0, 4).map((product) => (
                                <ProductCard compact key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}
