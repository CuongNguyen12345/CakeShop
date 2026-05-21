import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    CakeSlice,
    CheckCircle2,
    ClipboardList,
    Clock3,
    EyeOff,
    Home,
    Package,
    PackagePlus,
    Pencil,
    Percent,
    Plus,
    Search,
    ShoppingBag,
    Tags,
    Trash2,
    TrendingUp,
    Truck,
    Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import { isAdminUser, readAuthUser } from '@/lib/auth-api';
import {
    createCategory,
    createProduct,
    deleteCategory,
    deleteProduct,
    listCategories,
    listProducts,
    updateProduct,
    type CakeProduct,
    type ProductCategory,
} from '@/lib/product-api';
import { createVoucher, deleteVoucher, listVouchers, updateVoucher, type Voucher } from '@/lib/voucher-api';

type AdminTab = 'overview' | 'products' | 'vouchers' | 'orders' | 'revenue';

type Order = {
    code: string;
    customer: string;
    item: string;
    total: string;
    status: string;
    time: string;
};

const tabs: { id: AdminTab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Tổng quan', icon: <Home size={18} /> },
    { id: 'products', label: 'Quản lý sản phẩm', icon: <CakeSlice size={18} /> },
    { id: 'vouchers', label: 'Quản lý voucher', icon: <Percent size={18} /> },
    { id: 'orders', label: 'Quản lý đơn hàng', icon: <ClipboardList size={18} /> },
    { id: 'revenue', label: 'Thống kê doanh thu', icon: <TrendingUp size={18} /> },
];

const orders: Order[] = [
    { code: '#FL2025-08471', customer: 'Lan Anh', item: 'Sakura Mousse Cake', total: '185.000đ', status: 'Đang nướng bánh', time: '09:15' },
    { code: '#FL2025-08472', customer: 'Minh Phúc', item: 'Matcha Lavender Roll x2', total: '290.000đ', status: 'Đang giao', time: '10:05' },
    { code: '#FL2025-08473', customer: 'Thu Hương', item: 'Bánh Sinh Nhật 8"', total: '450.000đ', status: 'Đã giao', time: '11:20' },
    { code: '#FL2025-08474', customer: 'Hoàng Nam', item: 'Violet Cupcake x6', total: '120.000đ', status: 'Chờ xác nhận', time: '12:40' },
];

const revenue = [
    { label: 'T2', value: 32, amount: '5.2tr' },
    { label: 'T3', value: 44, amount: '7.1tr' },
    { label: 'T4', value: 38, amount: '6.4tr' },
    { label: 'T5', value: 62, amount: '9.8tr' },
    { label: 'T6', value: 74, amount: '11.3tr' },
    { label: 'T7', value: 96, amount: '14.7tr' },
    { label: 'CN', value: 68, amount: '10.1tr' },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [period, setPeriod] = useState('Ngày');
    const [productError, setProductError] = useState('');
    const [productMessage, setProductMessage] = useState('');
    const [products, setProducts] = useState<CakeProduct[]>([]);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
    const [voucherError, setVoucherError] = useState('');
    const [voucherMessage, setVoucherMessage] = useState('');
    const [vouchers, setVouchers] = useState<Voucher[]>([]);

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

    const refreshProductManagement = async () => {
        setIsLoadingProducts(true);
        setProductError('');

        try {
            const [nextCategories, nextProducts] = await Promise.all([listCategories(), listProducts()]);

            setCategories(nextCategories);
            setProducts(nextProducts);
        } catch (error) {
            setProductError(error instanceof Error ? error.message : 'Khong tai duoc du lieu san pham.');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const refreshVouchers = async () => {
        setIsLoadingVouchers(true);
        setVoucherError('');

        try {
            setVouchers(await listVouchers());
        } catch (error) {
            setVoucherError(error instanceof Error ? error.message : 'Khong tai duoc du lieu voucher.');
        } finally {
            setIsLoadingVouchers(false);
        }
    };

    useEffect(() => {
        if (!hasCheckedAuth) {
            return;
        }

        void refreshProductManagement();
        void refreshVouchers();
    }, [hasCheckedAuth]);

    if (!hasCheckedAuth) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center text-sm text-slate-500">
                <Head title="Admin Dashboard" />
                Đang kiểm tra quyền quản trị...
            </div>
        );
    }

    const activeTabLabel = tabs.find((tab) => tab.id === activeTab)?.label ?? 'Tổng quan';

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
                                period={period}
                                products={products}
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
                        {activeTab === 'orders' && <OrdersTab />}
                        {activeTab === 'revenue' && <RevenueTab period={period} products={products} setPeriod={setPeriod} />}
                    </div>
                </main>
            </div>
        </div>
    );
}

function OverviewTab({
    categories,
    period,
    products,
    setActiveTab,
    setPeriod,
}: {
    categories: ProductCategory[];
    period: string;
    products: CakeProduct[];
    setActiveTab: (tab: AdminTab) => void;
    setPeriod: (period: string) => void;
}) {
    const activeProducts = products.filter((product) => product.is_available);
    const hiddenProducts = products.filter((product) => !product.is_available);

    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={<Package size={20} />}
                    label="Sản phẩm đang bán"
                    value={`${activeProducts.length}`}
                    note={`${categories.length} danh mục`}
                />
                <MetricCard icon={<ShoppingBag size={20} />} label="Đơn hàng hôm nay" value="32" note="8 đơn đang giao" />
                <MetricCard icon={<BarChart3 size={20} />} label="Doanh thu hôm nay" value="12.8tr" note="+18% so với hôm qua" />
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
                    <RevenueChart period={period} setPeriod={setPeriod} />
                </Panel>
            </section>

            <Panel
                actionLabel="Mở đơn hàng"
                onAction={() => setActiveTab('orders')}
                title="Đơn hàng mới"
                subtitle="Theo dõi các đơn cần xác nhận, đang làm bánh và đang giao."
            >
                <OrderList compact />
            </Panel>
        </>
    );
}

function ProductsTab({
    categories,
    error,
    isLoading,
    message,
    products,
    refreshProductManagement,
    setMessage,
}: {
    categories: ProductCategory[];
    error: string;
    isLoading: boolean;
    message: string;
    products: CakeProduct[];
    refreshProductManagement: () => Promise<void>;
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
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
    const activeProducts = products.filter((product) => product.is_available);
    const hiddenProducts = products.filter((product) => !product.is_available);
    const filteredProducts = selectedCategoryId === 'all' ? products : products.filter((product) => product.category_id === selectedCategoryId);

    useEffect(() => {
        if (categories.length > 0 && !productForm.category_id) {
            setProductForm((currentForm) => ({
                ...currentForm,
                category_id: String(categories[0].id),
            }));
        }
    }, [categories, productForm.category_id]);

    const countProductsByCategory = (categoryId: number) => products.filter((product) => product.category_id === categoryId).length;

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
            await refreshProductManagement();
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

            await refreshProductManagement();
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
        const relatedProductCount = countProductsByCategory(category.id);
        const confirmed = window.confirm(
            `Xóa danh mục "${category.name}" sẽ xóa luôn ${relatedProductCount} bánh liên quan. Bạn có chắc muốn xóa không?`,
        );

        if (!confirmed) {
            return;
        }

        setMessage('');

        try {
            await deleteCategory(category.id);
            await refreshProductManagement();

            if (selectedCategoryId === category.id) {
                setSelectedCategoryId('all');
            }

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
            await refreshProductManagement();
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
            await refreshProductManagement();
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
            await refreshProductManagement();
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
                    value={`${products.length}`}
                    note={`${activeProducts.length} sản phẩm đang bán`}
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
                    <CategoryPill active={selectedCategoryId === 'all'} label="Tất cả" onClick={() => setSelectedCategoryId('all')} />
                    {categories.map((category) => (
                        <CategoryPill
                            active={selectedCategoryId === category.id}
                            count={countProductsByCategory(category.id)}
                            key={category.id}
                            label={category.name}
                            onClick={() => setSelectedCategoryId(category.id)}
                        />
                    ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {categories.map((category) => (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" key={category.id}>
                            <div>
                                <div className="font-semibold text-slate-900">{category.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{countProductsByCategory(category.id)} bánh liên quan</div>
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
                <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                        <Search size={16} />
                        Tìm theo tên bánh, danh mục, trạng thái...
                    </div>
                    <div className="flex gap-2">
                        <FilterButton active label={`${filteredProducts.length} bánh`} />
                        <FilterButton label="Đang bán" />
                        <FilterButton label="Sắp hết" />
                    </div>
                </div>
                <ProductTable
                    categories={categories}
                    onDelete={handleDeleteProduct}
                    onEdit={handleEditProduct}
                    onToggleAvailability={handleToggleProduct}
                    onUpdateStockQuantity={handleUpdateStockQuantity}
                    products={filteredProducts}
                />
            </Panel>
        </>
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
        used_count: '0',
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
            used_count: '0',
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
            used_count: Number(voucherForm.used_count || 0),
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
            used_count: String(voucher.used_count),
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
                subtitle="Tạo mã giảm giá theo phần trăm và giới hạn số lần sử dụng. Mã còn hoạt động sẽ áp được trong giỏ hàng."
            >
                <form className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-5" onSubmit={handleSubmitVoucher}>
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
                    <input
                        className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
                        min="0"
                        onChange={(event) => setVoucherForm((currentForm) => ({ ...currentForm, used_count: event.target.value }))}
                        placeholder="Đã dùng"
                        type="number"
                        value={voucherForm.used_count}
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
                    <div className="flex gap-2 lg:col-span-5">
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

function OrdersTab() {
    return (
        <>
            <section className="grid gap-4 md:grid-cols-4">
                <MetricCard icon={<ClipboardList size={20} />} label="Tổng đơn hôm nay" value="32" note="12 đơn mới" />
                <MetricCard icon={<Clock3 size={20} />} label="Chờ xác nhận" value="6" note="Ưu tiên xử lý" />
                <MetricCard icon={<Truck size={20} />} label="Đang giao" value="8" note="Theo dõi shipper" />
                <MetricCard icon={<CheckCircle2 size={20} />} label="Đã giao" value="18" note="Hoàn tất hôm nay" />
            </section>

            <Panel title="Quản lý đơn hàng" subtitle="Bấm chuyển trạng thái đơn: Chờ xác nhận -> Đang nướng bánh -> Đang giao -> Đã giao.">
                <div className="mb-4 flex flex-wrap gap-2">
                    <FilterButton active label="Tất cả đơn" />
                    <FilterButton label="Chờ xác nhận" />
                    <FilterButton label="Đang nướng bánh" />
                    <FilterButton label="Đang giao" />
                    <FilterButton label="Đã giao" />
                </div>
                <OrderList />
            </Panel>
        </>
    );
}

function RevenueTab({ period, products, setPeriod }: { period: string; products: CakeProduct[]; setPeriod: (period: string) => void }) {
    const topProducts = products.slice(0, 3);

    return (
        <>
            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={<BarChart3 size={20} />} label="Doanh thu tuần" value="64.6tr" note="+18% so với tuần trước" />
                <MetricCard icon={<ShoppingBag size={20} />} label="Đơn đã thanh toán" value="214" note="Tỷ lệ hoàn tất 92%" />
                <MetricCard icon={<Users size={20} />} label="Khách quay lại" value="38%" note="+7% trong tháng" />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
                <Panel title="Thống kê doanh thu" subtitle="Xem doanh thu theo ngày, tháng hoặc năm để theo dõi hiệu quả bán hàng.">
                    <RevenueChart period={period} setPeriod={setPeriod} detailed />
                </Panel>

                <Panel title="Sản phẩm bán chạy" subtitle="Các mẫu bánh đóng góp doanh thu tốt nhất.">
                    <div className="grid gap-3">
                        {topProducts.map((product, index) => (
                            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3" key={product.name}>
                                <div className="flex items-center gap-3">
                                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-700">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-slate-500">{product.tag}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-emerald-700">
                                    {index === 0 ? '23.3tr' : index === 1 ? '18.5tr' : '12.8tr'}
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && <EmptyState message="Chưa có sản phẩm để thống kê." />}
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

function OrderList({ compact = false }: { compact?: boolean }) {
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
                            <span className="font-semibold">{order.code}</span>
                            <StatusBadge status={order.status} />
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                            {order.customer} · {order.item} · {order.time}
                        </div>
                    </div>
                    <div className="text-sm font-semibold text-emerald-700">{order.total}</div>
                    <button
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                        type="button"
                    >
                        <Truck size={16} />
                        Chuyển trạng thái
                    </button>
                </div>
            ))}
        </div>
    );
}

function RevenueChart({ detailed = false, period, setPeriod }: { detailed?: boolean; period: string; setPeriod: (period: string) => void }) {
    return (
        <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    {['Ngày', 'Tháng', 'Năm'].map((item) => (
                        <button
                            className={`min-h-9 rounded-full px-4 text-xs font-medium ${period === item ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            key={item}
                            onClick={() => setPeriod(item)}
                            type="button"
                        >
                            {item}
                        </button>
                    ))}
                </div>
                {detailed && <div className="text-sm font-medium text-emerald-700">Tổng: 64.6tr</div>}
            </div>
            <div className={`flex items-end gap-3 rounded-xl bg-slate-50 px-4 py-4 ${detailed ? 'h-72' : 'h-48'}`}>
                {revenue.map((item) => (
                    <div className="flex flex-1 flex-col items-center gap-2" key={item.label}>
                        <div className="w-full rounded-t-lg bg-emerald-500 transition hover:bg-emerald-600" style={{ height: `${item.value}%` }} />
                        <span className="text-xs text-slate-500">{item.label}</span>
                        {detailed && <span className="hidden text-[11px] font-medium text-slate-600 sm:inline">{item.amount}</span>}
                    </div>
                ))}
            </div>
            <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-emerald-900">Sakura Mousse Cake đang là Best Seller</div>
                <div className="mt-1 text-xs text-emerald-700">Doanh thu ước tính: 23.310.000đ · 126 đơn</div>
            </div>
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

function FilterButton({ active = false, label }: { active?: boolean; label: string }) {
    return (
        <button
            className={`min-h-10 rounded-lg px-4 text-sm font-medium ${active ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            type="button"
        >
            {label}
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
