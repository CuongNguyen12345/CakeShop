import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, KeyRound, LogIn, RefreshCw, RotateCcw, ShieldCheck, UserPlus } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';

type ApiPayload = Record<string, string>;

type ApiResult = {
    status: number;
    ok: boolean;
    data: unknown;
};

type ApiUser = {
    id: number;
    username?: string;
    name?: string;
    role?: string;
    phone_number?: string;
    login_by_google?: boolean;
    created_at?: string;
    updated_at?: string;
};

const defaultRegister = {
    username: 'new_user',
    phone_number: '0900000009',
    password: 'secret123',
};

const defaultLogin = {
    username: 'new_user',
    password: 'secret123',
};

const defaultForgotPassword = {
    username: 'new_user',
    phone_number: '0900000009',
    new_password: 'newsecret123',
};

const defaultGoogleLogin = {
    username: 'google_user',
    phone_number: '0900000010',
};

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

async function callApi(endpoint: string, method: 'GET' | 'POST', payload?: ApiPayload): Promise<ApiResult> {
    const response = await fetch(endpoint, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: payload ? JSON.stringify(payload) : undefined,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    return {
        status: response.status,
        ok: response.ok,
        data,
    };
}

function valueFor(user: ApiUser): string {
    return user.username ?? user.name ?? `User #${user.id}`;
}

function AuthForm({
    title,
    icon,
    endpoint,
    defaults,
    submitLabel,
    passwordFields = [],
    onResult,
}: {
    title: string;
    icon: ReactNode;
    endpoint: string;
    defaults: ApiPayload;
    submitLabel: string;
    passwordFields?: string[];
    onResult: (result: ApiResult) => void;
}) {
    const [payload, setPayload] = useState<ApiPayload>(defaults);
    const [processing, setProcessing] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setProcessing(true);

        try {
            onResult(await callApi(endpoint, 'POST', payload));
        } catch (error) {
            onResult({
                status: 0,
                ok: false,
                data: {
                    message: error instanceof Error ? error.message : 'Request failed',
                },
            });
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    {icon}
                    {title}
                </CardTitle>
                <span className="text-muted-foreground rounded-md border px-2 py-1 font-mono text-xs">{endpoint}</span>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <form onSubmit={submit} className="grid gap-3">
                    {Object.entries(payload).map(([field, value]) => (
                        <div key={field} className="grid gap-1.5">
                            <Label htmlFor={`${endpoint}-${field}`} className="text-xs">
                                {field}
                            </Label>
                            <Input
                                id={`${endpoint}-${field}`}
                                type={passwordFields.includes(field) ? 'password' : 'text'}
                                value={value}
                                onChange={(event) => setPayload((current) => ({ ...current, [field]: event.target.value }))}
                            />
                        </div>
                    ))}
                    <div className="flex items-center gap-2 pt-1">
                        <Button type="submit" disabled={processing} className="min-w-32">
                            {processing ? <RefreshCw className="animate-spin" /> : <CheckCircle2 />}
                            {submitLabel}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setPayload(defaults)}>
                            <RotateCcw />
                            Reset
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function ApiTester() {
    const [result, setResult] = useState<ApiResult | null>(null);
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const resultTone = useMemo(() => {
        if (!result) {
            return 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300';
        }

        return result.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
            : 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100';
    }, [result]);

    async function loadUsers() {
        setLoadingUsers(true);

        try {
            const response = await callApi('/api/users', 'GET');
            setResult(response);

            if (response.ok && typeof response.data === 'object' && response.data && 'data' in response.data) {
                setUsers((response.data as { data: ApiUser[] }).data);
            }
        } catch (error) {
            setResult({
                status: 0,
                ok: false,
                data: {
                    message: error instanceof Error ? error.message : 'Request failed',
                },
            });
        } finally {
            setLoadingUsers(false);
        }
    }

    function handleResult(nextResult: ApiResult) {
        setResult(nextResult);

        if (nextResult.ok) {
            void loadUsers();
        }
    }

    useEffect(() => {
        void loadUsers();
    }, []);

    return (
        <>
            <Head title="API Tester" />
            <main className="min-h-screen bg-neutral-50 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-100">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
                    <header className="flex flex-col justify-between gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center dark:border-neutral-800">
                        <div className="grid gap-1">
                            <h1 className="text-2xl font-semibold">API Tester</h1>
                            <p className="text-muted-foreground text-sm">Register, login, reset password, Google login, and user list.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline">
                                <Link href="/">Home</Link>
                            </Button>
                            <Button type="button" onClick={loadUsers} disabled={loadingUsers}>
                                <RefreshCw className={loadingUsers ? 'animate-spin' : ''} />
                                Users
                            </Button>
                        </div>
                    </header>

                    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
                        <div className="grid gap-4 md:grid-cols-2">
                            <AuthForm
                                title="Dang ky"
                                icon={<UserPlus className="size-4 text-blue-600" />}
                                endpoint="/api/register"
                                defaults={defaultRegister}
                                submitLabel="Dang ky"
                                passwordFields={['password']}
                                onResult={handleResult}
                            />
                            <AuthForm
                                title="Dang nhap"
                                icon={<LogIn className="size-4 text-emerald-600" />}
                                endpoint="/api/login"
                                defaults={defaultLogin}
                                submitLabel="Dang nhap"
                                passwordFields={['password']}
                                onResult={handleResult}
                            />
                            <AuthForm
                                title="Quen mat khau"
                                icon={<KeyRound className="size-4 text-amber-600" />}
                                endpoint="/api/forgot-password"
                                defaults={defaultForgotPassword}
                                submitLabel="Cap nhat"
                                passwordFields={['new_password']}
                                onResult={handleResult}
                            />
                            <AuthForm
                                title="Login Google"
                                icon={<ShieldCheck className="size-4 text-rose-600" />}
                                endpoint="/api/login/google"
                                defaults={defaultGoogleLogin}
                                submitLabel="Google"
                                onResult={handleResult}
                            />
                        </div>

                        <aside className="grid content-start gap-4">
                            <Card className="rounded-lg">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-base">Response</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className={`min-h-48 rounded-md border p-3 ${resultTone}`}>
                                        <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                                            <span className="font-medium">{result ? `HTTP ${result.status}` : 'Waiting'}</span>
                                            <span>{result?.ok ? 'OK' : result ? 'Error' : 'Idle'}</span>
                                        </div>
                                        <pre className="max-h-[360px] overflow-auto text-xs leading-5 whitespace-pre-wrap">
                                            {result ? prettyJson(result.data) : 'Submit a form or load users.'}
                                        </pre>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-lg">
                                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-4">
                                    <CardTitle className="text-base">Users</CardTitle>
                                    <span className="rounded-md bg-blue-100 px-2 py-1 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                                        {users.length}
                                    </span>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <div className="grid max-h-[420px] gap-2 overflow-auto">
                                        {users.length === 0 ? (
                                            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">No users loaded.</div>
                                        ) : (
                                            users.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="bg-background grid gap-1 rounded-md border p-3 text-sm dark:border-neutral-800"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="font-medium">{valueFor(user)}</span>
                                                        <span className="rounded-md border px-2 py-0.5 text-xs">{user.role ?? 'User'}</span>
                                                    </div>
                                                    <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                        <span>ID {user.id}</span>
                                                        {user.phone_number && <span>{user.phone_number}</span>}
                                                        <span>Google: {user.login_by_google ? '1' : '0'}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </section>
                </div>
            </main>
        </>
    );
}
