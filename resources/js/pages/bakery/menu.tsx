import { Head } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';

import BakeryLayout from '@/components/bakery/bakery-layout';
import ProductCard from '@/components/bakery/product-card';
import { BakeryFooter, Breadcrumbs } from '@/components/bakery/shared';
import { BakeryProduct, products as fallbackProducts } from '@/data/bakery';
import { readAuthUser } from '@/lib/auth-api';
import { listCategories, listPaginatedProducts, type PaginationMeta, type ProductCategory } from '@/lib/product-api';
import { mapCakeProductToBakeryProduct } from '@/lib/product-presenter';
import { listWishlist } from '@/lib/wishlist-api';

type SortMode = 'popular' | 'price_asc' | 'price_desc' | 'newest';

const MENU_PAGE_SIZE = 10;

export default function Menu() {
    const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [products, setProducts] = useState<BakeryProduct[]>([]);
    const [favoriteProductIds, setFavoriteProductIds] = useState<Set<number>>(new Set());
    const [searchKeyword, setSearchKeyword] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('popular');

    const loadMenu = useCallback(async ({ categoryId, keyword, page }: { categoryId: number | 'all'; keyword: string; page: number }) => {
        setIsLoading(true);
        setError('');

        try {
            const [nextCategories, nextProducts] = await Promise.all([
                listCategories(),
                listPaginatedProducts({
                    category_id: categoryId === 'all' ? undefined : categoryId,
                    is_available: 1,
                    keyword: keyword.trim(),
                    page,
                    per_page: MENU_PAGE_SIZE,
                }),
            ]);

            setCategories(nextCategories);
            setPagination(nextProducts.meta);
            setProducts(nextProducts.data.map(mapCakeProductToBakeryProduct));

            const authUser = readAuthUser();

            if (authUser) {
                const wishlistProducts = await listWishlist(authUser.id);
                setFavoriteProductIds(new Set(wishlistProducts.map((product) => product.id)));
            } else {
                setFavoriteProductIds(new Set());
            }
        } catch (error) {
            setPagination(null);
            setProducts(fallbackProducts);
            setError(error instanceof Error ? error.message : 'Không tải được thực đơn từ hệ thống.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadMenu({ categoryId: 'all', keyword: '', page: 1 });
    }, [loadMenu]);

    useEffect(() => {
        if (activeCategoryId === 'all') {
            return;
        }

        const hasCategory = categories.some((category) => category.id === activeCategoryId);

        if (!hasCategory) {
            setActiveCategoryId('all');
            void loadMenu({ categoryId: 'all', keyword: searchKeyword, page: 1 });
        }
    }, [activeCategoryId, categories, loadMenu, searchKeyword]);

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

    const totalProducts = pagination?.total ?? visibleProducts.length;

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        void loadMenu({ categoryId: activeCategoryId, keyword: searchKeyword, page: 1 });
    };

    const handleSelectCategory = (categoryId: number | 'all') => {
        setActiveCategoryId(categoryId);
        void loadMenu({ categoryId, keyword: searchKeyword, page: 1 });
    };

    const handlePageChange = (page: number) => {
        void loadMenu({ categoryId: activeCategoryId, keyword: searchKeyword, page });
    };

    const handleFavoriteChange = (productId: number, isFavorite: boolean) => {
        setFavoriteProductIds((current) => {
            const next = new Set(current);

            if (isFavorite) {
                next.add(productId);
            } else {
                next.delete(productId);
            }

            return next;
        });
    };

    return (
        <BakeryLayout>
            <Head title="Thực đơn" />
            <div className="border-b border-[var(--bakery-border)] bg-[var(--bakery-lav-light)] px-[5%] py-10">
                <Breadcrumbs items={['Thực đơn']} />
                <h1 className="bakery-section-title">
                    Thực đơn <em>đầy đủ</em>
                </h1>
                <p className="mt-2 text-sm text-[var(--bakery-gray)]">
                    {isLoading ? 'Đang tải thực đơn...' : `${totalProducts} loại bánh handmade, làm mới mỗi ngày`}
                </p>
            </div>
            <section className="bakery-section">
                {error && <div className="mb-5 rounded-[14px] border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

                <form className="mb-5 grid gap-3 md:grid-cols-[minmax(0,420px)_200px]" onSubmit={handleSearch}>
                    <label className="relative block">
                        <Search className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--bakery-lav)]" size={18} />
                        <input
                            className="h-11 w-full rounded-full border border-[var(--bakery-border)] bg-white pr-4 pl-11 text-sm text-[var(--bakery-dark)] transition outline-none focus:border-[var(--bakery-lav)]"
                            onChange={(event) => setSearchKeyword(event.target.value)}
                            placeholder="Tìm bánh theo từ khóa"
                            type="search"
                            value={searchKeyword}
                        />
                    </label>
                    <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--bakery-lav)] px-5 text-sm font-semibold text-white transition hover:bg-[#6B6CAA] disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isLoading}
                        type="submit"
                    >
                        <Search size={16} />
                        Tìm kiếm
                    </button>
                </form>

                <div className="mb-7 flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <CategoryButton active={activeCategoryId === 'all'} label="Tất cả" onClick={() => handleSelectCategory('all')} />
                        {categories.map((category) => (
                            <CategoryButton
                                active={activeCategoryId === category.id}
                                key={category.id}
                                label={category.name}
                                onClick={() => handleSelectCategory(category.id)}
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
                            <ProductCard
                                initialIsFavorite={favoriteProductIds.has(product.id)}
                                key={product.id}
                                onFavoriteChange={handleFavoriteChange}
                                product={product}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-[20px] border border-dashed border-[var(--bakery-border)] bg-white p-10 text-center text-sm text-[var(--bakery-gray)]">
                        Chưa có bánh nào phù hợp.
                    </div>
                )}
                <MenuPagination isLoading={isLoading} meta={pagination} onPageChange={handlePageChange} />
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

function MenuPagination({
    isLoading,
    meta,
    onPageChange,
}: {
    isLoading: boolean;
    meta: PaginationMeta | null;
    onPageChange: (page: number) => void;
}) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const pages = Array.from({ length: meta.last_page }, (_, index) => index + 1);

    return (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2 text-sm">
            <button
                className="h-10 rounded-full border border-[var(--bakery-border)] bg-white px-4 font-medium text-[var(--bakery-gray)] transition hover:border-[var(--bakery-lav)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || meta.current_page <= 1}
                onClick={() => onPageChange(meta.current_page - 1)}
                type="button"
            >
                Trước
            </button>
            {pages.map((page) => (
                <button
                    className={`grid h-10 w-10 place-items-center rounded-full border text-sm font-semibold transition ${
                        page === meta.current_page
                            ? 'border-[var(--bakery-lav)] bg-[var(--bakery-lav)] text-white'
                            : 'border-[var(--bakery-border)] bg-white text-[var(--bakery-gray)] hover:border-[var(--bakery-lav)]'
                    }`}
                    disabled={isLoading}
                    key={page}
                    onClick={() => onPageChange(page)}
                    type="button"
                >
                    {page}
                </button>
            ))}
            <button
                className="h-10 rounded-full border border-[var(--bakery-border)] bg-white px-4 font-medium text-[var(--bakery-gray)] transition hover:border-[var(--bakery-lav)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading || meta.current_page >= meta.last_page}
                onClick={() => onPageChange(meta.current_page + 1)}
                type="button"
            >
                Sau
            </button>
        </div>
    );
}
