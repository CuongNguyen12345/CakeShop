<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomCakeController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RevenueStatsController;
use App\Http\Controllers\Api\SepayWebhookController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

Route::get('/users', UserController::class)->name('api.users.index');
Route::patch('/users/{user}/profile', [UserController::class, 'update'])->name('api.users.profile.update');
Route::get('/users/{user}/orders', [OrderController::class, 'userHistory'])->name('api.users.orders.index');

Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.forgot-password');
Route::post('/login/google', [AuthController::class, 'googleLogin'])->name('api.login.google');

Route::post('/payments/checkout', [PaymentController::class, 'checkout'])->name('api.payments.checkout');
Route::get('/payments/orders/{order:code}', [PaymentController::class, 'show'])->name('api.payments.orders.show');
Route::get('/orders', [OrderController::class, 'index'])->name('api.orders.index');
Route::patch('/orders/{order:code}/status', [OrderController::class, 'updateStatus'])->name('api.orders.status');
Route::apiResource('/custom-cakes', CustomCakeController::class)->names('api.custom-cakes');
Route::get('/revenue/stats', RevenueStatsController::class)->name('api.revenue.stats');
Route::post('/sepay/webhook', SepayWebhookController::class)->name('api.sepay.webhook');
Route::apiResource('/categories', ProductCategoryController::class)->names('api.categories');
Route::apiResource('/products', ProductController::class)->names('api.products');
Route::post('/vouchers/apply', [VoucherController::class, 'apply'])->name('api.vouchers.apply');
Route::apiResource('/vouchers', VoucherController::class)->names('api.vouchers');
Route::get('/wishlists', [WishlistController::class, 'index'])->name('api.wishlists.index');
Route::post('/wishlists/toggle', [WishlistController::class, 'toggle'])->name('api.wishlists.toggle');
