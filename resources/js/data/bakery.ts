export type BakeryProduct = {
    id: number;
    name: string;
    desc: string;
    price: string;
    priceN: number;
    emoji: string;
    bg: string;
    categoryId?: number | null;
    imageUrl?: string | null;
    stockQuantity?: number;
    tag?: string;
    tagClass?: string;
};

export type CartItem = BakeryProduct & {
    qty: number;
};

export const products: BakeryProduct[] = [
    {
        id: 1,
        name: 'Sakura Mousse Cake',
        desc: 'Kem tươi · Hoa anh đào · 6 inch',
        price: '185.000đ',
        priceN: 185000,
        emoji: '🌸',
        bg: 'var(--bakery-lav-light)',
        tag: 'Bán chạy',
        tagClass: 'bakery-pill-lav',
    },
    {
        id: 2,
        name: 'Matcha Lavender Roll',
        desc: 'Matcha Uji · Kem lavender · Cuộn',
        price: '145.000đ',
        priceN: 145000,
        emoji: '🍵',
        bg: 'var(--bakery-green-light)',
        tag: 'Mới',
        tagClass: 'bakery-pill-green',
    },
    {
        id: 3,
        name: 'Blueberry Cheesecake',
        desc: 'Cream cheese · Việt quất · No-bake',
        price: '220.000đ',
        priceN: 220000,
        emoji: '🫐',
        bg: 'var(--bakery-teal-light)',
        tag: 'Yêu thích',
        tagClass: 'bakery-pill-teal',
    },
    {
        id: 4,
        name: 'Violet Cupcake ×6',
        desc: 'Lavender · Buttercream · Hộp 6',
        price: '120.000đ',
        priceN: 120000,
        emoji: '💜',
        bg: 'var(--bakery-lav-light)',
        tag: 'Hot',
        tagClass: 'bakery-pill-lav',
    },
    {
        id: 5,
        name: 'Lemon Tart',
        desc: 'Chanh dây · Kem chua · Tart giòn',
        price: '95.000đ',
        priceN: 95000,
        emoji: '🍋',
        bg: '#FEF7DC',
        tag: 'Mới',
        tagClass: 'bakery-pill-green',
    },
    {
        id: 6,
        name: 'Strawberry Mille-feuille',
        desc: 'Dâu Đà Lạt · Custard · Puff pastry',
        price: '165.000đ',
        priceN: 165000,
        emoji: '🍓',
        bg: 'var(--bakery-pink-light)',
        tag: 'Bán chạy',
        tagClass: 'bakery-pill-lav',
    },
    {
        id: 7,
        name: 'Croissant Bơ Pháp',
        desc: 'Bơ President · Giòn · Tươi mỗi sáng',
        price: '65.000đ',
        priceN: 65000,
        emoji: '🥐',
        bg: '#FEF7DC',
    },
    {
        id: 8,
        name: 'Bánh Sinh Nhật 8"',
        desc: 'Tùy chọn vị · In hình · Trang trí',
        price: '450.000đ',
        priceN: 450000,
        emoji: '🎂',
        bg: 'var(--bakery-lav-light)',
        tag: 'Đặt trước',
        tagClass: 'bakery-pill-pink',
    },
];

export const navLinks = [
    { label: 'Thực đơn', href: '/menu' },
    { label: 'Đặt bánh theo yêu cầu', href: '/custom-order' },
    { label: 'Blog', href: '/blog' },
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Liên hệ', href: '/contact' },
];

export const categories = ['Tất cả', 'Mousse cake', 'Cupcake', 'Croissant', 'Sinh nhật', 'Muffin', 'Cheesecake'];

export const blogPosts = [
    {
        emoji: '🌸',
        bg: 'var(--bakery-lav-light)',
        category: 'Công thức',
        title: 'Bí quyết làm mousse hoa anh đào tan chảy trong miệng',
        excerpt: 'Mousse sakura đẹp không chỉ ở màu sắc mà còn ở kết cấu mềm, nhẹ và thơm dịu.',
        meta: 'Fleur Team · 15/05/2025 · 5 phút đọc',
    },
    {
        emoji: '🍵',
        bg: 'var(--bakery-green-light)',
        category: 'Nguyên liệu',
        title: 'Matcha Uji và Matcha thường: khác nhau như thế nào?',
        excerpt: 'Không phải matcha nào cũng như nhau. Hương, màu và hậu vị tạo nên chiếc bánh ngon.',
        meta: 'Chef Linh · 10/05/2025 · 7 phút đọc',
    },
    {
        emoji: '🫐',
        bg: 'var(--bakery-teal-light)',
        category: 'Mẹo làm bánh',
        title: '5 lỗi phổ biến khi làm cheesecake không cần lò nướng',
        excerpt: 'No-bake cheesecake tưởng dễ nhưng lại có nhiều điểm nhỏ cần để ý.',
        meta: 'Fleur Team · 05/05/2025 · 4 phút đọc',
    },
    {
        emoji: '🎂',
        bg: '#FEF7DC',
        category: 'Câu chuyện',
        title: 'Từ căn bếp nhỏ đến 2.000 chiếc bánh mỗi tháng',
        excerpt: 'Fleur bắt đầu từ một chiếc bánh sinh nhật làm cho mẹ và lớn lên từ đó.',
        meta: 'Lan · 01/05/2025 · 8 phút đọc',
    },
    {
        emoji: '💜',
        bg: 'var(--bakery-lav-light)',
        category: 'Công thức',
        title: 'Bánh cuộn lavender cream cho một mùa hè dịu mát',
        excerpt: 'Hương lavender nhẹ kết hợp kem tươi tạo ra chiếc bánh cuộn thanh tao.',
        meta: 'Chef Minh · 28/04/2025 · 6 phút đọc',
    },
    {
        emoji: '🍓',
        bg: 'var(--bakery-pink-light)',
        category: 'Nguyên liệu',
        title: 'Tại sao dâu Đà Lạt làm bánh ngon hơn dâu nhập khẩu?',
        excerpt: 'Độ chua, độ ngọt và hương thơm quyết định chiếc mousse dâu hoàn hảo.',
        meta: 'Fleur Team · 22/04/2025 · 5 phút đọc',
    },
];

export function formatMoney(amount: number): string {
    return `${amount.toLocaleString('vi-VN')}đ`;
}

export function defaultCart(): CartItem[] {
    return [
        { ...products[0], qty: 1 },
        { ...products[1], qty: 1 },
    ];
}
