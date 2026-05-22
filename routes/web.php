<?php

use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('bakery/home');
})->name('home');

Route::get('menu', function () {
    return Inertia::render('bakery/menu');
})->name('bakery.menu');

Route::get('products/{productId?}', function (?int $productId = 1) {
    return Inertia::render('bakery/product-detail', [
        'productId' => $productId,
    ]);
})->name('bakery.products.show');

Route::get('cart', function () {
    return Inertia::render('bakery/cart');
})->name('bakery.cart');

Route::get('checkout', function () {
    return Inertia::render('bakery/checkout');
})->name('bakery.checkout');

Route::get('order-confirm', function (Request $request) {
    $order = Order::with('items')->where('code', $request->query('order_code'))->first();
    $orderData = $order ? (new OrderResource($order))->resolve() : [];

    return Inertia::render('bakery/confirm', [
        'orderCode' => $order?->code ?? $request->query('order_code'),
        'paymentMethod' => $order?->payment_method ?? $request->query('payment_method'),
        'paymentStatus' => $order?->payment_status ?? $request->query('payment_status'),
        'amount' => $order?->amount ?? $request->query('amount'),
        'customerAddress' => $order?->customer_address ?? $request->query('customer_address'),
        'customerDistrict' => $order?->customer_district ?? $request->query('customer_district'),
        'deliverySlot' => $order?->delivery_slot ?? $request->query('delivery_slot'),
        'bankCode' => $order?->bank_code ?? $request->query('bank_code'),
        'bankAccountNumber' => $order?->bank_account_number ?? $request->query('bank_account_number'),
        'bankAccountName' => $order?->bank_account_name ?? $request->query('bank_account_name'),
        'transferContent' => $order?->transfer_content ?? $request->query('transfer_content'),
        'qrUrl' => $order?->qr_url ?? $request->query('qr_url'),
        'orderStatus' => $orderData['order_status'] ?? null,
        'orderStatusLabel' => $orderData['order_status_label'] ?? null,
        'items' => $orderData['items'] ?? [],
        'timeline' => $orderData['timeline'] ?? [],
    ]);
})->name('bakery.confirm');

Route::get('tracking', function () {
    return Inertia::render('bakery/tracking');
})->name('bakery.tracking');

Route::get('custom-order', function () {
    return Inertia::render('bakery/custom-order');
})->name('bakery.custom-order');

Route::get('auth', function () {
    return Inertia::render('bakery/auth');
})->name('bakery.auth');

Route::get('account', function () {
    return Inertia::render('bakery/account');
})->name('bakery.account');

Route::get('blog', function () {
    return Inertia::render('bakery/blog');
})->name('bakery.blog');

Route::get('about', function () {
    return Inertia::render('bakery/about');
})->name('bakery.about');

Route::get('contact', function () {
    return Inertia::render('bakery/contact');
})->name('bakery.contact');

Route::get('not-found', function () {
    return Inertia::render('bakery/not-found');
})->name('bakery.not-found');

Route::get('admin', function () {
    return Inertia::render('admin/dashboard');
})->name('admin.dashboard');

Route::get('admin/dashboard', function () {
    return Inertia::render('admin/dashboard');
})->name('admin.dashboard.index');

Route::get('api-tester', function () {
    return Inertia::render('api-tester');
})->name('api-tester');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
