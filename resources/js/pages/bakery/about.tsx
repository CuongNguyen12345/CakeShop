import { Head } from '@inertiajs/react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import { BakeryButton, BakeryFooter, SectionHeader } from '@/components/bakery/shared';

export default function About() {
    return (
        <BakeryLayout>
            <Head title="Về chúng tôi" />
            <section className="grid items-center gap-12 bg-[var(--bakery-lav-light)] px-[5%] py-20 lg:grid-cols-2">
                <div>
                    <div className="bakery-pill bakery-pill-lav mb-5">✦ Câu chuyện của chúng tôi</div>
                    <h1 className="bakery-section-title text-[clamp(36px,5vw,56px)]">
                        Fleur ra đời từ
                        <br />
                        một <em>chiếc bánh</em>
                        <br />
                        cho mẹ
                    </h1>
                    <p className="my-6 max-w-[440px] text-[15px] leading-7 text-[var(--bakery-gray)]">
                        Năm 2018, Lan làm một chiếc bánh mousse nhỏ cho mẹ nhân ngày sinh nhật. Mẹ khóc. Bạn bè hỏi đặt. Và Fleur Bakery bắt đầu từ
                        đó.
                    </p>
                    <BakeryButton href="/contact">Liên hệ chúng tôi →</BakeryButton>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {['🌸', '🍵', '🎂', '💜'].map((item) => (
                        <div className="grid aspect-[4/3] place-items-center rounded-[18px] bg-white/45 text-5xl" key={item}>
                            {item}
                        </div>
                    ))}
                </div>
            </section>
            <section className="grid items-center gap-12 bg-[var(--bakery-dark)] px-[5%] py-16 text-white lg:grid-cols-2">
                <div>
                    <h2 className="bakery-serif mb-4 text-4xl leading-tight">
                        Số liệu <em className="text-[var(--bakery-lav-soft)]">của chúng tôi</em>
                    </h2>
                    <p className="text-sm leading-7 text-white/60">7 năm làm bánh, hàng nghìn khoảnh khắc ngọt ngào được tạo nên từ căn bếp nhỏ.</p>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    {['2.4k+ Khách hàng', '48 Loại bánh', '7 Năm kinh nghiệm', '4.9★ Đánh giá'].map((item) => (
                        <div className="rounded-[18px] bg-white/5 p-6 text-center" key={item}>
                            <div className="bakery-serif text-4xl text-[var(--bakery-lav-soft)]">{item.split(' ')[0]}</div>
                            <div className="mt-1 text-[13px] text-white/50">{item.split(' ').slice(1).join(' ')}</div>
                        </div>
                    ))}
                </div>
            </section>
            <section className="bakery-section">
                <SectionHeader emphasized="Fleur" title="Đội ngũ" />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {['👩‍🍳 Nguyễn Lan · Founder', '👨‍🍳 Trần Minh · Pastry Chef', '👩‍🎨 Lê Hương · Cake Designer', '👩‍💼 Phạm Vy · Customer Experience'].map(
                        (member) => (
                            <div className="rounded-[18px] border border-[var(--bakery-border)] bg-white p-6 text-center" key={member}>
                                <div className="mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full bg-[var(--bakery-lav-light)] text-3xl">
                                    {member.split(' ')[0]}
                                </div>
                                <div className="bakery-serif text-lg">{member.split(' · ')[0].replace(member.split(' ')[0], '').trim()}</div>
                                <div className="mt-1 text-[12px] text-[var(--bakery-gray)]">{member.split(' · ')[1]}</div>
                            </div>
                        ),
                    )}
                </div>
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}
