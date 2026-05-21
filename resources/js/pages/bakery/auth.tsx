import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { ApiRequestError, changePassword, isAdminUser, login, register, rememberAuthUser } from '@/lib/auth-api';

type AuthMode = 'login' | 'register' | 'forgot';

type AuthForm = {
    username: string;
    phone_number: string;
    password: string;
    password_confirmation: string;
    new_password: string;
    new_password_confirmation: string;
};

const initialForm: AuthForm = {
    username: '',
    phone_number: '',
    password: '',
    password_confirmation: '',
    new_password: '',
    new_password_confirmation: '',
};

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<AuthForm>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});
        setStatus(null);

        const clientErrors = validate(mode, form);

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);

            return;
        }

        setProcessing(true);

        try {
            if (mode === 'login') {
                const response = await login({
                    username: form.username,
                    password: form.password,
                });

                rememberAuthUser(response.user);
                router.visit(isAdminUser(response.user) ? '/admin' : '/');

                return;
            }

            if (mode === 'register') {
                const response = await register({
                    username: form.username,
                    phone_number: form.phone_number,
                    password: form.password,
                });

                rememberAuthUser(response.user);
                router.visit('/');

                return;
            }

            const response = await changePassword({
                username: form.username,
                phone_number: form.phone_number,
                new_password: form.new_password,
            });

            setStatus(response.message || 'Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
            setForm(initialForm);
            setMode('login');
        } catch (error) {
            if (error instanceof ApiRequestError) {
                setErrors(mode === 'login' ? {} : flattenErrors(error.errors));
                setStatus(error.message);
            } else {
                setStatus('Có lỗi xảy ra, vui lòng thử lại.');
            }
        } finally {
            setProcessing(false);
        }
    }

    function updateField(field: keyof AuthForm, value: string) {
        setForm((current) => ({ ...current, [field]: value }));
        setErrors((current) => {
            const nextErrors = { ...current };
            delete nextErrors[field];

            return nextErrors;
        });
    }

    function changeMode(nextMode: AuthMode) {
        setMode(nextMode);
        setErrors({});
        setStatus(null);
    }

    return (
        <BakeryLayout compact>
            <Head title={mode === 'register' ? 'Đăng ký' : mode === 'forgot' ? 'Đổi mật khẩu' : 'Đăng nhập'} />
            <div className="grid min-h-screen lg:grid-cols-2">
                <div className="relative hidden place-items-center overflow-hidden bg-[var(--bakery-lav-light)] p-16 text-center lg:grid">
                    <div className="absolute top-[5%] left-[-5%] h-64 w-64 rounded-full bg-[rgba(175,169,236,.3)]" />
                    <div className="absolute right-[-2%] bottom-[10%] h-44 w-44 rounded-full bg-[rgba(157,208,204,.35)]" />
                    <div className="relative">
                        <div className="bakery-serif text-4xl text-[var(--bakery-lav)] italic">Fleur</div>
                        <div className="mt-2 text-sm text-[var(--bakery-gray)]">Ngọt ngào từng khoảnh khắc</div>
                        <div className="my-7 text-7xl">🌸</div>
                        <p className="max-w-xs text-[13px] leading-7 text-[var(--bakery-gray)]">
                            Đăng nhập để theo dõi đơn hàng, lưu sản phẩm yêu thích và nhận ưu đãi đặc biệt.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col justify-center px-[8%] py-16">
                    <div className="bakery-serif mb-8 text-3xl text-[var(--bakery-lav)] italic">Fleur</div>
                    <h1 className="bakery-serif text-4xl">
                        {mode === 'register' ? 'Tạo tài khoản' : mode === 'forgot' ? 'Đổi mật khẩu' : 'Chào mừng trở lại'}
                    </h1>
                    <p className="mt-2 mb-8 text-sm text-[var(--bakery-gray)]">
                        {mode === 'register'
                            ? 'Đăng ký bằng tên đăng nhập, số điện thoại và mật khẩu.'
                            : mode === 'forgot'
                              ? 'Nhập tên đăng nhập, số điện thoại và mật khẩu mới.'
                              : 'Đăng nhập bằng tài khoản đã đăng ký.'}
                    </p>

                    {status && mode === 'login' && (
                        <div className="mb-5 rounded-[14px] border border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-4 py-3 text-sm text-[var(--bakery-lav)]">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <Field
                            error={errors.username}
                            label="Tên đăng nhập"
                            onChange={(value) => updateField('username', value)}
                            placeholder="VD: lananh"
                            value={form.username}
                        />

                        {mode !== 'login' && (
                            <Field
                                error={errors.phone_number}
                                label="Số điện thoại"
                                onChange={(value) => updateField('phone_number', value)}
                                placeholder="0901 234 567"
                                value={form.phone_number}
                            />
                        )}

                        {mode !== 'forgot' && (
                            <Field
                                error={errors.password}
                                label="Mật khẩu"
                                onChange={(value) => updateField('password', value)}
                                placeholder="••••••••"
                                type="password"
                                value={form.password}
                            />
                        )}

                        {mode === 'register' && (
                            <Field
                                error={errors.password_confirmation}
                                label="Xác nhận mật khẩu"
                                onChange={(value) => updateField('password_confirmation', value)}
                                placeholder="••••••••"
                                type="password"
                                value={form.password_confirmation}
                            />
                        )}

                        {mode === 'forgot' && (
                            <>
                                <Field
                                    error={errors.new_password}
                                    label="Mật khẩu mới"
                                    onChange={(value) => updateField('new_password', value)}
                                    placeholder="••••••••"
                                    type="password"
                                    value={form.new_password}
                                />
                                <Field
                                    error={errors.new_password_confirmation}
                                    label="Xác nhận mật khẩu mới"
                                    onChange={(value) => updateField('new_password_confirmation', value)}
                                    placeholder="••••••••"
                                    type="password"
                                    value={form.new_password_confirmation}
                                />
                            </>
                        )}

                        {mode === 'login' && (
                            <div className="-mt-2 mb-4 text-right">
                                <button className="text-[12px] text-[var(--bakery-lav)]" onClick={() => changeMode('forgot')} type="button">
                                    Quên/đổi mật khẩu?
                                </button>
                            </div>
                        )}

                        <button
                            className="bakery-btn bakery-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={processing}
                            type="submit"
                        >
                            {processing ? 'Đang xử lý...' : mode === 'register' ? 'Đăng ký →' : mode === 'forgot' ? 'Đổi mật khẩu →' : 'Đăng nhập →'}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <>
                            <div className="my-5 flex items-center gap-3 text-[12px] text-[var(--bakery-gray)] before:h-px before:flex-1 before:bg-[var(--bakery-border)] after:h-px after:flex-1 after:bg-[var(--bakery-border)]">
                                hoặc
                            </div>
                            <button className="bakery-btn bakery-btn-secondary w-full" type="button">
                                🌐 Tiếp tục với Google
                            </button>
                        </>
                    )}

                    <div className="mt-5 text-center text-[13px] text-[var(--bakery-gray)]">
                        {mode === 'login' && (
                            <>
                                Chưa có tài khoản?{' '}
                                <button className="font-medium text-[var(--bakery-lav)]" onClick={() => changeMode('register')} type="button">
                                    Đăng ký ngay
                                </button>
                            </>
                        )}
                        {mode !== 'login' && (
                            <button className="font-medium text-[var(--bakery-lav)]" onClick={() => changeMode('login')} type="button">
                                Quay lại đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </BakeryLayout>
    );
}

function Field({
    error,
    label,
    onChange,
    placeholder,
    type = 'text',
    value,
}: {
    error?: string;
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
            {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
        </label>
    );
}

function validate(mode: AuthMode, form: AuthForm): Record<string, string> {
    const nextErrors: Record<string, string> = {};

    if (!form.username.trim()) {
        nextErrors.username = 'Vui lòng nhập tên đăng nhập.';
    }

    if (mode !== 'login' && !form.phone_number.trim()) {
        nextErrors.phone_number = 'Vui lòng nhập số điện thoại.';
    }

    if (mode !== 'forgot' && form.password.length < 6) {
        nextErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (mode === 'register' && form.password !== form.password_confirmation) {
        nextErrors.password_confirmation = 'Mật khẩu xác nhận không khớp.';
    }

    if (mode === 'forgot' && form.new_password.length < 6) {
        nextErrors.new_password = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    }

    if (mode === 'forgot' && form.new_password !== form.new_password_confirmation) {
        nextErrors.new_password_confirmation = 'Mật khẩu mới xác nhận không khớp.';
    }

    return nextErrors;
}

function flattenErrors(errors: Record<string, string[]>): Record<string, string> {
    return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [field, messages[0] ?? 'Dữ liệu chưa hợp lệ.']));
}
