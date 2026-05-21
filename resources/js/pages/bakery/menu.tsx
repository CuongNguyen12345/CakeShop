import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { BakeryProduct, products as fallbackProducts } from '@/data/bakery';
import { listCategories, listProducts, type CakeProduct, type ProductCategory } from '@/lib/product-api';

type SortMode = 'popular' | 'price_asc' | 'price_desc' | 'newest';

const productBackgrounds = [
    'var(--bakery-lav-light)',
    'var(--bakery-green-light)',
    'var(--bakery-teal-light)',
    '#FEF7DC',
    'var(--bakery-pink-light)',
];

export default function Menu() {
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<BakeryProduct[]>([]);
    const [sortMode, setSortMode] = useState<SortMode>('popular');

    useEffect(() => {
        const loadMenu = async () => {
            setIsLoading(true);
            setError('');

            try {
                const [nextCategories, nextProducts] = await Promise.all([listCategories(), listProducts()]);

                setCategories(nextCategories);
                setProducts(nextProducts.filter((product) => product.is_available).map(mapCakeProductToBakeryProduct));
            } catch (error) {
                setProducts(fallbackProducts);
                setError(error instanceof Error ? error.message : 'Không tải được thực đơn từ hệ thống.');
            } finally {
                setIsLoading(false);
            }
        };

        void loadMenu();
    }, []);

    useEffect(() => {
        if (activeCategoryId === 'all') {
            return;
        }

        const hasCategory = categories.some((category) => category.id === activeCategoryId);

        if (!hasCategory) {
            setActiveCategoryId('all');
        }
    }, [activeCategoryId, categories]);

    const visibleProducts = useMemo(() => {
        const filteredProducts = activeCategoryId === 'all' ? products : products.filter((product) => product.categoryId === activeCategoryId);

        return [...filteredProducts].sort((firstProduct, secondProduct) => {
            if (sortMode === 'price_asc') {
                return firstProduct.priceN - secondProduct.priceN;
            }

            if (sortMode === 'price_desc') {
                return secondProduct.priceN - firstProduct.priceN;
            }

            if (sortMode === 'newest') {
                return secondProduct.id - firstProduct.id;
            }

            return Number(Boolean(secondProduct.tag)) - Number(Boolean(firstProduct.tag));
        });
    }, [activeCategoryId, products, sortMode]);

    return (
        <BakeryLayout>
            <Head title="Thực đơn" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10">
                <Breadcrumbs items={['Thực đơn']} />
                <h1 className="bakery-section-title">
                    Thực đơn <em>đầy đủ</em>
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">
                    {isLoading ? 'Đang tải thực đơn...' : `${visibleProducts.length} loại bánh handmade, làm mới mỗi ngày`}
                </p>
            </div>
            <section className="bakery-section">
                {error && <div className="mb-5 rounded-[14px] border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                <div className="mb-7 flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <CategoryButton active={activeCategoryId === 'all'} label="Tất cả" onClick={() => setActiveCategoryId('all')} />
                        {categories.map((category) => (
                            <CategoryButton
                                active={activeCategoryId === category.id}
                                key={category.id}
                                label={category.name}
                                onClick={() => setActiveCategoryId(category.id)}
                            />
                        ))}
                    </div>
                    <select
                        className="ml-auto rounded-full border border-[var(--bakery-border)] bg-white px-4 py-2 text-[13px]"
                        onChange={(event) => setSortMode(event.target.value as SortMode)}
                        value={sortMode}
                    >
                        <option value="popular">Sắp xếp: Phổ biến</option>
                        <option value="price_asc">Giá tăng dần</option>
                        <option value="price_desc">Giá giảm dần</option>
                        <option value="newest">Mới nhất</option>
                    </select>
                </div>

                {isLoading ? (
                    <div className="bakery-product-grid">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div className="h-[340px] animate-pulse rounded-[20px] bg-[var(--bakery-gray-light)]" key={index} />
                        ))}
                    </div>
                ) : visibleProducts.length > 0 ? (
                    <div className="bakery-product-grid">
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[20px] border border-dashed border-[var(--bakery-border)] bg-white p-10 text-center text-sm text-[var(--bakery-gray)]">
                        Chưa có bánh nào trong danh mục này.
                    </div>
                )}
            </section>
            <BakeryFooter />
        </BakeryLayout>
    );
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            className={`rounded-full border border-[var(--bakery-border)] px-4 py-2 text-[13px] font-medium ${
                active ? 'bg-[var(--bakery-lav)] text-white' : 'bg-white text-[var(--bakery-gray)]'
            }`}
            onClick={onClick}
            type="button"
        >
            {label}
        </button>
    );
}

function mapCakeProductToBakeryProduct(product: CakeProduct): BakeryProduct {
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
