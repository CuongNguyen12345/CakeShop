import { Head, router } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { ApiRequestError, changePassword, googleLogin, isAdminUser, login, register, rememberAuthUser } from '@/lib/auth-api';

type AuthMode = 'login' | 'register' | 'forgot';

type AuthForm = {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    new_password: string;
    new_password_confirmation: string;
};

const initialForm: AuthForm = {
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    new_password: '',
    new_password_confirmation: '',
};

type GoogleCredentialResponse = {
    credential?: string;
};

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { callback: (response: GoogleCredentialResponse) => void; client_id: string; locale?: string }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: {
                            logo_alignment?: 'left' | 'center';
                            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
                            size?: 'large' | 'medium' | 'small';
                            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                            theme?: 'outline' | 'filled_blue' | 'filled_black';
                            type?: 'standard' | 'icon';
                            width?: number;
                        },
                    ) => void;
                };
            };
        };
    }
}

export default function Auth() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [form, setForm] = useState<AuthForm>(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const googleButtonRef = useRef<HTMLDivElement | null>(null);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    const [status, setStatus] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleGoogleCredential = useCallback(async (credentialResponse: GoogleCredentialResponse) => {
        if (!credentialResponse.credential) {
            setStatus('Khong nhan duoc thong tin dang nhap Google.');

            return;
        }

        setErrors({});
        setStatus(null);
        setProcessing(true);

        try {
            const response = await googleLogin({
                credential: credentialResponse.credential,
            });

            rememberAuthUser(response.user);
            router.visit(isAdminUser(response.user) ? '/admin' : '/');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Khong dang nhap Google duoc, vui long thu lai.');
        } finally {
            setProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (mode !== 'login' || !googleClientId || !googleButtonRef.current) {
            return;
        }

        let isActive = true;

        loadGoogleIdentityScript()
            .then(() => {
                if (!isActive || !window.google || !googleButtonRef.current) {
                    return;
                }

                window.google.accounts.id.initialize({
                    callback: handleGoogleCredential,
                    client_id: googleClientId,
                    locale: 'vi',
                });

                const buttonWidth = Math.min(400, googleButtonRef.current.clientWidth || 400);

                googleButtonRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    logo_alignment: 'center',
                    shape: 'pill',
                    size: 'large',
                    text: 'continue_with',
                    theme: 'outline',
                    type: 'standard',
                    width: buttonWidth,
                });
            })
            .catch(() => {
                if (isActive) {
                    setStatus('Khong tai duoc Google Sign-In. Vui long thu lai sau.');
                }
            });

        return () => {
            isActive = false;
        };
    }, [googleClientId, handleGoogleCredential, mode]);

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
                    email: form.email,
                    password: form.password,
                });

                rememberAuthUser(response.user);
                router.visit('/');

                return;
            }

            const response = await changePassword({
                username: form.username,
                email: form.email,
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
                            ? 'Đăng ký bằng tên đăng nhập, email và mật khẩu.'
                            : mode === 'forgot'
                              ? 'Nhập tên đăng nhập, email và mật khẩu mới.'
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
                                error={errors.email}
                                label="Email"
                                onChange={(value) => updateField('email', value)}
                                placeholder="ban@example.com"
                                type="email"
                                value={form.email}
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
                            {googleClientId ? (
                                <div className={`flex min-h-11 w-full justify-center ${processing ? 'pointer-events-none opacity-70' : ''}`} ref={googleButtonRef} />
                            ) : (
                                <button
                                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[var(--bakery-border)] bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                    onClick={() => setStatus('Vui long cau hinh VITE_GOOGLE_CLIENT_ID de bat dang nhap Google.')}
                                    type="button"
                                >
                                    <GoogleIcon />
                                    Tiếp tục với Google
                                </button>
                            )}
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

function loadGoogleIdentityScript(): Promise<void> {
    const existingScript = document.getElementById('google-identity-services');

    if (window.google) {
        return Promise.resolve();
    }

    if (existingScript) {
        return new Promise((resolve, reject) => {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(), { once: true });
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => reject(), { once: true });
        document.head.appendChild(script);
    });
}

function GoogleIcon() {
    return (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 18 18">
            <path
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
                fill="#4285F4"
            />
            <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.94v2.33A9 9 0 0 0 9 18Z" fill="#34A853" />
            <path d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.05l3.02-2.33Z" fill="#FBBC05" />
            <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.95l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58Z" fill="#EA4335" />
        </svg>
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

    if (mode !== 'login' && !form.email.trim()) {
        nextErrors.email = 'Vui lòng nhập email.';
    } else if (mode !== 'login' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Email chưa đúng định dạng.';
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
