<?php

it('returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

it('returns the api tester page', function () {
    $this->get('/api-tester')->assertSuccessful();
});

it('returns the admin dashboard page', function () {
    $this->get('/admin')->assertSuccessful();
});

it('includes a logout action on the admin dashboard', function () {
    $adminDashboard = file_get_contents(resource_path('js/pages/admin/dashboard.tsx'));

    expect($adminDashboard)
        ->toContain('forgetAuthUser')
        ->toContain('Đăng xuất');
});

it('returns bakery frontend pages', function (string $path) {
    $this->get($path)->assertSuccessful();
})->with([
    '/',
    '/menu',
    '/products/1',
    '/cart',
    '/checkout',
    '/order-confirm',
    '/tracking',
    '/custom-order',
    '/auth',
    '/account',
    '/blog',
    '/about',
    '/contact',
    '/not-found',
]);
