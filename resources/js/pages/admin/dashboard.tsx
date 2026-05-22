import { Head, Link, router } from '@inertiajs/react';
import { CategoryScale, Chart as ChartJS, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip, type TooltipItem } from 'chart.js';
import {
    ArrowLeft,
    BarChart3,
    CakeSlice,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Eye,
    EyeOff,
    FileText,
    Home,
    LogOut,
    MapPin,
    Package,
    PackagePlus,
    Pencil,
    Percent,
    Phone,
    Plus,
    Search,
    ShoppingBag,
    Tags,
    Trash2,
    TrendingUp,
    Truck,
    User,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';

import { forgetAuthUser, isAdminUser, readAuthUser } from '@/lib/auth-api';
import { listCustomCakes, updateCustomCake, type CustomCakeRequest, type CustomCakeStatusMap } from '@/lib/custom-cake-api';
import { listOrders, updateOrderStatus, type AdminOrder, type OrderListFilters, type OrderStatusMap } from '@/lib/order-api';
import {
    createCategory,
    createProduct,
    deleteCategory,
    deleteProduct,
    listCategories,
    listPaginatedProducts,
    listProducts,
    updateProduct,
    type CakeProduct,
    type PaginationMeta,
    type ProductCategory,
    type ProductListFilters,
} from '@/lib/product-api';
import { listRevenueStats, type RevenuePeriod, type RevenueStats } from '@/lib/revenue-api';
import { createVoucher, deleteVoucher, listVouchers, updateVoucher, type Voucher } from '@/lib/voucher-api';

type AdminTab = 'overview' | 'products' | 'vouchers' | 'orders' | 'custom' | 'revenue';

const PRODUCT_PAGE_SIZE = 8;
const ORDER_PAGE_SIZE = 5;

ChartJS.register(CategoryScale, LinearScale, LineController, PointElement, LineElement, Filler, Tooltip);

const tabs: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <Home size={18} /> },
    { id: 'products', label: 'Quản lý sản phẩm', icon: <CakeSlice size={18} /> },
    { id: 'vouchers', label: 'Quản lý voucher', icon: <Percent size={18} /> },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: <ClipboardList size={18} /> },
    { id: 'custom', label: 'Bánh đặt riêng', icon: <FileText size={18} /> },
    { id: 'revenue', label: 'Thống kê doanh thu', icon: <TrendingUp size={18} /> },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [period, setPeriod] = useState<RevenuePeriod>('day');
    const [productError, setProductError] = useState('');
    const [productMessage, setProductMessage] = useState('');
    const [productPagination, setProductPagination] = useState<PaginationMeta | null>(null);
    const [products, setProducts] = useState<CakeProduct[]>([]);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
    const [voucherError, setVoucherError] = useState('');
    const [voucherMessage, setVoucherMessage] = useState('');
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [overviewProducts, setOverviewProducts] = useState<CakeProduct[]>([]);
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [orderPagination, setOrderPagination] = useState<PaginationMeta | null>(null);
    const [orderStatuses, setOrderStatuses] = useState<OrderStatusMap>({});
    const [orderStatusCounts, setOrderStatusCounts] = useState<Record<string, number>>({});
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [orderMessage, setOrderMessage] = useState('');
    const [customCakes, setCustomCakes] = useState<CustomCakeRequest[]>([]);
    const [customCakeStatuses, setCustomCakeStatuses] = useState<CustomCakeStatusMap>({});
    const [isLoadingCustomCakes, setIsLoadingCustomCakes] = useState(false);
    const [customCakeError, setCustomCakeError] = useState('');
    const [customCakeMessage, setCustomCakeMessage] = useState('');
    const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
    const [isLoadingRevenue, setIsLoadingRevenue] = useState(false);
    const [revenueError, setRevenueError] = useState('');

    useEffect(() => {
        const authUser = readAuthUser();

        if (!authUser) {
            router.visit('/auth', { replace: true });

            return;
        }

        if (!isAdminUser(authUser)) {
            router.visit('/', { replace: true });

            return;
        }

        setHasCheckedAuth(true);
    }, []);

    const refreshProductManagement = useCallback(async (filters: ProductListFilters = { page: 1, per_page: PRODUCT_PAGE_SIZE }) => {
        setIsLoadingProducts(true);
        setProductError('');

        try {
            const nextFilters = {
                ...filters,
                page: filters.page ?? 1,
                per_page: filters.per_page ?? PRODUCT_PAGE_SIZE,
            };
            const [nextCategories, nextProducts, nextOverviewProducts] = await Promise.all([
                listCategories(),
                listPaginatedProducts(nextFilters),
                listProducts(),
            ]);

            setCategories(nextCategories);
            setOverviewProducts(nextOverviewProducts);
            setProductPagination(nextProducts.meta);
            setProducts(nextProducts.data);
        } catch (error) {
            setProductError(error instanceof Error ? error.message : 'Không tải được dữ liệu sản phẩm.');
        } finally {
            setIsLoadingProducts(false);
        }
    }, []);

    const refreshVouchers = async () => {
        setIsLoadingVouchers(true);
        setVoucherError('');

        try {
            setVouchers(await listVouchers());
        } catch (error) {
            setVoucherError(error instanceof Error ? error.message : 'Không tải được dữ liệu voucher.');
        } finally {
            setIsLoadingVouchers(false);
        }
    };

    const refreshOrders = useCallback(async (filters: OrderListFilters = { page: 1, per_page: ORDER_PAGE_SIZE }) => {
        setIsLoadingOrders(true);
        setOrderError('');

        try {
            const response = await listOrders({
                ...filters,
                page: filters.page ?? 1,
                per_page: filters.per_page ?? ORDER_PAGE_SIZE,
            });

            setOrders(response.data);
            setOrderPagination(response.meta);
            setOrderStatuses(response.statuses);
            setOrderStatusCounts(response.status_counts);
        } catch (error) {
            setOrderError(error instanceof Error ? error.message : 'Không tải được dữ liệu đơn hàng.');
        } finally {
            setIsLoadingOrders(false);
        }
    }, []);

    const refreshCustomCakes = useCallback(async () => {
        setIsLoadingCustomCakes(true);
        setCustomCakeError('');

        try {
            const response = await listCustomCakes();

            setCustomCakes(response.data);
            setCustomCakeStatuses(response.statuses);
        } catch (error) {
            setCustomCakeError(error instanceof Error ? error.message : 'Không tải được yêu cầu bánh riêng.');
        } finally {
            setIsLoadingCustomCakes(false);
        }
    }, []);

    const refreshRevenueStats = useCallback(async (nextPeriod: string) => {
        setIsLoadingRevenue(true);
        setRevenueError('');

        try {
            setRevenueStats(await listRevenueStats(periodToApiPeriod(nextPeriod)));
        } catch (error) {
            setRevenueError(error instanceof Error ? error.message : 'Không tải được thống kê doanh thu.');
        } finally {
            setIsLoadingRevenue(false);
        }
    }, []);

    useEffect(() => {
        if (!hasCheckedAuth) {
            return;
        }

        void refreshProductManagement();
        void refreshVouchers();
        void refreshOrders();
        void refreshCustomCakes();
    }, [hasCheckedAuth, refreshCustomCakes, refreshOrders, refreshProductManagement]);

    useEffect(() => {
        if (!hasCheckedAuth) {
            return;
        }

        void refreshRevenueStats(period);
    }, [hasCheckedAuth, period, refreshRevenueStats]);

    if (!hasCheckedAuth) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                <Head title="Admin Dashboard" />
                Đang kiểm tra quyền quản trị...
            </div>
        );
    }

    const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? 'Tổng quan';
    const handleLogout = () => {
        forgetAuthUser();
        router.visit('/auth', { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Head title="Admin Dashboard" />
            <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
                <aside className="border-r border-slate-200 bg-white px-5 py-6">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-600 text-white">
                            <CakeSlice size={22} />
                        </div>
                        <div>
                            <div className="text-lg font-semibold">CakeShop Admin</div>
                            <div className="text-xs text-slate-500">Quản trị cửa hàng bánh</div>
                        </div>
                    </div>
                    <nav className="grid gap-2 text-sm">
                        {tabs.map((tab) => (
                            <AdminNavItem
                                active={activeTab === tab.id}
                                icon={tab.icon}
                                key={tab.id}
                                label={tab.label}
                                onClick={() => setActiveTab(tab.id)}
                            />
                        ))}
                    </nav>
                </aside>

                <main className="min-w-0">
                    <header className="border-b border-slate-200 bg-white px-6 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold">{activeTabLabel}</h1>
                                <p className="text-sm text-slate-500">Theo dõi sản phẩm, đơn hàng và doanh thu của tiệm bánh.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
                                    <Search size={16} />
                                    Tìm sản phẩm, đơn hàng...
                                </div>
                                <Link
                                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                    href="/"
                                >
                                    <Home size={17} />
                                    Trang user
                                </Link>
                                <button
                                    className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-rose-200 bg-white px-5 py-2.5 text-sm font-medium text-rose-700 shadow-sm hover:bg-rose-50"
                                    onClick={handleLogout}
                                    type="button"
                                >
                                    <LogOut size={17} />
                                    Đăng xuất
                                </button>
                                <button
                                    className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                                    onClick={() => setActiveTab('products')}
                                    type="button"
                                >
                                    <PackagePlus size={17} />
                                    Thêm bánh mới
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid gap-6 p-6">
                        {activeTab === 'overview' && (
                            <OverviewTab
                                categories={categories}
                                orders={orders}
                                period={period}
                                products={overviewProducts}
                                revenueStats={revenueStats}
                                setActiveTab={setActiveTab}
                                setPeriod={setPeriod}
                            />
                        )}
                        {activeTab === 'products' && (
                            <ProductsTab
                                categories={categories}
                                error={productError}
                                isLoading={isLoadingProducts}
                                message={productMessage}
                                pagination={productPagination}
                                products={products}
                                refreshProductManagement={refreshProductManagement}
                                setMessage={setProductMessage}
                            />
                        )}
                        {activeTab === 'vouchers' && (
                            <VouchersTab
                                error={voucherError}
                                isLoading={isLoadingVouchers}
                                message={voucherMessage}
                                refreshVouchers={refreshVouchers}
                                setMessage={setVoucherMessage}
                                vouchers={vouchers}
                            />
                        )}
                        {activeTab === 'orders' && (
                            <OrdersTab
                                error={orderError}
                                isLoading={isLoadingOrders}
                                message={orderMessage}
                                orders={orders}
                                pagination={orderPagination}
                                refreshOrders={refreshOrders}
                                setMessage={setOrderMessage}
                                statusCounts={orderStatusCounts}
                                statuses={orderStatuses}
                            />
                        )}
                        {activeTab === 'custom' && (
                            <CustomCakesTab
                                customCakes={customCakes}
                                error={customCakeError}
                                isLoading={isLoadingCustomCakes}
                                message={customCakeMessage}
                                refreshCustomCakes={refreshCustomCakes}
                                setMessage={setCustomCakeMessage}
                                statuses={customCakeStatuses}
                            />
                        )}
                        {activeTab === 'revenue' && (
                            <RevenueTab
                                error={revenueError}
                                isLoading={isLoadingRevenue}
                                period={period}
                                setPeriod={setPeriod}
                                stats={revenueStats}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function OverviewTab({
    categories,
    orders,
    period,
    products,
    revenueStats,
    setActiveTab,
    setPeriod,
}: {
    categories: ProductCategory[];
    orders: AdminOrder[];
    period: RevenuePeriod;
    products: CakeProduct[];
    revenueStats: RevenueStats | null;
    setActiveTab: (tab: AdminTab) => void;
    setPeriod: (period: RevenuePeriod) => void;
}) {
    const activeProducts = products.filter((product) => product.is_available);
    const hiddenProducts = products.filter((product) => !product.is_available);
    const shippingOrders = orders.filter((order) => order.order_status === 'shipping').length;

    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={<Package size={20} />}
                    label="Sản phẩm đang bán"
                    value={`${activeProducts.length}`}
                    note={`${categories.length} danh mục`}
                />
                <MetricCard
                    icon={<ShoppingBag size={20} />}
                    label="Đơn hàng hôm nay"
                    value={`${orders.length}`}
                    note={`${shippingOrders} đơn đang giao`}
                />
                <MetricCard
                    icon={<BarChart3 size={20} />}
                    label="Doanh thu kỳ này"
                    value={revenueStats ? formatCompactCurrency(revenueStats.summary.total_revenue) : '0đ'}
                    note={revenueStats ? formatChangeNote(revenueStats.summary.revenue_change_percent) : 'Đang cập nhật'}
                />
                <MetricCard icon={<CakeSlice size={20} />} label="Đang ẩn" value={`${hiddenProducts.length}`} note="Có thể mở bán lại" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
                <Panel
                    actionLabel="Mở quản lý"
                    onAction={() => setActiveTab('products')}
                    title="Sản phẩm nổi bật"
                    subtitle="Xem nhanh tồn kho và trạng thái bán của các mẫu bánh chính."
                >
                    <ProductTable categories={categories} compact products={products} />
                </Panel>

                <Panel
                    actionLabel="Xem thống kê"
                    onAction={() => setActiveTab('revenue')}
                    title="Doanh thu nhanh"
                    subtitle="Biểu đồ bán hàng trong tuần và sản phẩm bán chạy."
                >
                    <RevenueChart period={period} setPeriod={setPeriod} stats={revenueStats} />
                </Panel>
            </section>

            <Panel
                actionLabel="Mở đơn hàng"
                onAction={() => setActiveTab('orders')}
                title="Đơn hàng mới"
                subtitle="Theo dõi các đơn cần xác nhận, đang làm bánh và đang giao."
            >
                <OrderList compact orders={orders} />
            </Panel>
        </>
    );
}

function ProductsTab({
    categories,
    error,
    isLoading,
    message,
    pagination,
    products,
    refreshProductManagement,
    setMessage,
}: {
    categories: ProductCategory[];
    error: string;
    isLoading: boolean;
    message: string;
    pagination: PaginationMeta | null;
    products: CakeProduct[];
    refreshProductManagement: (filters?: ProductListFilters) => Promise<void>;
    setMessage: (message: string) => void;
}) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [productForm, setProductForm] = useState({
        category_id: '',
        name: '',
        description: '',
        price: '',
        image_url: '',
        size_inch: '6',
        stock_quantity: '0',
        tag: '',
        is_available: true,
    });
    const [filters, setFilters] = useState({
        keyword: '',
        category_id: 'all' as number | 'all',
        min_price: '',
        max_price: '',
    });
    const selectedCategoryId = filters.category_id;
    const activeProducts = products.filter((product) => product.is_available);
    const hiddenProducts = products.filter((product) => !product.is_available);
    const currentPage = pagination?.current_page ?? 1;

    useEffect(() => {
        if (categories.length > 0 && !productForm.category_id) {
            setProductForm((currentForm) => ({
                ...currentForm,
                category_id: String(categories[0].id),
            }));
        }
    }, [categories, productForm.category_id]);

    const countProductsByCategory = (category: ProductCategory) =>
        typeof category.products_count === 'number'
            ? category.products_count
            : products.filter((product) => product.category_id === category.id).length;

    const buildProductListFilters = (nextFilters = filters, page = 1): ProductListFilters => ({
        keyword: nextFilters.keyword.trim(),
        category_id: nextFilters.category_id === 'all' ? undefined : nextFilters.category_id,
        min_price: nextFilters.min_price,
        max_price: nextFilters.max_price,
        page,
        per_page: PRODUCT_PAGE_SIZE,
    });

    const handleApplyFilters = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await refreshProductManagement(buildProductListFilters(filters, 1));
    };

    const handleResetFilters = async () => {
        const nextFilters = {
            keyword: '',
            category_id: 'all' as number | 'all',
            min_price: '',
            max_price: '',
        };

        setFilters(nextFilters);
        await refreshProductManagement(buildProductListFilters(nextFilters, 1));
    };

    const handleSelectCategory = async (categoryId: number | 'all') => {
        const nextFilters = {
            ...filters,
            category_id: categoryId,
        };

        setFilters(nextFilters);
        await refreshProductManagement(buildProductListFilters(nextFilters, 1));
    };

    const handlePageChange = async (page: number) => {
        await refreshProductManagement(buildProductListFilters(filters, page));
    };

    const resetProductForm = () => {
        setEditingProductId(null);
        setProductForm((currentForm) => ({
            ...currentForm,
            category_id: categories[0] ? String(categories[0].id) : '',
            name: '',
            description: '',
            price: '',
            image_url: '',
            size_inch: '6',
            stock_quantity: '0',
            tag: '',
            is_available: true,
        }));
    };

    const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = newCategoryName.trim();

        if (!trimmedName) {
            return;
        }

        setMessage('');

        try {
            await createCategory({ name: trimmedName });
            await refreshProductManagement(buildProductListFilters(filters, currentPage));
            setNewCategoryName('');
            setMessage('Đã tạo danh mục mới.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không tạo được danh mục.');
        }
    };

    const handleSubmitProduct = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('');

        try {
            const payload = {
                category_id: Number(productForm.category_id),
                name: productForm.name.trim(),
                description: productForm.description.trim(),
                price: Number(productForm.price),
                image_url: productForm.image_url.trim(),
                size_inch: Number(productForm.size_inch || 6),
                stock_quantity: Number(productForm.stock_quantity || 0),
                tag: productForm.tag.trim(),
                is_available: productForm.is_available,
            };

            if (editingProductId) {
                await updateProduct(editingProductId, payload);
            } else {
                await createProduct(payload);
            }

            await refreshProductManagement(buildProductListFilters(filters, editingProductId ? currentPage : 1));
            resetProductForm();
            setMessage(editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm bánh mới.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không lưu được sản phẩm.');
        }
    };

    const handleEditProduct = (product: CakeProduct) => {
        setEditingProductId(product.id);
        setMessage('');
        setProductForm({
            category_id: String(product.category_id),
            name: product.name,
            description: product.description ?? '',
            price: String(product.price),
            image_url: product.image_url ?? '',
            size_inch: String(product.size_inch ?? 6),
            stock_quantity: String(product.stock_quantity ?? 0),
            tag: product.tag ?? '',
            is_available: product.is_available,
        });
    };

    const handleDeleteCategory = async (category: ProductCategory) => {
        const relatedProductCount = countProductsByCategory(category);
        const confirmed = window.confirm(
            `Xóa danh mục "${category.name}" sẽ xóa luôn ${relatedProductCount} bánh liên quan. Bạn có chắc muốn xóa không?`,
        );

        if (!confirmed) {
            return;
        }

        setMessage('');

        try {
            await deleteCategory(category.id);
            const nextFilters = selectedCategoryId === category.id ? { ...filters, category_id: 'all' as number | 'all' } : filters;

            setFilters(nextFilters);
            await refreshProductManagement(buildProductListFilters(nextFilters, 1));

            setMessage('Đã xóa danh mục và các bánh liên quan.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không xóa được danh mục.');
        }
    };

    const handleDeleteProduct = async (product: CakeProduct) => {
        if (!window.confirm(`Xóa bánh "${product.name}" khỏi danh sách?`)) {
            return;
        }

        setMessage('');

        try {
            await deleteProduct(product.id);
            await refreshProductManagement(buildProductListFilters(filters, currentPage));
            setMessage('Đã xóa sản phẩm.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không xóa được sản phẩm.');
        }
    };

    const handleToggleProduct = async (product: CakeProduct) => {
        setMessage('');

        try {
            await updateProduct(product.id, {
                category_id: product.category_id,
                name: product.name,
                description: product.description ?? '',
                price: product.price,
                image_url: product.image_url ?? '',
                size_inch: product.size_inch ?? 6,
                stock_quantity: product.stock_quantity,
                tag: product.tag ?? '',
                is_available: !product.is_available,
            });
            await refreshProductManagement(buildProductListFilters(filters, currentPage));
            setMessage(product.is_available ? 'Đã ẩn sản phẩm.' : 'Đã mở bán sản phẩm.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không cập nhật được sản phẩm.');
        }
    };

    const handleUpdateStockQuantity = async (product: CakeProduct, stockQuantity: number) => {
        setMessage('');

        try {
            await updateProduct(product.id, {
                category_id: product.category_id,
                name: product.name,
                description: product.description ?? '',
                price: product.price,
                image_url: product.image_url ?? '',
                size_inch: product.size_inch ?? 6,
                stock_quantity: stockQuantity,
                tag: product.tag ?? '',
                is_available: product.is_available,
            });
            await refreshProductManagement(buildProductListFilters(filters, currentPage));
            setMessage('Đã cập nhật số lượng bánh.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không cập nhật được số lượng bánh.');
        }
    };

    return (
        <>
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    icon={<CakeSlice size={20} />}
                    label="Tổng sản phẩm"
                    value={`${pagination?.total ?? products.length}`}
                    note={`${activeProducts.length} sản phẩm đang bán trên trang này`}
                />
                <MetricCard icon={<Tags size={20} />} label="Danh mục bánh" value={`${categories.length}`} note="Có thể tạo thêm loại bánh" />
                <MetricCard icon={<EyeOff size={20} />} label="Đang ẩn" value={`${hiddenProducts.length}`} note="Có thể mở bán lại" />
            </section>

            {(message || error) && (
                <div
                    className={`rounded-xl border p-4 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                >
                    {error || message}
                </div>
            )}

            <Panel
                title="Quản lý danh mục"
                subtitle="Tạo danh mục cho từng loại bánh. Khi xóa danh mục, toàn bộ bánh thuộc danh mục đó cũng bị xóa khỏi danh sách."
            >
                <form className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleCreateCategory}>
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder="Nhập tên danh mục mới, ví dụ: Tiramisu"
                        type="text"
                        value={newCategoryName}
                    />
                    <button
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                        type="submit"
                    >
                        <Plus size={17} />
                        Tạo danh mục
                    </button>
                </form>

                <div className="mb-5 flex flex-wrap gap-2">
                    <CategoryPill active={selectedCategoryId === 'all'} label="Tất cả" onClick={() => void handleSelectCategory('all')} />
                    {categories.map((category) => (
                        <CategoryPill
                            active={selectedCategoryId === category.id}
                            count={countProductsByCategory(category)}
                            key={category.id}
                            label={category.name}
                            onClick={() => void handleSelectCategory(category.id)}
                        />
                    ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" key={category.id}>
                            <div>
                                <div className="font-semibold text-slate-900">{category.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{countProductsByCategory(category)} bánh liên quan</div>
                            </div>
                            <button
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                onClick={() => handleDeleteCategory(category)}
                                type="button"
                            >
                                <Trash2 size={14} />
                                Xóa
                            </button>
                        </div>
                    ))}
                </div>
            </Panel>

            <Panel
                title="Quản lý sản phẩm"
                subtitle={
                    editingProductId
                        ? 'Đang sửa sản phẩm. Cập nhật thông tin rồi bấm lưu.'
                        : 'Thêm bánh mới, chọn danh mục, nhập giá, cỡ bánh, tag và trạng thái mở bán.'
                }
            >
                <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-4" onSubmit={handleSubmitProduct}>
                    <select
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
                        disabled={categories.length === 0}
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, category_id: event.target.value }))}
                        value={productForm.category_id}
                    >
                        {categories.length === 0 && <option value="">Chưa có danh mục</option>}
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                        placeholder="Tên bánh"
                        type="text"
                        value={productForm.name}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        min="0"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, price: event.target.value }))}
                        placeholder="Giá"
                        type="number"
                        value={productForm.price}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        min="1"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, size_inch: event.target.value }))}
                        placeholder="Cỡ inch"
                        type="number"
                        value={productForm.size_inch}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        min="0"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, stock_quantity: event.target.value }))}
                        placeholder="Số lượng"
                        type="number"
                        value={productForm.stock_quantity}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, tag: event.target.value }))}
                        placeholder="Tag"
                        type="text"
                        value={productForm.tag}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 lg:col-span-2"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, image_url: event.target.value }))}
                        placeholder="Link ảnh"
                        type="url"
                        value={productForm.image_url}
                    />
                    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
                        <input
                            checked={productForm.is_available}
                            className="h-4 w-4 accent-emerald-600"
                            onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, is_available: event.target.checked }))}
                            type="checkbox"
                        />
                        Đang bán
                    </label>
                    <textarea
                        className="min-h-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 lg:col-span-3"
                        onChange={(event) => setProductForm((currentForm) => ({ ...currentForm, description: event.target.value }))}
                        placeholder="Mô tả bánh"
                        value={productForm.description}
                    />
                    <div className="flex gap-2">
                        <button
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            disabled={isLoading || categories.length === 0}
                            type="submit"
                        >
                            {editingProductId ? <Pencil size={17} /> : <PackagePlus size={17} />}
                            {editingProductId ? 'Cập nhật' : 'Thêm bánh'}
                        </button>
                        {editingProductId && (
                            <button
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                onClick={resetProductForm}
                                type="button"
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </form>
                <form
                    className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto]"
                    onSubmit={handleApplyFilters}
                >
                    <label className="relative block">
                        <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="min-h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pr-3 pl-10 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                            onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, keyword: event.target.value }))}
                            placeholder="Từ khóa sản phẩm"
                            type="search"
                            value={filters.keyword}
                        />
                    </label>
                    <select
                        className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white"
                        onChange={(event) =>
                            setFilters((currentFilters) => ({
                                ...currentFilters,
                                category_id: event.target.value === 'all' ? 'all' : Number(event.target.value),
                            }))
                        }
                        value={filters.category_id}
                    >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                        min="0"
                        onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, min_price: event.target.value }))}
                        placeholder="Giá từ"
                        type="number"
                        value={filters.min_price}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white"
                        min="0"
                        onChange={(event) => setFilters((currentFilters) => ({ ...currentFilters, max_price: event.target.value }))}
                        placeholder="Giá đến"
                        type="number"
                        value={filters.max_price}
                    />
                    <div className="flex gap-2">
                        <button
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            disabled={isLoading}
                            type="submit"
                        >
                            <Search size={16} />
                            Lọc
                        </button>
                        <button
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            disabled={isLoading}
                            onClick={() => void handleResetFilters()}
                            type="button"
                        >
                            Xóa
                        </button>
                    </div>
                </form>
                <ProductTable
                    categories={categories}
                    onDelete={handleDeleteProduct}
                    onEdit={handleEditProduct}
                    onToggleAvailability={handleToggleProduct}
                    onUpdateStockQuantity={handleUpdateStockQuantity}
                    products={products}
                />
                <PaginationControls isLoading={isLoading} meta={pagination} onPageChange={handlePageChange} />
            </Panel>
        </>
    );
}

function PaginationControls({
    itemLabel = 'sản phẩm',
    isLoading,
    meta,
    onPageChange,
}: {
    itemLabel?: string;
    isLoading: boolean;
    meta: PaginationMeta | null;
    onPageChange: (page: number) => Promise<void>;
}) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const pages = Array.from({ length: meta.last_page }, (_, index) => index + 1);

    return (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
            <div className="text-slate-500">
                Hiển thị {meta.from ?? 0}-{meta.to ?? 0} trong {meta.total} {itemLabel}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button
                    className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || meta.current_page <= 1}
                    onClick={() => void onPageChange(meta.current_page - 1)}
                    type="button"
                >
                    Trước
                </button>
                {pages.map((page) => (
                    <button
                        className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-medium ${
                            page === meta.current_page
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                        disabled={isLoading}
                        key={page}
                        onClick={() => void onPageChange(page)}
                        type="button"
                    >
                        {page}
                    </button>
                ))}
                <button
                    className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading || meta.current_page >= meta.last_page}
                    onClick={() => void onPageChange(meta.current_page + 1)}
                    type="button"
                >
                    Sau
                </button>
            </div>
        </div>
    );
}

function VouchersTab({
    error,
    isLoading,
    message,
    refreshVouchers,
    setMessage,
    vouchers,
}: {
    error: string;
    isLoading: boolean;
    message: string;
    refreshVouchers: () => Promise<void>;
    setMessage: (message: string) => void;
    vouchers: Voucher[];
}) {
    const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
    const [voucherForm, setVoucherForm] = useState({
        code: '',
        discount_percent: '10',
        usage_limit: '20',
        is_active: true,
    });
    const activeVouchers = vouchers.filter((voucher) => voucher.is_active && voucher.remaining_uses > 0);
    const depletedVouchers = vouchers.filter((voucher) => voucher.remaining_uses === 0);

    const resetVoucherForm = () => {
        setEditingVoucherId(null);
        setVoucherForm({
            code: '',
            discount_percent: '10',
            usage_limit: '20',
            is_active: true,
        });
    };

    const handleSubmitVoucher = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage('');

        const payload = {
            code: voucherForm.code.trim(),
            discount_percent: Number(voucherForm.discount_percent),
            usage_limit: Number(voucherForm.usage_limit),
            is_active: voucherForm.is_active,
        };

        try {
            if (editingVoucherId) {
                await updateVoucher(editingVoucherId, payload);
            } else {
                await createVoucher(payload);
            }

            await refreshVouchers();
            resetVoucherForm();
            setMessage(editingVoucherId ? 'Đã cập nhật voucher.' : 'Đã tạo voucher mới.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không lưu được voucher.');
        }
    };

    const handleEditVoucher = (voucher: Voucher) => {
        setEditingVoucherId(voucher.id);
        setMessage('');
        setVoucherForm({
            code: voucher.code,
            discount_percent: String(voucher.discount_percent),
            usage_limit: String(voucher.usage_limit),
            is_active: voucher.is_active,
        });
    };

    const handleToggleVoucher = async (voucher: Voucher) => {
        setMessage('');

        try {
            await updateVoucher(voucher.id, {
                code: voucher.code,
                discount_percent: voucher.discount_percent,
                usage_limit: voucher.usage_limit,
                used_count: voucher.used_count,
                is_active: !voucher.is_active,
            });
            await refreshVouchers();
            setMessage(voucher.is_active ? 'Đã tắt voucher.' : 'Đã bật voucher.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không cập nhật được voucher.');
        }
    };

    const handleDeleteVoucher = async (voucher: Voucher) => {
        if (!window.confirm(`Xóa voucher "${voucher.code}" khỏi danh sách?`)) {
            return;
        }

        setMessage('');

        try {
            await deleteVoucher(voucher.id);
            await refreshVouchers();
            setMessage('Đã xóa voucher.');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không xóa được voucher.');
        }
    };

    return (
        <>
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={<Percent size={20} />} label="Tổng voucher" value={`${vouchers.length}`} note="Có thể dùng cho giỏ hàng" />
                <MetricCard icon={<CheckCircle2 size={20} />} label="Đang hoạt động" value={`${activeVouchers.length}`} note="Còn lượt sử dụng" />
                <MetricCard icon={<EyeOff size={20} />} label="Hết lượt" value={`${depletedVouchers.length}`} note="Cần tăng số lần dùng" />
            </section>

            {(message || error) && (
                <div
                    className={`rounded-xl border p-4 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                >
                    {error || message}
                </div>
            )}

            <Panel
                title="Quản lý voucher"
                subtitle="Tạo mã giảm giá theo phần trăm và giới hạn số lần sử dụng. Mã còn hoạt động sẽ áp dụng được trong giỏ hàng."
            >
                <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-4" onSubmit={handleSubmitVoucher}>
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold uppercase outline-none focus:border-emerald-400"
                        onChange={(event) => setVoucherForm((currentForm) => ({ ...currentForm, code: event.target.value }))}
                        placeholder="Mã voucher, ví dụ: CAKE10"
                        type="text"
                        value={voucherForm.code}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        max="100"
                        min="1"
                        onChange={(event) => setVoucherForm((currentForm) => ({ ...currentForm, discount_percent: event.target.value }))}
                        placeholder="% giảm"
                        type="number"
                        value={voucherForm.discount_percent}
                    />
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        min="1"
                        onChange={(event) => setVoucherForm((currentForm) => ({ ...currentForm, usage_limit: event.target.value }))}
                        placeholder="Số lần sử dụng"
                        type="number"
                        value={voucherForm.usage_limit}
                    />
                    <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
                        <input
                            checked={voucherForm.is_active}
                            className="h-4 w-4 accent-emerald-600"
                            onChange={(event) => setVoucherForm((currentForm) => ({ ...currentForm, is_active: event.target.checked }))}
                            type="checkbox"
                        />
                        Đang bật
                    </label>
                    <div className="flex gap-2 lg:col-span-4">
                        <button
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            disabled={isLoading}
                            type="submit"
                        >
                            {editingVoucherId ? <Pencil size={17} /> : <Plus size={17} />}
                            {editingVoucherId ? 'Cập nhật voucher' : 'Tạo voucher'}
                        </button>
                        {editingVoucherId && (
                            <button
                                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                onClick={resetVoucherForm}
                                type="button"
                            >
                                Hủy
                            </button>
                        )}
                    </div>
                </form>

                <VoucherTable onDelete={handleDeleteVoucher} onEdit={handleEditVoucher} onToggle={handleToggleVoucher} vouchers={vouchers} />
            </Panel>
        </>
    );
}

function CustomCakesTab({
    customCakes,
    error,
    isLoading,
    message,
    refreshCustomCakes,
    setMessage,
    statuses,
}: {
    customCakes: CustomCakeRequest[];
    error: string;
    isLoading: boolean;
    message: string;
    refreshCustomCakes: () => Promise<void>;
    setMessage: (message: string) => void;
    statuses: CustomCakeStatusMap;
}) {
    const [activeStatus, setActiveStatus] = useState('all');
    const [drafts, setDrafts] = useState<Record<number, { admin_note: string; estimated_price: string; status: string }>>({});
    const statusCounts = customCakes.reduce<Record<string, number>>((counts, customCake) => {
        counts[customCake.status] = (counts[customCake.status] ?? 0) + 1;

        return counts;
    }, {});
    const selectableCustomCakeStatusEntries = Object.entries(statuses).filter(
        ([status]) => !['need_more_info', 'converted_to_order'].includes(status),
    );
    const filteredCustomCakes = activeStatus === 'all' ? customCakes : customCakes.filter((customCake) => customCake.status === activeStatus);
    const pendingCount = statusCounts.pending_review ?? 0;
    const quotedCount = statusCounts.quoted ?? 0;

    useEffect(() => {
        setDrafts(
            Object.fromEntries(
                customCakes.map((customCake) => [
                    customCake.id,
                    {
                        admin_note: customCake.admin_note ?? '',
                        estimated_price: customCake.estimated_price ? String(Math.round(customCake.estimated_price)) : '',
                        status: customCake.status,
                    },
                ]),
            ),
        );
    }, [customCakes]);

    const updateDraft = (customCakeId: number, field: 'admin_note' | 'estimated_price' | 'status', value: string) => {
        setDrafts((current) => ({
            ...current,
            [customCakeId]: {
                admin_note: current[customCakeId]?.admin_note ?? '',
                estimated_price: current[customCakeId]?.estimated_price ?? '',
                status: current[customCakeId]?.status ?? 'pending_review',
                [field]: value,
            },
        }));
    };

    const handleUpdateCustomCake = async (customCake: CustomCakeRequest) => {
        const draft = drafts[customCake.id];

        if (!draft) {
            return;
        }

        try {
            await updateCustomCake(customCake.id, {
                status: draft.status,
                estimated_price: draft.estimated_price ? Number(draft.estimated_price) : null,
                admin_note: draft.admin_note || null,
            });
            await refreshCustomCakes();
            setMessage('Đã cập nhật yêu cầu bánh riêng.');
        } catch (caughtError) {
            setMessage(caughtError instanceof Error ? caughtError.message : 'Không cập nhật được yêu cầu bánh riêng.');
        }
    };

    return (
        <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={<FileText size={20} />} label="Tổng yêu cầu" value={`${customCakes.length}`} note="Mới nhất trước" />
                <MetricCard icon={<Clock3 size={20} />} label="Chờ xem xét" value={`${pendingCount}`} note="Cần phản hồi sớm" />
                <MetricCard icon={<CheckCircle2 size={20} />} label="Đã báo giá" value={`${quotedCount}`} note="Khách có thể đặt hàng" />
            </section>

            {(message || error) && (
                <div
                    className={`rounded-xl border p-4 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
                >
                    {error || message}
                </div>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <FilterButton active={activeStatus === 'all'} count={customCakes.length} label="Tất cả" onClick={() => setActiveStatus('all')} />
                    {Object.entries(statuses).map(([status, label]) => (
                        <FilterButton
                            active={activeStatus === status}
                            count={statusCounts[status] ?? 0}
                            key={status}
                            label={label}
                            onClick={() => setActiveStatus(status)}
                        />
                    ))}
                </div>

                {isLoading && <div className="rounded-xl bg-slate-50 p-6 text-sm text-slate-500">Đang tải yêu cầu bánh riêng...</div>}
                {!isLoading && filteredCustomCakes.length === 0 && <EmptyState message="Chưa có yêu cầu bánh riêng nào." />}

                <div className="grid gap-4">
                    {!isLoading &&
                        filteredCustomCakes.map((customCake) => {
                            const draft = drafts[customCake.id] ?? {
                                admin_note: customCake.admin_note ?? '',
                                estimated_price: customCake.estimated_price ? String(Math.round(customCake.estimated_price)) : '',
                                status: customCake.status,
                            };

                            return (
                                <article className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={customCake.id}>
                                    <div className="grid gap-4 xl:grid-cols-[140px_1fr_320px]">
                                        <div className="grid h-32 place-items-center overflow-hidden rounded-lg bg-white text-sm font-semibold text-slate-400">
                                            {customCake.reference_image_url ? (
                                                <img
                                                    className="h-full w-full object-cover"
                                                    src={customCake.reference_image_url}
                                                    alt={`Mẫu bánh #${customCake.id}`}
                                                />
                                            ) : (
                                                'No image'
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">Yêu cầu #{customCake.id}</h3>
                                                <StatusBadge status={customCake.status_label} />
                                            </div>
                                            <div className="grid gap-1 text-sm text-slate-600">
                                                <span>
                                                    {customCake.customer_name} · {customCake.customer_phone}
                                                </span>
                                                <span>
                                                    {[
                                                        customCake.cake_size,
                                                        customCake.flavor,
                                                        customCake.servings ? `${customCake.servings} người ăn` : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </span>
                                                <span>
                                                    Ngày nhận: {customCake.desired_date ? formatOrderTime(customCake.desired_date) : 'Chưa cập nhật'}
                                                </span>
                                                <span>Ngân sách: {customCake.budget_formatted ?? 'Chưa có'}</span>
                                                {customCake.text_on_cake && <span>Chữ trên bánh: {customCake.text_on_cake}</span>}
                                                {customCake.accessories && <span>Phụ kiện: {customCake.accessories}</span>}
                                                {customCake.note && <span>Ghi chú: {customCake.note}</span>}
                                            </div>
                                        </div>
                                        <div className="grid gap-3 rounded-lg bg-white p-4">
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                Trạng thái
                                                <select
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    onChange={(event) => updateDraft(customCake.id, 'status', event.target.value)}
                                                    value={draft.status}
                                                >
                                                    {!selectableCustomCakeStatusEntries.some(([status]) => status === draft.status) && (
                                                        <option disabled hidden value={draft.status}>
                                                            {statuses[draft.status] ?? customCake.status_label}
                                                        </option>
                                                    )}
                                                    {selectableCustomCakeStatusEntries.map(([status, label]) => (
                                                        <option key={status} value={status}>
                                                            {label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                Giá báo
                                                <input
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    min="0"
                                                    onChange={(event) => updateDraft(customCake.id, 'estimated_price', event.target.value)}
                                                    placeholder="VD: 650000"
                                                    type="number"
                                                    value={draft.estimated_price}
                                                />
                                            </label>
                                            <label className="grid gap-1 text-xs font-medium text-slate-600">
                                                Phản hồi cho khách
                                                <textarea
                                                    className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                                    onChange={(event) => updateDraft(customCake.id, 'admin_note', event.target.value)}
                                                    placeholder="VD: Tiệm làm được mẫu này, cần chỉnh màu..."
                                                    value={draft.admin_note}
                                                />
                                            </label>
                                            <button
                                                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                                                onClick={() => void handleUpdateCustomCake(customCake)}
                                                type="button"
                                            >
                                                <CheckCircle2 size={16} />
                                                Lưu phản hồi
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                </div>
            </section>
        </div>
    );
}

function OrdersTab({
    error,
    isLoading,
    message,
    orders,
    pagination,
    refreshOrders,
    setMessage,
    statusCounts,
    statuses,
}: {
    error: string;
    isLoading: boolean;
    message: string;
    orders: AdminOrder[];
    pagination: PaginationMeta | null;
    refreshOrders: (filters?: OrderListFilters) => Promise<void>;
    setMessage: (message: string) => void;
    statusCounts: Record<string, number>;
    statuses: OrderStatusMap;
}) {
    const [filters, setFilters] = useState({
        status: 'all',
    });
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const currentPage = pagination?.current_page ?? 1;
    const totalOrders = Object.values(statusCounts).reduce((total, count) => total + count, 0) || pagination?.total || orders.length;
    const countByStatus = (status: string) => statusCounts[status] ?? 0;

    const buildOrderListFilters = (nextFilters = filters, page = 1): OrderListFilters => ({
        status: nextFilters.status === 'all' ? undefined : nextFilters.status,
        page,
        per_page: ORDER_PAGE_SIZE,
    });

    const handleSelectStatus = async (status: string) => {
        const nextFilters = { status };

        setFilters(nextFilters);
        setSelectedOrder(null);
        setMessage('');
        await refreshOrders(buildOrderListFilters(nextFilters, 1));
    };

    const handlePageChange = async (page: number) => {
        setSelectedOrder(null);
        await refreshOrders(buildOrderListFilters(filters, page));
    };

    const handleAdvanceStatus = async (order: AdminOrder) => {
        const nextStatus = getNextOrderStatus(order.order_status, statuses);

        if (!nextStatus) {
            setMessage('Đơn hàng đã hoàn tất.');

            return;
        }

        setMessage('');

        try {
            const updatedOrder = await updateOrderStatus(order.code, nextStatus);

            setSelectedOrder((currentOrder) => (currentOrder?.code === updatedOrder.code ? updatedOrder : currentOrder));
            await refreshOrders(buildOrderListFilters(filters, currentPage));
            setMessage(`Đã cập nhật ${order.code} sang trạng thái ${statuses[nextStatus]}.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Không cập nhật được trạng thái đơn hàng.');
        }
    };

    return (
        <>
            <section className="grid gap-4 md:grid-cols-4">
                <MetricCard icon={<ClipboardList size={20} />} label="Tổng đơn" value={`${totalOrders}`} note="Đơn mới nhất trước" />
                <MetricCard icon={<Clock3 size={20} />} label="Chờ xác nhận" value={`${countByStatus('pending')}`} note="Ưu tiên xử lý" />
                <MetricCard icon={<Truck size={20} />} label="Đang giao" value={`${countByStatus('shipping')}`} note="Theo dõi shipper" />
                <MetricCard icon={<CheckCircle2 size={20} />} label="Đã giao" value={`${countByStatus('delivered')}`} note="Hoàn tất" />
            </section>

            <Panel
                title="Quản lý đơn hàng"
                subtitle="Bấm chuyển trạng thái đơn: nhận đơn -> xác nhận -> làm bánh -> bàn giao shipper -> đang giao -> đã giao."
            >
                {!selectedOrder && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        <FilterButton
                            active={filters.status === 'all'}
                            count={totalOrders}
                            label="Tất cả đơn"
                            onClick={() => void handleSelectStatus('all')}
                        />
                        {Object.entries(statuses).map(([status, label]) => (
                            <FilterButton
                                active={filters.status === status}
                                count={countByStatus(status)}
                                key={status}
                                label={label}
                                onClick={() => void handleSelectStatus(status)}
                            />
                        ))}
                    </div>
                )}
                {message && <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
                {error && <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
                {selectedOrder ? (
                    <OrderDetail
                        order={selectedOrder}
                        onAdvanceStatus={handleAdvanceStatus}
                        onBack={() => setSelectedOrder(null)}
                        statuses={statuses}
                    />
                ) : isLoading ? (
                    <EmptyState message="Đang tải đơn hàng..." />
                ) : (
                    <OrderList onAdvanceStatus={handleAdvanceStatus} onViewDetails={setSelectedOrder} orders={orders} statuses={statuses} />
                )}
                {!selectedOrder && (
                    <PaginationControls isLoading={isLoading} itemLabel="đơn hàng" meta={pagination} onPageChange={handlePageChange} />
                )}
            </Panel>
        </>
    );
}

function RevenueTab({
    error,
    isLoading,
    period,
    setPeriod,
    stats,
}: {
    error: string;
    isLoading: boolean;
    period: RevenuePeriod;
    setPeriod: (period: RevenuePeriod) => void;
    stats: RevenueStats | null;
}) {
    return (
        <>
            {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

            <section className="grid gap-4 md:grid-cols-2">
                <MetricCard
                    icon={<BarChart3 size={20} />}
                    label={revenuePeriodTitle(period)}
                    value={stats ? formatCompactCurrency(stats.summary.total_revenue) : '0đ'}
                    note={isLoading ? 'Đang tải...' : stats ? formatChangeNote(stats.summary.revenue_change_percent) : 'Chưa có dữ liệu'}
                />
                <MetricCard
                    icon={<ShoppingBag size={20} />}
                    label="Đơn đã thanh toán"
                    value={`${stats?.summary.paid_orders_count ?? 0}`}
                    note={`Tỷ lệ hoàn tất ${stats?.summary.completion_rate ?? 0}%`}
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <Panel title="Thống kê doanh thu" subtitle="Xem doanh thu theo ngày, tháng hoặc năm để theo dõi hiệu quả bán hàng.">
                    <RevenueChart detailed period={period} setPeriod={setPeriod} stats={stats} />
                </Panel>

                <Panel title="Sản phẩm bán chạy" subtitle="Các mẫu bánh đóng góp doanh thu tốt nhất.">
                    <div className="grid gap-3">
                        {stats?.top_products.map((product, index) => (
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3" key={product.name}>
                                <div className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {product.quantity} sản phẩm · {product.orders_count} đơn
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-emerald-700">{formatCompactCurrency(product.revenue)}</div>
                            </div>
                        ))}
                        {!isLoading && (!stats || stats.top_products.length === 0) && <EmptyState message="Chưa có sản phẩm để thống kê." />}
                        {isLoading && <EmptyState message="Đang tải thống kê doanh thu..." />}
                    </div>
                </Panel>
            </section>
        </>
    );
}

function VoucherTable({
    onDelete,
    onEdit,
    onToggle,
    vouchers,
}: {
    onDelete: (voucher: Voucher) => void;
    onEdit: (voucher: Voucher) => void;
    onToggle: (voucher: Voucher) => void;
    vouchers: Voucher[];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs text-slate-500 uppercase">
                    <tr className="border-b border-slate-200">
                        <th className="py-3">Mã voucher</th>
                        <th>% giảm</th>
                        <th>Số lần dùng</th>
                        <th>Còn lại</th>
                        <th>Trạng thái</th>
                        <th className="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {vouchers.map((voucher) => (
                        <tr className="border-b border-slate-100 last:border-0" key={voucher.id}>
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <Percent size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold tracking-wide">{voucher.code}</div>
                                        <div className="text-xs text-slate-500">Giảm {voucher.discount_percent}% cho đơn hàng</div>
                                    </div>
                                </div>
                            </td>
                            <td className="font-medium text-emerald-700">{voucher.discount_percent}%</td>
                            <td>
                                {voucher.used_count}/{voucher.usage_limit}
                            </td>
                            <td>{voucher.remaining_uses}</td>
                            <td>
                                <StatusBadge
                                    status={
                                        voucher.is_active && voucher.remaining_uses > 0
                                            ? 'Đang bật'
                                            : voucher.remaining_uses === 0
                                              ? 'Hết lượt'
                                              : 'Đã tắt'
                                    }
                                />
                            </td>
                            <td>
                                <div className="flex justify-end gap-2">
                                    <IconButton label="Sửa" onClick={() => onEdit(voucher)}>
                                        <Pencil size={15} />
                                    </IconButton>
                                    <IconButton label={voucher.is_active ? 'Tắt' : 'Bật'} onClick={() => onToggle(voucher)}>
                                        <EyeOff size={15} />
                                    </IconButton>
                                    <IconButton label="Xóa" onClick={() => onDelete(voucher)}>
                                        <Trash2 size={15} />
                                    </IconButton>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {vouchers.length === 0 && (
                        <tr>
                            <td className="py-8 text-center text-sm text-slate-500" colSpan={6}>
                                Chưa có voucher nào.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function ProductTable({
    categories,
    compact = false,
    onDelete,
    onEdit,
    onToggleAvailability,
    onUpdateStockQuantity,
    products,
}: {
    categories: ProductCategory[];
    compact?: boolean;
    onDelete?: (product: CakeProduct) => void;
    onEdit?: (product: CakeProduct) => void;
    onToggleAvailability?: (product: CakeProduct) => void;
    onUpdateStockQuantity?: (product: CakeProduct, stockQuantity: number) => void;
    products: CakeProduct[];
}) {
    const visibleProducts = compact ? products.slice(0, 3) : products;
    const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
    const getCategoryName = (categoryId: number) => categories.find((category) => category.id === categoryId)?.name ?? 'Chưa phân loại';

    useEffect(() => {
        setStockDrafts(Object.fromEntries(products.map((product) => [product.id, String(product.stock_quantity ?? 0)])));
    }, [products]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs text-slate-500 uppercase">
                    <tr className="border-b border-slate-200">
                        <th className="py-3">Sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Giá</th>
                        <th>Cỡ bánh</th>
                        <th>Số lượng</th>
                        <th>Trạng thái</th>
                        <th className="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleProducts.map((product) => (
                        <tr className="border-b border-slate-100 last:border-0" key={product.id}>
                            <td className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className={`grid h-11 w-11 place-items-center rounded-lg ${getProductColor(product.id)}`}>
                                        <CakeSlice size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-slate-500">{product.tag || 'Bánh'}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    {getCategoryName(product.category_id)}
                                </span>
                            </td>
                            <td className="font-medium text-emerald-700">{product.price_formatted}</td>
                            <td>{product.size_inch ? `${product.size_inch}"` : '-'}</td>
                            <td>
                                {onUpdateStockQuantity ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-sm outline-none focus:border-emerald-400"
                                            min="0"
                                            onChange={(event) =>
                                                setStockDrafts((currentDrafts) => ({
                                                    ...currentDrafts,
                                                    [product.id]: event.target.value,
                                                }))
                                            }
                                            type="number"
                                            value={stockDrafts[product.id] ?? String(product.stock_quantity ?? 0)}
                                        />
                                        <button
                                            className="inline-flex h-9 items-center rounded-lg border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                            onClick={() =>
                                                onUpdateStockQuantity(product, Number(stockDrafts[product.id] ?? product.stock_quantity ?? 0))
                                            }
                                            type="button"
                                        >
                                            Lưu
                                        </button>
                                    </div>
                                ) : (
                                    product.stock_quantity
                                )}
                            </td>
                            <td>
                                <StatusBadge status={product.is_available ? 'Đang bán' : 'Ẩn'} />
                            </td>
                            <td>
                                <div className="flex justify-end gap-2">
                                    {onEdit && (
                                        <IconButton label="Sửa" onClick={() => onEdit(product)}>
                                            <Pencil size={15} />
                                        </IconButton>
                                    )}
                                    {onToggleAvailability && (
                                        <IconButton label={product.is_available ? 'Ẩn' : 'Mở bán'} onClick={() => onToggleAvailability(product)}>
                                            <EyeOff size={15} />
                                        </IconButton>
                                    )}
                                    {onDelete && (
                                        <IconButton label="Xóa" onClick={() => onDelete(product)}>
                                            <Trash2 size={15} />
                                        </IconButton>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {visibleProducts.length === 0 && (
                        <tr>
                            <td className="py-8 text-center text-sm text-slate-500" colSpan={7}>
                                Chưa có bánh nào trong danh mục này.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function OrderList({
    compact = false,
    onAdvanceStatus,
    onViewDetails,
    orders,
    statuses = {},
}: {
    compact?: boolean;
    onAdvanceStatus?: (order: AdminOrder) => void;
    onViewDetails?: (order: AdminOrder) => void;
    orders: AdminOrder[];
    statuses?: OrderStatusMap;
}) {
    const visibleOrders = compact ? orders.slice(0, 3) : orders;

    return (
        <div className="grid gap-3">
            {visibleOrders.map((order) => (
                <div
                    className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                    key={order.code}
                >
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">#{order.code}</span>
                            <StatusBadge status={order.order_status_label} />
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                            {order.customer_name} · {summarizeOrderItems(order)} · {formatOrderTime(order.created_date)}
                        </div>
                        {!compact && (
                            <div className="mt-2 grid gap-1 text-xs text-slate-500">
                                <span>
                                    Giao đến: {[order.customer_address, order.customer_district].filter(Boolean).join(', ') || order.shipping_address}
                                </span>
                                <span>Khung giờ: {order.delivery_slot ?? 'Chưa cập nhật'}</span>
                            </div>
                        )}
                    </div>
                    <div className="text-sm font-semibold text-emerald-700">{formatCurrency(order.amount)}</div>
                    {(onAdvanceStatus || onViewDetails) && (
                        <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                            {onViewDetails && (
                                <button
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                    onClick={() => onViewDetails(order)}
                                    type="button"
                                >
                                    <Eye size={16} />
                                    Chi tiết
                                </button>
                            )}
                            {onAdvanceStatus && (
                                <button
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={!getNextOrderStatus(order.order_status, statuses)}
                                    onClick={() => onAdvanceStatus(order)}
                                    type="button"
                                >
                                    <Truck size={16} />
                                    {getNextOrderStatus(order.order_status, statuses) ? 'Chuyển trạng thái' : 'Đã hoàn tất'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
            {visibleOrders.length === 0 && <EmptyState message="Chưa có đơn hàng nào." />}
        </div>
    );
}

function OrderDetail({
    onAdvanceStatus,
    onBack,
    order,
    statuses,
}: {
    onAdvanceStatus: (order: AdminOrder) => void;
    onBack: () => void;
    order: AdminOrder;
    statuses: OrderStatusMap;
}) {
    const subtotal = order.items.reduce((total, item) => total + item.line_total, 0);
    const discountAmount = Math.max(0, subtotal - order.amount);
    const deliveryAddress = [order.customer_address, order.customer_district].filter(Boolean).join(', ') || order.shipping_address;
    const nextStatus = getNextOrderStatus(order.order_status, statuses);

    return (
        <div className="grid gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <button
                        className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        onClick={onBack}
                        type="button"
                    >
                        <ArrowLeft size={16} />
                        Quay lại danh sách
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">#{order.code}</h3>
                        <StatusBadge status={order.order_status_label} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Tạo lúc {formatOrderTime(order.created_date)}</p>
                </div>
                <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!nextStatus}
                    onClick={() => onAdvanceStatus(order)}
                    type="button"
                >
                    <Truck size={16} />
                    {nextStatus ? `Chuyển sang ${statuses[nextStatus]}` : 'Đã hoàn tất'}
                </button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                        <User size={18} />
                        Thông tin khách hàng
                    </div>
                    <div className="grid gap-3 text-sm">
                        <OrderInfoRow icon={<User size={16} />} label="Tên khách" value={order.customer_name} />
                        <OrderInfoRow icon={<Phone size={16} />} label="Số điện thoại" value={order.customer_phone} />
                        <OrderInfoRow icon={<MapPin size={16} />} label="Địa chỉ" value={deliveryAddress} />
                        <OrderInfoRow icon={<CalendarDays size={16} />} label="Khung giờ" value={order.delivery_slot ?? 'Chưa cập nhật'} />
                        {order.customer_note && <OrderInfoRow icon={<FileText size={16} />} label="Ghi chú" value={order.customer_note} />}
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                        <FileText size={18} />
                        Hóa đơn
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="text-xs text-slate-500 uppercase">
                                <tr className="border-b border-slate-200">
                                    <th className="py-3">Sản phẩm</th>
                                    <th>Số lượng</th>
                                    <th>Đơn giá</th>
                                    <th className="text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr className="border-b border-slate-100 last:border-0" key={item.id}>
                                        <td className="py-3">
                                            <div className="font-medium text-slate-900">{item.name}</div>
                                            {item.description && <div className="mt-1 text-xs text-slate-500">{item.description}</div>}
                                        </td>
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td className="text-right font-medium text-slate-900">{formatCurrency(item.line_total)}</td>
                                    </tr>
                                ))}
                                {order.items.length === 0 && (
                                    <tr>
                                        <td className="py-8 text-center text-sm text-slate-500" colSpan={4}>
                                            Chưa có sản phẩm trong hóa đơn.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 ml-auto grid max-w-sm gap-2 border-t border-slate-100 pt-4 text-sm">
                        <OrderTotalRow label="Tạm tính" value={formatCurrency(subtotal)} />
                        {discountAmount > 0 && <OrderTotalRow label="Giảm giá" value={`-${formatCurrency(discountAmount)}`} />}
                        <OrderTotalRow label="Tổng thanh toán" strong value={formatCurrency(order.amount)} />
                    </div>
                </section>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
                    <ClipboardList size={18} />
                    Tiến trình đơn hàng
                </div>
                <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                    {order.timeline.map((item) => (
                        <div
                            className={`rounded-lg border p-3 text-xs ${
                                item.state === 'active'
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : item.state === 'done'
                                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                                      : 'border-slate-100 bg-white text-slate-400'
                            }`}
                            key={item.status}
                        >
                            <div className="font-semibold">{item.label}</div>
                            <div className="mt-1">{item.note}</div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function OrderInfoRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
    return (
        <div className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-slate-700">
            <span className="mt-0.5 text-emerald-600">{icon}</span>
            <div>
                <div className="text-xs font-medium text-slate-500">{label}</div>
                <div className="mt-0.5 font-medium">{value || 'Chưa cập nhật'}</div>
            </div>
        </div>
    );
}

function OrderTotalRow({ label, strong = false, value }: { label: string; strong?: boolean; value: string }) {
    return (
        <div className={`flex justify-between gap-4 ${strong ? 'text-base font-semibold text-slate-900' : 'text-slate-600'}`}>
            <span>{label}</span>
            <span className={strong ? 'text-emerald-700' : ''}>{value}</span>
        </div>
    );
}

function summarizeOrderItems(order: AdminOrder): string {
    if (order.items.length === 0) {
        return 'Chưa có sản phẩm';
    }

    const firstItem = order.items[0];
    const suffix = order.items.length > 1 ? ` +${order.items.length - 1} món` : '';

    return `${firstItem.name} x${firstItem.quantity}${suffix}`;
}

function getNextOrderStatus(currentStatus: string, statuses: OrderStatusMap): string | null {
    const keys = Object.keys(statuses);
    const currentIndex = keys.indexOf(currentStatus);

    if (currentIndex === -1 || currentIndex >= keys.length - 1) {
        return null;
    }

    return keys[currentIndex + 1];
}

function formatOrderTime(value?: string | null): string {
    if (!value) {
        return 'Chưa cập nhật';
    }

    return new Date(value).toLocaleString('vi-VN');
}

function formatCurrency(amount: number): string {
    return `${amount.toLocaleString('vi-VN')}đ`;
}

const revenuePeriods: { label: string; value: RevenuePeriod }[] = [
    { label: 'Ngày', value: 'day' },
    { label: 'Tháng', value: 'month' },
    { label: 'Năm', value: 'year' },
];

function periodToApiPeriod(period: string): RevenuePeriod {
    if (period === 'month' || period === 'Tháng') {
        return 'month';
    }

    if (period === 'year' || period === 'Năm') {
        return 'year';
    }

    return 'day';
}

function revenuePeriodTitle(period: string): string {
    const apiPeriod = periodToApiPeriod(period);

    if (apiPeriod === 'month') {
        return 'Doanh thu năm nay';
    }

    if (apiPeriod === 'year') {
        return 'Doanh thu 5 năm';
    }

    return 'Doanh thu tuần';
}

function formatChangeNote(percent: number): string {
    if (percent === 0) {
        return 'Không đổi so với kỳ trước';
    }

    return `${percent > 0 ? '+' : ''}${percent}% so với kỳ trước`;
}

function formatCompactCurrency(amount: number): string {
    if (amount >= 1000000) {
        return `${Number((amount / 1000000).toFixed(1)).toLocaleString('vi-VN')}tr`;
    }

    if (amount >= 1000) {
        return `${Number((amount / 1000).toFixed(1)).toLocaleString('vi-VN')}k`;
    }

    return `${amount.toLocaleString('vi-VN')}đ`;
}

function RevenueChart({
    detailed = false,
    period,
    setPeriod,
    stats,
}: {
    detailed?: boolean;
    period: RevenuePeriod;
    setPeriod: (period: RevenuePeriod) => void;
    stats: RevenueStats | null;
}) {
    const chart = useMemo(() => stats?.chart ?? [], [stats?.chart]);
    const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = chartCanvasRef.current;

        if (!canvas || chart.length === 0) {
            return;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        const gradient = context.createLinearGradient(0, 0, 0, detailed ? 288 : 192);

        gradient.addColorStop(0, 'rgba(5, 150, 105, 0.24)');
        gradient.addColorStop(1, 'rgba(5, 150, 105, 0.02)');

        const revenueLineChart = new ChartJS(context, {
            type: 'line',
            data: {
                labels: chart.map((item) => item.label),
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: chart.map((item) => item.revenue),
                        borderColor: '#059669',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        pointBackgroundColor: '#ffffff',
                        pointBorderColor: '#059669',
                        pointBorderWidth: 2,
                        pointHoverRadius: 6,
                        pointRadius: 4,
                        tension: 0.35,
                    },
                ],
            },
            options: {
                animation: {
                    duration: 500,
                },
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context: TooltipItem<'line'>): string => {
                                const point = chart[context.dataIndex];

                                return `Doanh thu: ${point?.revenue_formatted ?? formatCompactCurrency(Number(context.parsed.y))}`;
                            },
                        },
                        displayColors: false,
                    },
                },
                responsive: true,
                scales: {
                    x: {
                        border: {
                            display: false,
                        },
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 12,
                            },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        border: {
                            display: false,
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.18)',
                        },
                        ticks: {
                            callback: (value: string | number): string => formatCompactCurrency(Number(value)),
                            color: '#64748b',
                            font: {
                                size: 12,
                            },
                        },
                    },
                },
            },
        });

        return () => {
            revenueLineChart.destroy();
        };
    }, [chart, detailed]);

    return (
        <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    {revenuePeriods.map((item) => (
                        <button
                            className={`min-h-9 rounded-full px-4 text-xs font-medium ${period === item.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            key={item.value}
                            onClick={() => setPeriod(item.value)}
                            type="button"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
                {detailed && <div className="text-sm font-medium text-emerald-700">Tổng: {stats?.summary.total_revenue_formatted ?? '0đ'}</div>}
            </div>
            <div className={`rounded-xl bg-slate-50 px-4 py-4 ${detailed ? 'h-72' : 'h-48'}`}>
                {chart.length > 0 ? (
                    <canvas aria-label="Biểu đồ đường thống kê doanh thu" ref={chartCanvasRef} role="img" />
                ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-slate-500">Chưa có dữ liệu doanh thu.</div>
                )}
            </div>
            {stats?.best_seller && (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-sm font-semibold text-emerald-900">{stats.best_seller.name} đang là Best Seller</div>
                    <div className="mt-1 text-xs text-emerald-700">
                        Doanh thu: {stats.best_seller.revenue_formatted} · {stats.best_seller.quantity} sản phẩm · {stats.best_seller.orders_count}{' '}
                        đơn
                    </div>
                </div>
            )}
        </>
    );
}
function AdminNavItem({ active = false, icon, label, onClick }: { active?: boolean; icon: ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left font-medium transition ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'}`}
            onClick={onClick}
            type="button"
        >
            {icon}
            {label}
        </button>
    );
}

function MetricCard({ icon, label, note, value }: { icon: ReactNode; label: string; note: string; value: string }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</span>
                <span className="text-right text-xs font-medium text-emerald-700">{note}</span>
            </div>
            <div className="text-2xl font-semibold">{value}</div>
            <div className="mt-1 text-sm text-slate-500">{label}</div>
        </div>
    );
}

function Panel({
    actionLabel,
    children,
    icon,
    onAction,
    subtitle,
    title,
}: {
    actionLabel?: string;
    children: ReactNode;
    icon?: ReactNode;
    onAction?: () => void;
    subtitle: string;
    title: string;
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
                {actionLabel && (
                    <button
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        onClick={onAction}
                        type="button"
                    >
                        {icon}
                        {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function CategoryPill({ active = false, count, label, onClick }: { active?: boolean; count?: number; label: string; onClick: () => void }) {
    return (
        <button
            className={`inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-medium transition ${
                active
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
            onClick={onClick}
            type="button"
        >
            {label}
            {typeof count === 'number' && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function FilterButton({ active = false, count, label, onClick }: { active?: boolean; count?: number; label: string; onClick?: () => void }) {
    return (
        <button
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium ${active ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            onClick={onClick}
            type="button"
        >
            {label}
            {typeof count === 'number' && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function EmptyState({ message }: { message: string }) {
    return <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">{message}</div>;
}

function StatusBadge({ status }: { status: string }) {
    const tone = status.includes('Đang bật')
        ? 'bg-emerald-100 text-emerald-700'
        : status.includes('Đã tắt') || status.includes('Hết lượt')
          ? 'bg-amber-100 text-amber-700'
          : status.includes('Đã giao')
            ? 'bg-emerald-100 text-emerald-700'
            : status.includes('Đang giao')
              ? 'bg-sky-100 text-sky-700'
              : status.includes('Ẩn') || status.includes('Sắp hết')
                ? 'bg-amber-100 text-amber-700'
                : 'bg-violet-100 text-violet-700';

    return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

function getProductColor(productId: number): string {
    const colors = ['bg-pink-100 text-pink-700', 'bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-amber-100 text-amber-700'];

    return colors[productId % colors.length];
}

function IconButton({ children, label, onClick }: { children: ReactNode; label: string; onClick?: () => void }) {
    return (
        <button
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
            onClick={onClick}
            type="button"
        >
            {children}
            {label}
        </button>
    );
}
