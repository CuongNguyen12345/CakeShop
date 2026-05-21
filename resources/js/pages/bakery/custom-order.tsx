import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { readAuthUser } from '@/lib/auth-api';

export default function CustomOrder() {
    const [flavor, setFlavor] = useState('🌸');
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

    useEffect(() => {
        if (!readAuthUser()) {
            router.visit('/auth', { replace: true });

            return;
        }

        setHasCheckedAuth(true);
    }, []);

    if (!hasCheckedAuth) {
        return (
            <BakeryLayout>
                <Head title="Đặt bánh theo yêu cầu" />
                <div className="grid min-h-[60vh] place-items-center px-[5%] text-center text-sm text-[var(--bakery-gray)]">
                    Đang kiểm tra đăng nhập...
                </div>
            </BakeryLayout>
        );
    }

    return (
        <BakeryLayout>
            <Head title="Đặt bánh theo yêu cầu" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10">
                <Breadcrumbs items={['Đặt bánh theo yêu cầu']} />
                <h1 className="bakery-section-title">
                    Đặt bánh <em>theo yêu cầu</em>
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">Tùy chỉnh hoàn toàn theo ý bạn: vị, kích thước, hình ảnh, chữ viết</p>
            </div>
            <section className="bakery-section">
                <div className="grid items-start gap-10 lg:grid-cols-2">
                    <div className="sticky top-20 grid min-h-[360px] place-items-center rounded-[24px] bg-[var(--bakery-lav-light)] p-10 text-center">
                        <div>
                            <div className="mb-4 text-[100px]">{flavor}</div>
                            <div className="bakery-serif mb-1 text-xl">Bánh của bạn</div>
                            <div className="text-[22px] font-semibold text-[var(--bakery-lav)]">350.000đ</div>
                            <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">Giá tạm tính · thay đổi theo tùy chọn</div>
                        </div>
                    </div>
                    <div className="grid gap-5">
                        <Choice
                            label="Chọn vị bánh"
                            options={['🌸 Sakura', '🍵 Matcha', '🫐 Blueberry', '🍓 Dâu tây', '🍋 Chanh', '🍫 Chocolate']}
                            onSelect={(option) => setFlavor(option.split(' ')[0])}
                        />
                        <div>
                            <span className="bakery-label">Kích thước</span>
                            <div className="grid grid-cols-3 gap-3">
                                {['4" · 250.000đ', '6" · 350.000đ', '8" · 500.000đ'].map((size, index) => (
                                    <div
                                        className={`rounded-[14px] border p-3 text-center ${index === 1 ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav-light)]' : 'border-[var(--bakery-border)] bg-white'}`}
                                        key={size}
                                    >
                                        <div className="font-semibold text-[var(--bakery-lav)]">{size.split(' · ')[0]}</div>
                                        <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{size.split(' · ')[1]}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Choice label="Loại kem phủ" options={['Kem tươi', 'Fondant', 'Buttercream', 'Gương (Mirror)']} />
                        <Field label="Chữ viết trên bánh" placeholder="VD: Happy Birthday Lan Anh 🌸" />
                        <div>
                            <span className="bakery-label">Upload hình ảnh (nếu có)</span>
                            <div className="rounded-[14px] border-2 border-dashed border-[var(--bakery-border)] p-7 text-center text-[13px] text-[var(--bakery-gray)]">
                                <div className="mb-2 text-3xl">📸</div>
                                Kéo thả hoặc click để chọn ảnh
                                <br />
                                <span className="text-[11px] text-[var(--bakery-lav)]">JPG, PNG · Tối đa 5MB</span>
                            </div>
                        </div>
                        <Field label="Ngày nhận bánh" placeholder="" type="date" />
                        <label>
                            <span className="bakery-label">Ghi chú thêm</span>
                            <textarea className="bakery-input min-h-28" placeholder="Dị ứng, yêu cầu đặc biệt..." />
                        </label>
                        <BakeryButton className="w-full" href="/order-confirm">
                            Gửi yêu cầu đặt bánh →
                        </BakeryButton>
                    </div>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function Choice({ label, options, onSelect }: { label: string; options: string[]; onSelect?: (option: string) => void }) {
    const [selected, setSelected] = useState(options[0]);

    return (
        <div>
            <span className="bakery-label">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                    <button
                        className={`rounded-full border px-4 py-2 text-[12px] ${selected === option ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white' : 'border-[var(--bakery-border)] bg-white'}`}
                        key={option}
                        onClick={() => {
                            setSelected(option);
                            onSelect?.(option);
                        }}
                        type="button"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Field({ label, placeholder, type = 'text' }: { label: string; placeholder: string; type?: string }) {
    return (
        <label>
            <span className="bakery-label">{label}</span>
            <input className="bakery-input" placeholder={placeholder} type={type} />
        </label>
    );
}
