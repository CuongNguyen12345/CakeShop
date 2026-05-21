import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { blogPosts } from '@/data/bakery';

export default function Blog() {
    return (
        <BakeryLayout>
            <Head title="Blog" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-12">
                <Breadcrumbs items={['Blog']} />
                <h1 className="bakery-section-title">
                    Blog <em>& Công thức</em>
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">Chia sẻ bí quyết làm bánh, câu chuyện và cảm hứng từ bếp bánh Fleur</p>
            </div>
            <section className="bakery-section">
                <div className="mb-7 flex flex-wrap gap-2">
                    {['Tất cả', 'Công thức', 'Câu chuyện', 'Mẹo làm bánh', 'Nguyên liệu'].map((category, index) => (
                        <span
                            className={`rounded-full border px-4 py-2 text-[13px] ${index === 0 ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white' : 'border-[var(--bakery-border)] bg-white text-[var(--bakery-gray)]'}`}
                            key={category}
                        >
                            {category}
                        </span>
                    ))}
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {blogPosts.map((post) => (
                        <article
                            className="overflow-hidden rounded-[18px] border border-[var(--bakery-border)] bg-white transition hover:-translate-y-1"
                            key={post.title}
                        >
                            <div className="grid h-44 place-items-center text-6xl" style={{ background: post.bg }}>
                                {post.emoji}
                            </div>
                            <div className="p-5">
                                <div className="mb-2 text-[10px] font-semibold tracking-[.06em] text-[var(--bakery-lav)] uppercase">
                                    {post.category}
                                </div>
                                <h2 className="bakery-serif mb-2 text-xl leading-snug">{post.title}</h2>
                                <p className="mb-3 text-[13px] leading-6 text-[var(--bakery-gray)]">{post.excerpt}</p>
                                <div className="text-[11px] text-[var(--bakery-gray)]">{post.meta}</div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}
