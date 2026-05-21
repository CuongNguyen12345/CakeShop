import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter } from '@/components/bakery/shared';

export default function NotFound() {
    return (
        <BakeryLayout>
            <Head title="404" />
            <div className="flex min-h-[80vh] flex-col items-center justify-center px-[5%] py-16 text-center">
                <div className="bakery-serif text-[clamp(100px,18vw,180px)] leading-none text-[var(--bakery-lav-light)] italic">404</div>
                <div className="mb-7 text-4xl">🌸 🎂 💜</div>
                <h1 className="bakery-serif mb-3 text-3xl">Ồ không, trang này đã... bị ăn mất!</h1>
                <p className="mb-8 max-w-sm text-[15px] text-[var(--bakery-gray)]">
                    Có vẻ như trang bạn tìm không còn ở đây nữa. Nhưng bánh của chúng tôi thì vẫn còn rất nhiều!
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <BakeryButton href="/">🏠 Về trang chủ</BakeryButton>
                    <BakeryButton href="/menu" variant="secondary">
                        Xem thực đơn →
                    </BakeryButton>
                </div>
            </div>
            <BakeryFooter />
        </BakeryLayout>
    );
}
