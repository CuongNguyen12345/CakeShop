<?php

use App\Models\Order;

it('creates a cod checkout redirect', function () {
    $response = $this->postJson('/api/payments/checkout', checkoutPayload([
        'payment_method' => 'cod',
        'amount' => 185000,
    ]))
        ->assertSuccessful()
        ->assertJsonPath('payment_method', 'cod')
        ->assertJsonPath('payment_url', fn (string $url) => str_contains($url, '/order-confirm'));

    parse_str((string) parse_url($response->json('payment_url'), PHP_URL_QUERY), $query);

    expect($query['customer_address'])->toBe('12 Tran Hung Dao')
        ->and($query['customer_district'])->toBe('Quan 1')
        ->and($query['delivery_slot'])->toBe('14:00 - 15:00');

    $this->assertDatabaseHas('orders', [
        'code' => $response->json('order_code'),
        'payment_method' => 'cod',
        'payment_status' => 'pending',
        'amount' => 185000,
        'customer_email' => 'customer@example.com',
    ]);
});

it('creates a bank checkout redirect with sepay qr information', function () {
    config()->set('services.sepay.qr_url', 'https://qr.sepay.vn/img');
    config()->set('services.sepay.bank_code', 'MBBank');
    config()->set('services.sepay.account_number', '0123456789');
    config()->set('services.sepay.account_name', 'Fleur Bakery');
    config()->set('services.sepay.payment_prefix', 'FL');
    config()->set('services.sepay.template', 'compact');

    $response = $this->postJson('/api/payments/checkout', checkoutPayload([
        'payment_method' => 'bank',
        'amount' => 185000,
        'order_code' => '20260521123456000001',
    ]))
        ->assertSuccessful()
        ->assertJsonPath('payment_method', 'bank')
        ->assertJsonPath('bank.code', 'MBBank')
        ->assertJsonPath('bank.account_number', '0123456789')
        ->assertJsonPath('bank.account_name', 'Fleur Bakery')
        ->assertJsonPath('bank.transfer_content', 'FL20260521123456000001');

    expect($response->json('payment_url'))->toContain('/order-confirm')
        ->and($response->json('bank.qr_url'))->toContain('https://qr.sepay.vn/img?')
        ->and($response->json('bank.qr_url'))->toContain('acc=0123456789')
        ->and($response->json('bank.qr_url'))->toContain('bank=MBBank')
        ->and($response->json('bank.qr_url'))->toContain('amount=185000')
        ->and($response->json('bank.qr_url'))->toContain('des=FL20260521123456000001');

    $this->assertDatabaseHas('orders', [
        'code' => '20260521123456000001',
        'payment_method' => 'bank',
        'payment_status' => 'pending',
        'amount' => 185000,
        'transfer_content' => 'FL20260521123456000001',
    ]);
});

it('marks a bank order as paid from a valid sepay webhook', function () {
    config()->set('services.sepay.api_key', 'test-secret');

    $order = Order::create(orderPayload([
        'code' => '20260521123456000001',
        'payment_method' => 'bank',
        'amount' => 185000,
        'transfer_content' => 'FL20260521123456000001',
    ]));

    $this->postJson('/api/sepay/webhook', sepayPayload([
        'id' => 987654,
        'code' => 'FL20260521123456000001',
        'transferAmount' => 185000,
    ]), [
        'Authorization' => 'Apikey test-secret',
    ])->assertSuccessful()
        ->assertJsonPath('success', true);

    expect($order->refresh()->payment_status)->toBe('paid')
        ->and($order->paid_at)->not->toBeNull();

    $this->assertDatabaseHas('sepay_transactions', [
        'order_id' => $order->id,
        'sepay_transaction_id' => '987654',
        'transfer_type' => 'IN',
        'transfer_amount' => 185000,
    ]);
});

it('keeps a bank order pending when sepay transfer amount is not enough', function () {
    config()->set('services.sepay.api_key', 'test-secret');

    $order = Order::create(orderPayload([
        'payment_method' => 'bank',
        'amount' => 185000,
        'transfer_content' => 'FL20260521123456000001',
    ]));

    $this->postJson('/api/sepay/webhook', sepayPayload([
        'id' => 987655,
        'code' => 'FL20260521123456000001',
        'transferAmount' => 100000,
    ]), [
        'Authorization' => 'Apikey test-secret',
    ])->assertSuccessful();

    expect($order->refresh()->payment_status)->toBe('partial')
        ->and($order->paid_at)->toBeNull();
});

it('rejects sepay webhook requests without the configured api key', function () {
    config()->set('services.sepay.api_key', 'test-secret');

    $this->postJson('/api/sepay/webhook', sepayPayload(), [
        'Authorization' => 'Apikey wrong-secret',
    ])->assertUnauthorized();
});

it('requires sepay bank settings before creating a bank checkout', function () {
    config()->set('services.sepay.bank_code', null);
    config()->set('services.sepay.account_number', null);

    $this->postJson('/api/payments/checkout', checkoutPayload([
        'payment_method' => 'bank',
        'amount' => 185000,
    ]))->assertUnprocessable();
});

it('requires customer contact and delivery details', function () {
    $this->postJson('/api/payments/checkout', [
        'payment_method' => 'cod',
        'amount' => 185000,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'customer_name',
            'customer_phone',
            'customer_email',
            'customer_address',
            'customer_district',
            'delivery_date',
            'delivery_slot',
        ])
        ->assertJsonMissingValidationErrors(['customer_note']);
});

it('rejects unsupported payment methods', function () {
    $this->postJson('/api/payments/checkout', [
        'payment_method' => 'online',
        'amount' => 185000,
    ])->assertUnprocessable();
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function checkoutPayload(array $overrides = []): array
{
    return array_merge([
        'payment_method' => 'cod',
        'amount' => 185000,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'customer_email' => 'customer@example.com',
        'shipping_address' => '12 Tran Hung Dao, Quan 1',
        'customer_address' => '12 Tran Hung Dao',
        'customer_district' => 'Quan 1',
        'delivery_date' => now()->toDateString(),
        'delivery_time' => '14:00:00',
        'delivery_slot' => '14:00 - 15:00',
        'total_amount' => 185000,
    ], $overrides);
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function orderPayload(array $overrides = []): array
{
    return array_merge([
        'code' => '20260521123456000002',
        'payment_method' => 'bank',
        'payment_status' => 'pending',
        'amount' => 185000,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'customer_email' => 'customer@example.com',
        'shipping_address' => '12 Tran Hung Dao, Quan 1',
        'customer_address' => '12 Tran Hung Dao',
        'customer_district' => 'Quan 1',
        'delivery_date' => now()->toDateString(),
        'delivery_time' => '14:00:00',
        'delivery_slot' => '14:00 - 15:00',
        'total_amount' => 185000,
    ], $overrides);
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function sepayPayload(array $overrides = []): array
{
    return array_merge([
        'id' => 123456,
        'gateway' => 'MBBank',
        'transactionDate' => now()->toDateTimeString(),
        'accountNumber' => '0915046248',
        'code' => 'FL20260521123456000001',
        'content' => 'Thanh toan FL20260521123456000001',
        'transferType' => 'in',
        'transferAmount' => 185000,
        'accumulated' => 185000,
        'referenceCode' => 'MBVCB.123456',
    ], $overrides);
}
