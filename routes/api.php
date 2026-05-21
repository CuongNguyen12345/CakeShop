<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SepayWebhookController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoucherController;
use Illuminate\Support\Facades\Route;

Route::get('/users', UserController::class)->name('api.users.index');

Route::post('/register', [AuthController::class, 'register'])->name('api.register');
Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('api.forgot-password');
Route::post('/login/google', [AuthController::class, 'googleLogin'])->name('api.login.google');

Route::post('/payments/checkout', [PaymentController::class, 'checkout'])->name('api.payments.checkout');
Route::post('/sepay/webhook', SepayWebhookController::class)->name('api.sepay.webhook');
Route::apiResource('/categories', ProductCategoryController::class)->names('api.categories');
Route::apiResource('/products', ProductController::class)->names('api.products');
Route::post('/vouchers/apply', [VoucherController::class, 'apply'])->name('api.vouchers.apply');
Route::apiResource('/vouchers', VoucherController::class)->names('api.vouchers');
