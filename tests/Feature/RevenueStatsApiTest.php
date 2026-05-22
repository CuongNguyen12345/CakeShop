<?php

use App\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-05-22 12:00:00', 'Asia/Ho_Chi_Minh'));

    DB::table('products')->insertOrIgnore([
        'id' => 1,
        'name' => 'Sakura Mousse Cake',
        'description' => 'Kem tuoi',
        'price' => 185000,
        'stock_quantity' => 10,
        'is_available' => true,
    ]);
});

afterEach(function () {
    Carbon::setTestNow();
});

it('returns revenue stats from paid and delivered orders only', function () {
    $paidOrder = Order::create(revenueOrderPayload([
        'code' => 'REV202605220001',
        'amount' => 300000,
        'total_amount' => 300000,
        'payment_status' => 'paid',
        'paid_at' => Carbon::parse('2026-05-18 09:00:00', 'Asia/Ho_Chi_Minh'),
        'created_date' => Carbon::parse('2026-05-18 08:00:00', 'Asia/Ho_Chi_Minh'),
    ]));
    $deliveredCodOrder = Order::create(revenueOrderPayload([
        'code' => 'REV202605220002',
        'amount' => 150000,
        'total_amount' => 150000,
        'payment_method' => 'cod',
        'payment_status' => 'pending',
        'order_status' => 'delivered',
        'created_date' => Carbon::parse('2026-05-19 10:00:00', 'Asia/Ho_Chi_Minh'),
    ]));
    Order::create(revenueOrderPayload([
        'code' => 'REV202605220003',
        'amount' => 999000,
        'total_amount' => 999000,
        'payment_status' => 'pending',
        'order_status' => 'pending',
        'created_date' => Carbon::parse('2026-05-20 10:00:00', 'Asia/Ho_Chi_Minh'),
    ]));
    Order::create(revenueOrderPayload([
        'code' => 'REV202605220004',
        'amount' => 100000,
        'total_amount' => 100000,
        'payment_status' => 'paid',
        'paid_at' => Carbon::parse('2026-05-11 09:00:00', 'Asia/Ho_Chi_Minh'),
        'created_date' => Carbon::parse('2026-05-11 08:00:00', 'Asia/Ho_Chi_Minh'),
    ]));

    DB::table('order_items')->insert([
        [
            'order_id' => $paidOrder->id,
            'product_id' => 1,
            'item_name' => 'Sakura Mousse Cake',
            'quantity' => 2,
            'price' => 100000,
        ],
        [
            'order_id' => $deliveredCodOrder->id,
            'product_id' => 1,
            'item_name' => 'Sakura Mousse Cake',
            'quantity' => 1,
            'price' => 150000,
        ],
    ]);

    $this->getJson('/api/revenue/stats?period=day')
        ->assertSuccessful()
        ->assertJsonPath('summary.total_revenue', 450000)
        ->assertJsonPath('summary.previous_revenue', 100000)
        ->assertJsonPath('summary.paid_orders_count', 2)
        ->assertJsonPath('summary.completion_rate', 67)
        ->assertJsonPath('chart.0.label', 'T2')
        ->assertJsonPath('chart.0.revenue', 300000)
        ->assertJsonPath('chart.1.label', 'T3')
        ->assertJsonPath('chart.1.revenue', 150000)
        ->assertJsonPath('top_products.0.name', 'Sakura Mousse Cake')
        ->assertJsonPath('top_products.0.quantity', 3)
        ->assertJsonPath('top_products.0.revenue', 350000)
        ->assertJsonPath('best_seller.name', 'Sakura Mousse Cake')
        ->assertJsonPath('tables.0', 'orders')
        ->assertJsonPath('tables.1', 'order_items');
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function revenueOrderPayload(array $overrides = []): array
{
    return array_merge([
        'code' => 'REV202605220000',
        'payment_method' => 'bank',
        'payment_status' => 'pending',
        'order_status' => 'pending',
        'amount' => 0,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'customer_email' => 'customer@example.com',
        'shipping_address' => 'HCM',
        'customer_address' => 'HCM',
        'customer_district' => 'Quan 1',
        'delivery_date' => now()->toDateString(),
        'delivery_time' => '14:00:00',
        'delivery_slot' => '14:00 - 15:00',
        'total_amount' => 0,
        'created_date' => now(),
    ], $overrides);
}
