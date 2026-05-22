import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, ShoppingBag, UserRound } from 'lucide-react';
import { PropsWithChildren, useEffect, useState } from 'react';

import { navLinks } from '@/data/bakery';
import { AuthUser, isAdminUser, readAuthUser } from '@/lib/auth-api';

type BakeryLayoutProps = PropsWithChildren<{
    title?: string;
    compact?: boolean;
}>;

export default function BakeryLayout({ children, compact = false }: BakeryLayoutProps) {
    const { url } = usePage();
    const [cartCount, setCartCount] = useState(0);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const readCart = () => {
            const cart = JSON.parse(localStorage.getItem('fleur-cart') ?? '[]') as { qty?: number }[];
            setCartCount(cart.reduce((total, item) => total + (item.qty ?? 0), 0));
        };

        readCart();
        window.addEventListener('fleur-cart-updated', readCart);

        return () => window.removeEventListener('fleur-cart-updated', readCart);
    }, []);

    useEffect(() => {
        const readUser = () => setAuthUser(readAuthUser());

        readUser();
        window.addEventListener('fleur-auth-updated', readUser);

        return () => window.removeEventListener('fleur-auth-updated', readUser);
    }, []);

    return (
        <div className="bakery-theme min-h-screen bg-[var(--bakery-cream)] text-[var(--bakery-dark)]">
            {!compact && (
                <nav className="sticky top-0 z-40 flex h-[62px] items-center justify-between border-b border-[var(--bakery-border)] bg-[rgba(250,250,247,.94)] px-[5%] backdrop-blur">
                    <Link className="bakery-serif text-[22px] tracking-[.5px] text-[var(--bakery-lav)] italic" href="/">
                        Fleur
                    </Link>
                    <div className="hidden items-center gap-7 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                className={`text-[13px] font-medium tracking-[.03em] text-[var(--bakery-gray)] transition hover:text-[var(--bakery-lav)] ${
                                    url === link.href ? 'text-[var(--bakery-lav)]' : ''
                                }`}
                                href={link.href}
                                key={link.href}
                                prefetch
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2.5">
                        {authUser && isAdminUser(authUser) && (
                            <Link
                                aria-label="Trang admin"
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--bakery-border)] bg-white px-4 text-[13px] font-semibold text-[var(--bakery-gray)] transition hover:border-[var(--bakery-lav)] hover:bg-[var(--bakery-lav-light)] hover:text-[var(--bakery-lav)]"
                                href="/admin"
                            >
                                <LayoutDashboard size={18} />
                                <span className="hidden sm:inline">Admin</span>
                            </Link>
                        )}
                        <Link
                            aria-label="Tài khoản"
                            className="grid h-11 w-11 place-items-center rounded-full text-[var(--bakery-gray)] transition hover:bg-[var(--bakery-lav-light)] hover:text-[var(--bakery-lav)]"
                            href="/account"
                        >
                            <UserRound size={20} />
                        </Link>
                        <Link
                            aria-label="Giỏ hàng"
                            className="relative grid h-11 w-11 place-items-center rounded-full text-[var(--bakery-gray)] transition hover:bg-[var(--bakery-lav-light)] hover:text-[var(--bakery-lav)]"
                            href="/cart"
                        >
                            <ShoppingBag size={20} />
                            <span className="absolute top-1 right-1 grid min-h-4 min-w-4 place-items-center rounded-full border border-[var(--bakery-cream)] bg-[var(--bakery-lav)] px-[3px] text-[9px] leading-none font-semibold text-white">
                                {cartCount}
                            </span>
                        </Link>
                        <Link
                            className="bakery-nav-btn shrink-0 whitespace-nowrap"
                            href={authUser ? '/account' : '/auth'}
                        >
                            {authUser ? authUser.username : 'Đăng nhập'}
                        </Link>
                    </div>
                </nav>
            )}
            {children}
        </div>
    );
}
