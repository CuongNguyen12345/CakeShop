import { Head, router } from '@inertiajs/react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { readAuthUser, type AuthUser } from '@/lib/auth-api';
import { createCustomCake } from '@/lib/custom-cake-api';

type CustomCakeForm = {
    customer_name: string;
    customer_phone: string;
    cake_size: string;
    flavor: string;
    servings: string;
    desired_date: string;
    budget: string;
    text_on_cake: string;
    accessories: string;
    note: string;
};

const sizeOptions = ['4 inch', '6 inch', '8 inch', '10 inch', '2 tầng'];
const flavorOptions = ['Vanilla', 'Chocolate', 'Matcha', 'Dâu tây', 'Blueberry', 'Tiramisu'];
const accessoryOptions = ['Hoa kem', 'Trái cây', 'Nến', 'Mô hình nhỏ', 'Fondant', 'Không cần phụ kiện'];

export default function CustomOrder() {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [form, setForm] = useState<CustomCakeForm>({
        customer_name: '',
        customer_phone: '',
        cake_size: '6 inch',
        flavor: 'Chocolate',
        servings: '',
        desired_date: '',
        budget: '',
        text_on_cake: '',
        accessories: '',
        note: '',
    });

    useEffect(() => {
        const storedUser = readAuthUser();

        if (!storedUser) {
            router.visit('/auth', { replace: true });

            return;
        }

        setAuthUser(storedUser);
        setForm((current) => ({
            ...current,
            customer_name: storedUser.full_name || storedUser.name || storedUser.username || '',
            customer_phone: storedUser.phone_number || '',
            desired_date: nextAvailableDate(),
        }));
        setHasCheckedAuth(true);
    }, []);

    useEffect(() => {
        if (!referenceImage) {
            setPreviewUrl('');

            return;
        }

        const nextPreviewUrl = URL.createObjectURL(referenceImage);
        setPreviewUrl(nextPreviewUrl);

        return () => URL.revokeObjectURL(nextPreviewUrl);
    }, [referenceImage]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!authUser) {
            return;
        }

        setIsSubmitting(true);
        setError('');
        setMessage('');

        try {
            const payload = new FormData();
            payload.append('user_id', String(authUser.id));

            Object.entries(form).forEach(([key, value]) => {
                if (value !== '') {
                    payload.append(key, value);
                }
            });

            if (referenceImage) {
                payload.append('reference_image', referenceImage);
            }

            await createCustomCake(payload);

            setMessage('Đã gửi yêu cầu. Tiệm sẽ xem mẫu và phản hồi báo giá trong tài khoản của bạn.');
            setReferenceImage(null);
            setForm((current) => ({
                ...current,
                text_on_cake: '',
                accessories: '',
                note: '',
                budget: '',
            }));
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : 'Không gửi được yêu cầu đặt bánh riêng.');
        } finally {
            setIsSubmitting(false);
        }
    }

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
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--bakery-gray)]">
                    Gửi mẫu bánh và yêu cầu trước. Tiệm sẽ xem khả năng làm, nguyên liệu, thời gian rồi báo giá trước khi bạn thanh toán.
                </p>
            </div>
            <section className="bakery-section">
                <div className="grid items-start gap-7 lg:grid-cols-[360px_1fr]">
                    <aside className="sticky top-20 rounded-[20px] border border-[var(--bakery-border)] bg-white p-5">
                        <div className="overflow-hidden rounded-[16px] bg-[var(--bakery-lav-light)]">
                            {previewUrl ? (
                                <img className="h-64 w-full object-cover" src={previewUrl} alt="Ảnh mẫu bánh" />
                            ) : (
                                <div className="grid h-64 place-items-center px-8 text-center text-sm text-[var(--bakery-gray)]">
                                    Ảnh mẫu sẽ hiển thị tại đây sau khi bạn chọn file.
                                </div>
                            )}
                        </div>
                        <div className="mt-4 grid gap-3 text-[13px] text-[var(--bakery-gray)]">
                            <StepItem label="1. Gửi yêu cầu" />
                            <StepItem label="2. Tiệm kiểm tra mẫu, nguyên liệu và lịch làm" />
                            <StepItem label="3. Admin báo giá hoặc yêu cầu bổ sung" />
                            <StepItem label="4. Bạn xác nhận đặt sau khi đã có báo giá" />
                        </div>
                    </aside>

                    <form className="grid gap-5" onSubmit={handleSubmit}>
                        {(message || error) && (
                            <div
                                className={`rounded-2xl border p-4 text-sm ${
                                    error ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                }`}
                            >
                                {error || message}
                            </div>
                        )}

                        <FormSection title="Thông tin liên hệ">
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Họ và tên"
                                    onChange={(value) => updateForm('customer_name', value)}
                                    required
                                    value={form.customer_name}
                                />
                                <Field
                                    label="Số điện thoại"
                                    onChange={(value) => updateForm('customer_phone', value)}
                                    required
                                    value={form.customer_phone}
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Thông tin bánh">
                            <SegmentedOptions
                                label="Kích thước"
                                onChange={(value) => updateForm('cake_size', value)}
                                options={sizeOptions}
                                value={form.cake_size}
                            />
                            <SegmentedOptions
                                label="Vị bánh"
                                onChange={(value) => updateForm('flavor', value)}
                                options={flavorOptions}
                                value={form.flavor}
                            />
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field
                                    label="Số người ăn"
                                    onChange={(value) => updateForm('servings', value)}
                                    placeholder="VD: 8"
                                    type="number"
                                    value={form.servings}
                                />
                                <Field
                                    label="Ngày muốn nhận"
                                    min={formatDateInput(new Date())}
                                    onChange={(value) => updateForm('desired_date', value)}
                                    required
                                    type="date"
                                    value={form.desired_date}
                                />
                                <Field
                                    label="Ngân sách dự kiến"
                                    onChange={(value) => updateForm('budget', value)}
                                    placeholder="VD: 500000"
                                    type="number"
                                    value={form.budget}
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Mẫu tham khảo">
                            <label>
                                <span className="bakery-label">Upload ảnh mẫu bánh</span>
                                <input
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="bakery-input"
                                    onChange={(event) => setReferenceImage(event.target.files?.[0] ?? null)}
                                    type="file"
                                />
                                <span className="mt-1 block text-[12px] text-[var(--bakery-gray)]">JPG, PNG, WEBP. Tối đa 5MB.</span>
                            </label>
                            <Field
                                label="Chữ viết trên bánh"
                                onChange={(value) => updateForm('text_on_cake', value)}
                                placeholder="VD: Happy Birthday Lan Anh"
                                value={form.text_on_cake}
                            />
                            <SegmentedOptions
                                label="Phụ kiện mong muốn"
                                multiple
                                onChange={(value) => updateForm('accessories', value)}
                                options={accessoryOptions}
                                value={form.accessories}
                            />
                            <label>
                                <span className="bakery-label">Ghi chú thêm</span>
                                <textarea
                                    className="bakery-input min-h-32"
                                    onChange={(event) => updateForm('note', event.target.value)}
                                    placeholder="Mô tả điểm cần giống ảnh, màu chủ đạo, dị ứng, phần có thể thay đổi..."
                                    value={form.note}
                                />
                            </label>
                        </FormSection>

                        <button
                            className="bakery-btn bakery-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu báo giá'}
                        </button>
                    </form>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );

    function updateForm(field: keyof CustomCakeForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
    }
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
    return (
        <section className="rounded-[20px] border border-[var(--bakery-border)] bg-white p-6">
            <h2 className="bakery-serif mb-5 text-xl">{title}</h2>
            <div className="grid gap-4">{children}</div>
        </section>
    );
}

function Field({
    label,
    min,
    onChange,
    placeholder = '',
    required = false,
    type = 'text',
    value,
}: {
    label: string;
    min?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    type?: string;
    value: string;
}) {
    return (
        <label>
            <span className="bakery-label">
                {label}
                {required && <span className="ml-1 text-rose-500">*</span>}
            </span>
            <input
                className="bakery-input"
                min={min}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
                type={type}
                value={value}
            />
        </label>
    );
}

function SegmentedOptions({
    label,
    multiple = false,
    onChange,
    options,
    value,
}: {
    label: string;
    multiple?: boolean;
    onChange: (value: string) => void;
    options: string[];
    value: string;
}) {
    const selectedOptions = value
        .split(', ')
        .map((item) => item.trim())
        .filter(Boolean);

    return (
        <div>
            <span className="bakery-label">{label}</span>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = multiple ? selectedOptions.includes(option) : value === option;

                    return (
                        <button
                            className={`rounded-full border px-4 py-2 text-[12px] font-medium transition ${
                                isSelected
                                    ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white'
                                    : 'border-[var(--bakery-border)] bg-white text-[var(--bakery-gray)] hover:border-[var(--bakery-lav)] hover:text-[var(--bakery-lav)]'
                            }`}
                            key={option}
                            onClick={() => {
                                if (!multiple) {
                                    onChange(option);

                                    return;
                                }

                                const nextOptions = isSelected ? selectedOptions.filter((item) => item !== option) : [...selectedOptions, option];
                                onChange(nextOptions.join(', '));
                            }}
                            type="button"
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function StepItem({ label }: { label: string }) {
    return <div className="rounded-[12px] bg-[var(--bakery-gray-light)] px-4 py-3">{label}</div>;
}

function nextAvailableDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 2);

    return formatDateInput(date);
}

function formatDateInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
