import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryCard, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';

export default function Contact() {
    return (
        <BakeryLayout>
            <Head title="Liên hệ" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10">
                <Breadcrumbs items={['Liên hệ']} />
                <h1 className="bakery-section-title">
                    Liên <em>hệ</em> với chúng tôi
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">Có câu hỏi hay muốn đặt bánh số lượng lớn? Fleur luôn lắng nghe!</p>
            </div>
            <section className="bakery-section">
                <div className="grid items-start gap-12 lg:grid-cols-2">
                    <div>
                        <div className="mb-4 rounded-[20px] bg-[var(--bakery-lav-light)] p-7">
                            {[
                                ['📍', 'Địa chỉ', '123 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM'],
                                ['📞', 'Điện thoại', '0901 234 567'],
                                ['✉️', 'Email', 'hello@fleurbakery.vn'],
                                ['⏰', 'Giờ mở cửa', 'Thứ 2 - Chủ nhật · 7:00 - 21:00'],
                            ].map(([icon, label, value]) => (
                                <div className="mb-4 flex gap-3 last:mb-0" key={label}>
                                    <span className="text-2xl">{icon}</span>
                                    <div>
                                        <div className="text-[12px] text-[var(--bakery-gray)]">{label}</div>
                                        <div className="text-sm font-medium">{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grid h-60 place-items-center rounded-[20px] border border-[var(--bakery-border)] bg-[var(--bakery-green-light)] text-5xl">
                            🗺️
                        </div>
                    </div>
                    <BakeryCard className="p-7">
                        <h2 className="bakery-serif mb-1 text-2xl">
                            Gửi tin nhắn cho <em className="text-[var(--bakery-lav)]">Fleur</em>
                        </h2>
                        <p className="mb-6 text-[13px] text-[var(--bakery-gray)]">Chúng tôi sẽ phản hồi trong vòng 30 phút.</p>
                        <Field label="Họ và tên" placeholder="Tên của bạn" />
                        <Field label="Email" placeholder="email@example.com" type="email" />
                        <label className="mb-4 block">
                            <span className="bakery-label">Chủ đề</span>
                            <select className="bakery-input">
                                <option>Đặt bánh số lượng lớn</option>
                                <option>Hỏi về sản phẩm</option>
                                <option>Phản hồi đơn hàng</option>
                            </select>
                        </label>
                        <label className="mb-4 block">
                            <span className="bakery-label">Nội dung</span>
                            <textarea className="bakery-input min-h-32" placeholder="Nội dung tin nhắn..." />
                        </label>
                        <BakeryButton className="w-full">Gửi tin nhắn →</BakeryButton>
                    </BakeryCard>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function Field({ label, placeholder, type = 'text' }: { label: string; placeholder: string; type?: string }) {
    return (
        <label className="mb-4 block">
            <span className="bakery-label">{label}</span>
            <input className="bakery-input" placeholder={placeholder} type={type} />
        </label>
    );
}
