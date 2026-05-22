import { BakeryProduct } from '@/data/bakery';
import type { CakeProduct } from '@/lib/product-api';

const productBackgrounds = [
    'var(--bakery-lav-light)',
    'var(--bakery-green-light)',
    'var(--bakery-teal-light)',
    '#FEF7DC',
    'var(--bakery-pink-light)',
];

export function mapCakeProductToBakeryProduct(product: CakeProduct): BakeryProduct {
    return {
        id: product.id,
        name: product.name,
        desc: buildProductDescription(product),
        price: product.price_formatted,
        priceN: product.price,
        emoji: getProductEmoji(product),
        bg: productBackgrounds[product.id % productBackgrounds.length],
        categoryId: product.category_id,
        imageUrl: product.image_url,
        stockQuantity: product.stock_quantity,
        soldCount: product.sold_count ?? 0,
        tag: getProductTag(product),
        tagClass: getProductTagClass(product),
    };
}

function buildProductDescription(product: CakeProduct): string {
    const parts = [product.category?.name, product.size_inch ? `${product.size_inch} inch` : null, product.description].filter(Boolean);

    return parts.join(' · ');
}

function getProductTag(product: CakeProduct): string | undefined {
    if (product.stock_quantity === 0) {
        return 'Hết hàng';
    }

    return product.tag ?? undefined;
}

function getProductTagClass(product: CakeProduct): string {
    if (product.stock_quantity === 0) {
        return 'bakery-pill-pink';
    }

    const tag = product.tag?.toLowerCase() ?? '';

    if (tag.includes('mới') || tag.includes('moi')) {
        return 'bakery-pill-green';
    }

    if (tag.includes('yêu') || tag.includes('yeu')) {
        return 'bakery-pill-teal';
    }

    return 'bakery-pill-lav';
}

function getProductEmoji(product: CakeProduct): string {
    const text = `${product.name} ${product.category?.name ?? ''}`.toLowerCase();

    if (text.includes('croissant')) {
        return '🥐';
    }

    if (text.includes('matcha')) {
        return '🍵';
    }

    if (text.includes('cheese') || text.includes('blueberry')) {
        return '🫐';
    }

    if (text.includes('sinh nhật') || text.includes('birthday')) {
        return '🎂';
    }

    if (text.includes('cupcake')) {
        return '💜';
    }

    return '🍰';
}
