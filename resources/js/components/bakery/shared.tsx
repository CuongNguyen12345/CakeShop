import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export function BakeryButton({
    children,
    href,
    variant = 'primary',
    className = '',
    onClick,
}: PropsWithChildren<{
    href?: string;
    variant?: 'primary' | 'secondary' | 'green' | 'lavender';
    className?: string;
    onClick?: () => void;
}>) {
    const classNames = `bakery-btn bakery-btn-${variant} ${className}`;

    if (href) {
        return (
            <Link className={classNames} href={href}>
                {children}
            </Link>
        );
    }

    return (
        <button className={classNames} onClick={onClick} type="button">
            {children}
        </button>
    );
}

export function SectionHeader({ title, emphasized, href }: { title: string; emphasized?: string; href?: string }) {
    return (
        <div className="mb-7 flex items-end justify-between gap-5">
            <h2 className="bakery-section-title">
                {title} {emphasized && <em>{emphasized}</em>}
            </h2>
            {href && (
                <Link className="text-[13px] font-medium text-[var(--bakery-lav)] underline-offset-4 hover:underline" href={href}>
                    Xem tất cả →
                </Link>
            )}
        </div>
    );
}

export function BakeryFooter() {
    return (
        <footer className="bg-[var(--bakery-dark)] px-[5%] pt-12 pb-7 text-white/60">
            <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
                <div>
                    <div className="bakery-serif mb-2 text-[22px] text-[var(--bakery-lav-soft)] italic">Fleur</div>
                    <p className="max-w-[230px] text-[13px] leading-7 text-white/40">Bánh handmade tươi ngon mỗi ngày, giao tận nơi khắp TP.HCM.</p>
                </div>
                <FooterCol title="Thực đơn" links={['Mousse cake', 'Cupcake', 'Croissant', 'Bánh sinh nhật']} />
                <FooterCol title="Thông tin" links={['Về chúng tôi', 'Blog', 'Đặt theo yêu cầu', 'Chính sách']} />
                <FooterCol title="Liên hệ" links={['📍 Quận 3, TP.HCM', '📞 0901 234 567', '✉️ hello@fleur.vn', '⏰ 7:00 - 21:00']} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-[12px] text-white/30">
                <span>© 2025 Fleur Bakery. Made with love in Sài Gòn.</span>
                <div className="flex gap-2">
                    {['📷', '🎵', '💬'].map((item) => (
                        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-sm text-white/50" key={item}>
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </footer>
    );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
    return (
        <div>
            <h4 className="mb-3 text-[12px] font-medium tracking-[.06em] text-white/90 uppercase">{title}</h4>
            <div className="grid gap-2 text-[13px] text-white/40">
                {links.map((link) => (
                    <span key={link}>{link}</span>
                ))}
            </div>
        </div>
    );
}

export function Breadcrumbs({ items }: { items: string[] }) {
    return (
        <div className="mb-6 flex items-center gap-2 text-[12px] text-[var(--bakery-gray)]">
            <Link className="text-[var(--bakery-lav)]" href="/">
                Trang chủ
            </Link>
            {items.map((item) => (
                <span className="flex items-center gap-2" key={item}>
                    <span className="opacity-50">/</span>
                    <span>{item}</span>
                </span>
            ))}
        </div>
    );
}

export function BakeryCard({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
    return <div className={`rounded-[20px] border border-[var(--bakery-border)] bg-white ${className}`}>{children}</div>;
}
