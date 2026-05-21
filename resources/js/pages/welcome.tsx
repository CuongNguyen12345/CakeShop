import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Heart, Leaf, ShoppingBag, Star, Truck } from 'lucide-react';

const heroImage = 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1800&q=85';

const categories = [
    {
        name: 'Banh kem',
        description: 'Dat banh sinh nhat, ky niem va tiec nho.',
        image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Banh mousse',
        description: 'Mem, mat, it ngot voi trai cay theo mua.',
        image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?auto=format&fit=crop&w=800&q=80',
    },
    {
        name: 'Banh mi ngot',
        description: 'Moi nuong moi ngay, thom bo va de an.',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    },
];

const products = [
    {
        name: 'Matcha Garden Cake',
        tag: 'Ban chay',
        price: '320.000d',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Strawberry Cream',
        tag: 'Tuoi moi',
        price: '280.000d',
        image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80',
    },
    {
        name: 'Chocolate Forest',
        tag: 'Dam vi',
        price: '350.000d',
        image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80',
    },
];

const highlights = [
    { icon: Leaf, title: 'Nguyen lieu tuoi', text: 'Kem, sua, bo va trai cay duoc chon moi moi ngay.' },
    { icon: Truck, title: 'Giao nhanh', text: 'Giao noi thanh trong ngay, giu lanh va giu form banh.' },
    { icon: Heart, title: 'Lam theo yeu cau', text: 'Tuy chinh loi chuc, mau sac va kich thuoc cho tung dip.' },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="CakeShop - Banh tuoi moi ngay">
                <meta head-key="description" name="description" content="CakeShop ban banh kem, banh mousse va banh mi ngot tuoi moi ngay." />
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <main className="min-h-screen bg-[#f7fbf4] text-[#17351f]">
                <section className="relative isolate min-h-[82svh] overflow-hidden">
                    <img src={heroImage} alt="Banh kem tuoi tai CakeShop" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,45,23,0.86),rgba(12,45,23,0.58),rgba(12,45,23,0.18))]" />

                    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-2 text-white">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white shadow-sm">
                                CS
                            </span>
                            <span className="text-lg font-semibold tracking-normal">CakeShop</span>
                        </Link>

                        <nav className="hidden items-center gap-7 text-sm font-medium text-white/88 md:flex">
                            <a href="#categories" className="hover:text-white">
                                Danh muc
                            </a>
                            <a href="#popular" className="hover:text-white">
                                Ban chay
                            </a>
                            <a href="#delivery" className="hover:text-white">
                                Giao hang
                            </a>
                        </nav>

                        <div className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="hidden h-10 items-center justify-center rounded-lg border border-white/40 px-4 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
                                    >
                                        Dang nhap
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                                    >
                                        Dang ky
                                    </Link>
                                </>
                            )}
                        </div>
                    </header>

                    <div className="relative z-10 mx-auto flex min-h-[calc(82svh-80px)] w-full max-w-7xl items-center px-5 pb-16 sm:px-6 lg:px-8">
                        <div className="max-w-2xl text-white">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/12 px-3 py-2 text-sm font-medium backdrop-blur">
                                <Leaf className="size-4 text-emerald-200" />
                                Banh tuoi moi ngay tu bep xanh
                            </div>
                            <h1 className="max-w-2xl text-5xl leading-tight font-bold tracking-normal sm:text-6xl lg:text-7xl">CakeShop</h1>
                            <p className="mt-5 max-w-xl text-lg leading-8 text-white/88">
                                Banh kem, mousse va banh mi ngot lam moi moi ngay. Huong vi can bang, trang tri tinh te, giao den dung hen cho tung
                                bua tiec.
                            </p>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="#popular"
                                    className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400"
                                >
                                    Xem banh noi bat
                                    <ArrowRight className="size-4" />
                                </a>
                                <a
                                    href="#categories"
                                    className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    Chon danh muc
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="categories" className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-14 sm:px-6 lg:px-8">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                        <div>
                            <p className="text-sm font-semibold text-emerald-700">Danh muc banh</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#17351f]">Chon nhanh theo nhu cau</h2>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-[#5f715e]">
                            Tu banh sinh nhat den banh an sang, moi nhom san pham duoc lam theo cong thuc rieng de giu do tuoi va vi ngon.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-3">
                        {categories.map((category) => (
                            <article key={category.name} className="overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-sm">
                                <img src={category.image} alt={category.name} className="aspect-[4/3] w-full object-cover" />
                                <div className="grid gap-2 p-5">
                                    <h3 className="text-lg font-semibold">{category.name}</h3>
                                    <p className="text-sm leading-6 text-[#5f715e]">{category.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="popular" className="bg-white py-14">
                    <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 sm:px-6 lg:px-8">
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div>
                                <p className="text-sm font-semibold text-emerald-700">San pham noi bat</p>
                                <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#17351f]">Nhung vi banh duoc yeu thich</h2>
                            </div>
                            <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900">
                                Xem tat ca
                                <ArrowRight className="size-4" />
                            </a>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {products.map((product) => (
                                <article key={product.name} className="overflow-hidden rounded-lg border border-neutral-200 bg-[#fbfdf8]">
                                    <div className="relative">
                                        <img src={product.image} alt={product.name} className="aspect-[5/4] w-full object-cover" />
                                        <span className="absolute top-3 left-3 rounded-lg bg-amber-300 px-3 py-1 text-xs font-semibold text-amber-950">
                                            {product.tag}
                                        </span>
                                    </div>
                                    <div className="grid gap-4 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold">{product.name}</h3>
                                                <div className="mt-2 flex gap-1 text-amber-500">
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <Star key={index} className="size-4 fill-current" />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="font-bold text-emerald-700">{product.price}</p>
                                        </div>
                                        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
                                            <ShoppingBag className="size-4" />
                                            Them vao gio
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="delivery" className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:px-6 lg:px-8">
                    <div className="grid gap-5 md:grid-cols-3">
                        {highlights.map((item) => (
                            <div key={item.title} className="grid gap-3 rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
                                <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                    <item.icon className="size-5" />
                                </div>
                                <h3 className="font-semibold">{item.title}</h3>
                                <p className="text-sm leading-6 text-[#5f715e]">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-6 rounded-lg bg-[#123d22] p-6 text-white md:grid-cols-[1.2fr_0.8fr] md:p-8">
                        <div>
                            <p className="text-sm font-semibold text-emerald-200">Dat banh cho dip gan nhat</p>
                            <h2 className="mt-2 text-3xl font-bold tracking-normal">Nhan tu van mau banh, kich thuoc va thoi gian giao</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/78">
                                CakeShop giup ban chon dung vi banh theo so luong khach, do tuoi va khong gian tiec.
                            </p>
                        </div>
                        <div className="flex flex-col justify-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-white/86">
                                <CheckCircle2 className="size-4 text-emerald-200" />
                                Dat truoc 2 gio cho banh co san
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/86">
                                <CheckCircle2 className="size-4 text-emerald-200" />
                                Tuy chinh loi chuc mien phi
                            </div>
                            <a
                                href="#popular"
                                className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                            >
                                Dat banh ngay
                                <ArrowRight className="size-4" />
                            </a>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
