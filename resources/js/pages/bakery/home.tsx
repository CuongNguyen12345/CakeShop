import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryButton, BakeryFooter, SectionHeader } from '@/components/bakery/shared';
import { products } from '@/data/bakery';

export default function Home() {
    return (
        <BakeryLayout>
            <Head title="Fleur Bakery" />
            <section className="grid min-h-[88vh] overflow-hidden lg:grid-cols-2">
                <div className="flex flex-col justify-center px-[8%] py-20">
                    <div className="mb-6 w-fit rounded-full bg-[var(--bakery-lav-light)] px-4 py-1.5 text-[12px] font-medium tracking-[.04em] text-[var(--bakery-lav)]">
                        ✦ Bánh tươi mỗi ngày · Giao tận nơi
                    </div>
                    <h1 className="bakery-serif mb-5 text-[clamp(44px,5.5vw,72px)] leading-[1.08] text-[var(--bakery-dark)]">
                        Ngọt ngào
                        <br />
                        như một <em className="text-[var(--bakery-lav)]">buổi sáng</em>
                        <br />
                        mùa xuân
                    </h1>
                    <p className="mb-9 max-w-[400px] text-[15px] leading-7 text-[var(--bakery-gray)]">
                        Bánh handmade từ nguyên liệu tự nhiên, không phẩm màu. Mỗi chiếc bánh là một khoảnh khắc đáng nhớ dành riêng cho bạn.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <BakeryButton href="/menu">Xem thực đơn →</BakeryButton>
                        <BakeryButton href="/custom-order" variant="secondary">
                            Đặt bánh sinh nhật
                        </BakeryButton>
                    </div>
                    <div className="mt-12 flex gap-9 border-t border-[var(--bakery-border)] pt-9">
                        {[
                            ['2.4k+', 'Khách hài lòng'],
                            ['48', 'Loại bánh'],
                            ['4.9★', 'Đánh giá TB'],
                        ].map(([number, label]) => (
                            <div key={label}>
                                <div className="bakery-serif text-3xl font-semibold">{number}</div>
                                <div className="mt-0.5 text-[12px] text-[var(--bakery-gray)]">{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative hidden items-center justify-center overflow-hidden bg-[var(--bakery-lav-light)] lg:flex">
                    <div className="absolute top-[5%] left-[5%] h-80 w-80 rounded-full bg-[rgba(175,169,236,.35)]" />
                    <div className="absolute right-[8%] bottom-[10%] h-52 w-52 rounded-full bg-[rgba(157,208,204,.4)]" />
                    <div className="relative z-10 w-60 rounded-[24px] border border-[rgba(124,125,184,.2)] bg-white p-8 text-center">
                        <span className="mb-2 block text-7xl">🌸</span>
                        <div className="bakery-serif mb-1 text-lg">Sakura Mousse</div>
                        <div className="text-xl font-semibold text-[var(--bakery-lav)]">185.000đ</div>
                        <div className="mt-2 inline-block rounded-full bg-[var(--bakery-lav-light)] px-3 py-1 text-[10px] font-medium text-[var(--bakery-lav)]">
                            ✨ Bán chạy nhất
                        </div>
                    </div>
                    <FloatingNote className="top-[16%] right-[5%]" emoji="🌿" title="Mới ra hôm nay" sub="Matcha Lavender Roll" />
                    <FloatingNote className="bottom-[16%] left-[3%]" emoji="⚡" title="Chỉ còn 3 cái!" sub="Violet Cheesecake" />
                </div>
            </section>

            <div className="border-b border-[var(--bakery-border)] px-[5%] py-6">
                <div className="flex gap-4 overflow-x-auto pb-1">
                    {['🌸 Sakura', '🍵 Matcha', '🫐 Blueberry', '💜 Lavender', '🍋 Chanh', '🎁 Quà tặng', '🍓 Dâu tây', '🎂 Sinh nhật'].map(
                        (story) => (
                            <div className="grid min-w-16 justify-items-center gap-1 text-[10px] font-medium text-[var(--bakery-gray)]" key={story}>
                                <div className="grid h-[60px] w-[60px] place-items-center rounded-full border-2 border-[var(--bakery-lav)] bg-[var(--bakery-lav-light)] text-2xl">
                                    {story.split(' ')[0]}
                                </div>
                                <span>{story.split(' ').slice(1).join(' ')}</span>
                            </div>
                        ),
                    )}
                </div>
            </div>

            <section className="bakery-section">
                <SectionHeader emphasized="nổi bật" href="/menu" title="Thực đơn" />
                <div className="bakery-product-grid">
                    {products.slice(0, 6).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            <section className="mx-[5%] rounded-[28px] bg-[var(--bakery-lav-light)] p-10 lg:p-14">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <div>
                        <div className="bakery-pill bakery-pill-lav mb-5">✦ Câu chuyện của chúng tôi</div>
                        <h2 className="bakery-section-title">
                            Làm bằng <em>tình yêu</em>,<br />
                            không phải dây chuyền
                        </h2>
                        <p className="my-5 max-w-lg text-sm leading-7 text-[var(--bakery-gray)]">
                            Fleur Bakery ra đời từ căn bếp nhỏ của một người yêu bánh. Mỗi ngày chúng tôi dậy từ 4h sáng để những chiếc bánh tươi nhất
                            đến tay bạn trước 10h.
                        </p>
                        <BakeryButton href="/about" variant="lavender">
                            Khám phá thêm →
                        </BakeryButton>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {['🌿', '🥚', '🧈', '🌸'].map((item) => (
                            <div className="grid aspect-square place-items-center rounded-[18px] bg-white/50 text-5xl" key={item}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bakery-section">
                <SectionHeader emphasized="Fleur?" title="Tại sao chọn" />
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['🌿', '100% nguyên liệu tự nhiên', 'Không phẩm màu, không bột nở hóa học, nguồn gốc rõ ràng.'],
                        ['⏰', 'Làm mới mỗi sáng', 'Bánh xuất lò từ 4h sáng, giao trước 10h trong nội thành.'],
                        ['🎨', 'Tùy chỉnh theo ý bạn', 'In hình, chữ, màu sắc, vị bánh theo yêu cầu.'],
                        ['🚀', 'Giao nhanh 2h', 'Đặt trước 8h sáng, nhận bánh trước trưa.'],
                    ].map(([emoji, title, desc]) => (
                        <div className="rounded-[18px] border border-[var(--bakery-border)] bg-white p-5" key={title}>
                            <div className="mb-3 text-3xl">{emoji}</div>
                            <div className="mb-1 text-sm font-medium">{title}</div>
                            <p className="text-[12px] leading-5 text-[var(--bakery-gray)]">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-[5%] mb-14 flex flex-wrap items-center justify-between gap-6 rounded-[24px] bg-[var(--bakery-lav)] px-[8%] py-10 text-white">
                <div>
                    <div className="bakery-serif mb-1 text-[28px]">Nhận ưu đãi 10% đơn đầu 🎁</div>
                    <div className="text-sm text-white/75">Đăng ký nhận thông tin bánh mới và khuyến mãi</div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input className="rounded-full border-0 px-5 py-3 text-sm text-[var(--bakery-dark)] outline-none" placeholder="Email của bạn" />
                    <BakeryButton variant="secondary" className="border-white bg-white text-[var(--bakery-lav)]">
                        Nhận ưu đãi →
                    </BakeryButton>
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function FloatingNote({ emoji, title, sub, className }: { emoji: string; title: string; sub: string; className: string }) {
    return (
        <div className={`absolute z-20 flex items-center gap-2 rounded-2xl border border-[var(--bakery-border)] bg-white px-3 py-2 ${className}`}>
            <span className="text-[22px]">{emoji}</span>
            <div>
                <div className="text-[12px] font-medium">{title}</div>
                <div className="text-[10px] text-[var(--bakery-gray)]">{sub}</div>
            </div>
        </div>
    );
}
