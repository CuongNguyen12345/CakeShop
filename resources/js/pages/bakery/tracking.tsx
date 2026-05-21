import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter } from '@/components/bakery/shared';

export default function Tracking() {
    return (
        <BakeryLayout>
            <Head title="Theo dõi đơn hàng" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10 text-center">
                <h1 className="bakery-section-title">
                    Theo dõi <em>đơn hàng</em>
                </h1>
                <div className="mx-auto mt-5 flex max-w-md gap-2">
                    <input className="bakery-input" defaultValue="#FL2025-08471" placeholder="Nhập mã đơn hàng..." />
                    <BakeryButton>Tìm</BakeryButton>
                </div>
            </div>
            <section className="bakery-section">
                <div className="mx-auto max-w-2xl">
                    <div className="mb-7 rounded-[20px] bg-[var(--bakery-lav-light)] p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-[12px] text-[var(--bakery-gray)]">Mã đơn hàng</div>
                                <div className="bakery-serif my-1 text-[28px] text-[var(--bakery-lav)]">#FL2025-08471</div>
                            </div>
                            <span className="bakery-pill bakery-pill-lav">Đang làm bánh</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-6 text-[13px]">
                            <Info label="Ngày đặt" value="20/05/2025" />
                            <Info label="Giao đến" value="123 Lê Văn Sỹ, Q3" />
                            <Info label="Dự kiến" value="21/05 · 8-10h sáng" />
                        </div>
                    </div>
                    <div>
                        {[
                            ['✓', 'Đặt hàng thành công', '20/05/2025 · 14:32', 'done'],
                            ['✓', 'Đơn hàng được xác nhận', '20/05/2025 · 14:45', 'done'],
                            ['👨‍🍳', 'Đang làm bánh', 'Dự kiến hoàn thành lúc 7h sáng mai', 'active'],
                            ['📦', 'Đóng gói & bàn giao shipper', 'Chờ xử lý', 'pending'],
                            ['🚀', 'Đang giao hàng', 'Chờ xử lý', 'pending'],
                            ['🎉', 'Giao hàng thành công', 'Chờ xử lý', 'pending'],
                        ].map(([icon, title, time, state]) => (
                            <div className="flex gap-4 py-4" key={title}>
                                <div
                                    className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                                        state === 'done'
                                            ? 'bg-[var(--bakery-green-light)]'
                                            : state === 'active'
                                              ? 'bg-[var(--bakery-lav-light)] shadow-[0_0_0_4px_rgba(124,125,184,.2)]'
                                              : 'bg-[var(--bakery-gray-light)]'
                                    }`}
                                >
                                    {icon}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">{title}</div>
                                    <div className="text-[12px] text-[var(--bakery-gray)]">{time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex justify-center gap-3">
                        <BakeryButton href="/" variant="secondary">
                            ← Về trang chủ
                        </BakeryButton>
                        <BakeryButton href="/contact" variant="lavender">
                            Liên hệ hỗ trợ
                        </BakeryButton>
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] text-[var(--bakery-gray)]">{label}</div>
            <div className="font-medium">{value}</div>
        </div>
    );
}
