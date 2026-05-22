<?php

use App\Models\Order;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    DB::table('products')->insertOrIgnore([
        'id' => 1,
        'name' => 'Sakura Mousse Cake',
        'description' => 'Kem tươi · Hoa anh đào · 6 inch',
        'price' => 185000,
        'stock_quantity' => 10,
        'is_available' => true,
    ]);
});

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
        'order_status' => 'pending',
        'amount' => 185000,
        'customer_email' => null,
    ]);

    $this->assertDatabaseHas('order_items', [
        'order_id' => Order::where('code', $response->json('order_code'))->value('id'),
        'product_id' => 1,
        'item_name' => 'Sakura Mousse Cake',
        'quantity' => 1,
        'price' => 185000,
    ]);

    $this->assertDatabaseHas('products', [
        'id' => 1,
        'stock_quantity' => 9,
    ]);
});

it('rejects checkout when product stock is not enough', function () {
    DB::table('products')->where('id', 1)->update(['stock_quantity' => 0]);

    $this->postJson('/api/payments/checkout', checkoutPayload([
        'order_code' => '20260521123456000006',
    ]))
        ->assertUnprocessable()
        ->assertInvalid(['items']);

    $this->assertDatabaseMissing('orders', [
        'code' => '20260521123456000006',
    ]);
});

it('uses the logged in user email as the order customer email', function () {
    $userId = DB::table('users')->insertGetId([
        'name' => 'Nguyen Van A',
        'email' => 'nguyenvana@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->postJson('/api/payments/checkout', checkoutPayload([
        'user_id' => $userId,
        'order_code' => '20260521123456000007',
    ]))->assertSuccessful();

    $this->assertDatabaseHas('orders', [
        'code' => $response->json('order_code'),
        'user_id' => $userId,
        'customer_email' => 'nguyenvana@example.com',
    ]);
});

it('counts voucher usage when checkout uses a voucher', function () {
    $voucher = Voucher::factory()->create([
        'code' => 'SAVE20',
        'discount_percent' => 20,
        'usage_limit' => 3,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $this->postJson('/api/payments/checkout', checkoutPayload([
        'payment_method' => 'cod',
        'amount' => 148000,
        'order_code' => '20260521123456000010',
        'voucher_code' => 'save20',
    ]))->assertSuccessful();

    expect($voucher->refresh()->used_count)->toBe(2)
        ->and($voucher->remainingUses())->toBe(1);
});

it('rejects checkout when voucher has no remaining uses', function () {
    Voucher::factory()->create([
        'code' => 'DONE',
        'discount_percent' => 20,
        'usage_limit' => 2,
        'used_count' => 2,
        'is_active' => true,
    ]);

    $this->postJson('/api/payments/checkout', checkoutPayload([
        'payment_method' => 'cod',
        'amount' => 148000,
        'order_code' => '20260521123456000011',
        'voucher_code' => 'DONE',
    ]))
        ->assertUnprocessable()
        ->assertInvalid(['voucher_code']);

    $this->assertDatabaseMissing('orders', [
        'code' => '20260521123456000011',
    ]);

    $this->assertDatabaseHas('products', [
        'id' => 1,
        'stock_quantity' => 10,
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

it('returns the latest payment status for an order code', function () {
    $order = Order::create(orderPayload([
        'code' => '20260521123456000003',
        'payment_method' => 'bank',
        'payment_status' => 'paid',
        'amount' => 185000,
        'transfer_content' => 'FL20260521123456000003',
        'paid_at' => now(),
    ]));
    DB::table('order_items')->insert([
        'order_id' => $order->id,
        'product_id' => 1,
        'item_name' => 'Sakura Mousse Cake',
        'item_description' => 'Kem tươi · Hoa anh đào · 6 inch',
        'quantity' => 1,
        'price' => 185000,
    ]);

    $this->getJson('/api/payments/orders/'.$order->code)
        ->assertSuccessful()
        ->assertJsonPath('order_code', '20260521123456000003')
        ->assertJsonPath('payment_method', 'bank')
        ->assertJsonPath('payment_status', 'paid')
        ->assertJsonPath('order_status', 'baking')
        ->assertJsonPath('amount', 185000)
        ->assertJsonPath('transfer_content', 'FL20260521123456000003')
        ->assertJsonPath('items.0.name', 'Sakura Mousse Cake')
        ->assertJsonPath('timeline.2.status', 'baking');
});

it('shows order timeline timestamps in Vietnam timezone', function () {
    $order = Order::create(orderPayload([
        'code' => '20260522180816000006',
        'order_status' => 'pending',
        'created_date' => Carbon::parse('2026-05-22 11:08:00', 'UTC'),
    ]));

    $this->getJson('/api/payments/orders/'.$order->code)
        ->assertSuccessful()
        ->assertJsonPath('timeline.0.note', '22/05/2026 18:08');
});

it('lists orders and advances order status for admin management', function () {
    $order = Order::create(orderPayload([
        'code' => '20260521123456000004',
        'order_status' => 'pending',
    ]));

    $this->postJson('/api/payments/checkout', checkoutPayload([
        'order_code' => '20260521123456000005',
    ]))->assertSuccessful();

    $this->getJson('/api/orders')
        ->assertSuccessful()
        ->assertJsonPath('data.0.code', '20260521123456000005')
        ->assertJsonPath('data.0.items.0.name', 'Sakura Mousse Cake');

    $this->patchJson('/api/orders/'.$order->code.'/status', [
        'order_status' => 'confirmed',
    ])
        ->assertSuccessful()
        ->assertJsonPath('order.order_status', 'confirmed')
        ->assertJsonPath('order.order_status_label', 'Đã xác nhận');

    expect($order->refresh()->order_status)->toBe('confirmed');
});

it('filters and paginates admin orders by status', function () {
    foreach (range(1, 6) as $index) {
        Order::create(orderPayload([
            'code' => '2026052112345601'.str_pad((string) $index, 6, '0', STR_PAD_LEFT),
            'order_status' => 'shipping',
        ]));
    }

    Order::create(orderPayload([
        'code' => '2026052112345601000007',
        'order_status' => 'delivered',
    ]));

    $this->getJson('/api/orders?status=shipping&per_page=5')
        ->assertSuccessful()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.total', 6)
        ->assertJsonPath('meta.per_page', 5)
        ->assertJsonPath('status_counts.shipping', 6)
        ->assertJsonPath('status_counts.delivered', 1);

    $this->getJson('/api/orders?status=shipping&page=2&per_page=5')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('meta.current_page', 2);
});

it('lists only orders that belong to the requested user history', function () {
    $adminId = DB::table('users')->insertGetId([
        'name' => 'Admin',
        'email' => 'admin@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $customerId = DB::table('users')->insertGetId([
        'name' => 'Customer',
        'email' => 'customer@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $customerOrder = Order::create(orderPayload([
        'code' => '20260521123456000008',
        'user_id' => $customerId,
        'customer_email' => 'customer@example.com',
    ]));
    Order::create(orderPayload([
        'code' => '20260521123456000009',
        'user_id' => null,
        'customer_email' => null,
    ]));
    DB::table('order_items')->insert([
        'order_id' => $customerOrder->id,
        'product_id' => 1,
        'item_name' => 'Sakura Mousse Cake',
        'quantity' => 1,
        'price' => 185000,
    ]);

    $this->getJson("/api/users/{$adminId}/orders")
        ->assertSuccessful()
        ->assertJsonCount(0, 'data');

    $this->getJson("/api/users/{$customerId}/orders")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.order_code', '20260521123456000008')
        ->assertJsonPath('data.0.items.0.name', 'Sakura Mousse Cake');
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
            'customer_address',
            'customer_district',
            'delivery_date',
            'delivery_slot',
        ])
        ->assertJsonMissingValidationErrors(['customer_email', 'customer_note']);
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
        'shipping_address' => '12 Tran Hung Dao, Quan 1',
        'customer_address' => '12 Tran Hung Dao',
        'customer_district' => 'Quan 1',
        'delivery_date' => now()->toDateString(),
        'delivery_time' => '14:00:00',
        'delivery_slot' => '14:00 - 15:00',
        'total_amount' => 185000,
        'items' => [
            [
                'product_id' => 1,
                'name' => 'Sakura Mousse Cake',
                'description' => 'Kem tươi · Hoa anh đào · 6 inch',
                'quantity' => 1,
                'price' => 185000,
            ],
        ],
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
        'order_status' => 'baking',
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
