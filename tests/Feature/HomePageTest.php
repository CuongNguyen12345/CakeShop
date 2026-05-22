<?php

use App\Models\Order;
use App\Models\Product;
use Inertia\Testing\AssertableInertia as Assert;

it('shows best selling products on the home page', function () {
    $leastSoldProduct = Product::factory()->create([
        'name' => 'Mini Tart',
        'is_available' => true,
    ]);
    $bestSoldProduct = Product::factory()->create([
        'name' => 'Sakura Mousse Cake',
        'is_available' => true,
    ]);
    $hiddenProduct = Product::factory()->create([
        'name' => 'Hidden Cake',
        'is_available' => false,
    ]);
    $order = Order::create(homeOrderPayload());

    $order->items()->createMany([
        [
            'product_id' => $leastSoldProduct->id,
            'item_name' => $leastSoldProduct->name,
            'quantity' => 2,
            'price' => $leastSoldProduct->price,
        ],
        [
            'product_id' => $bestSoldProduct->id,
            'item_name' => $bestSoldProduct->name,
            'quantity' => 5,
            'price' => $bestSoldProduct->price,
        ],
        [
            'product_id' => $hiddenProduct->id,
            'item_name' => $hiddenProduct->name,
            'quantity' => 10,
            'price' => $hiddenProduct->price,
        ],
    ]);

    $this->get('/')
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bakery/home')
            ->has('bestSellingProducts', 2)
            ->where('bestSellingProducts.0.id', $bestSoldProduct->id)
            ->where('bestSellingProducts.0.sold_count', 5)
            ->where('bestSellingProducts.1.id', $leastSoldProduct->id)
            ->where('bestSellingProducts.1.sold_count', 2)
        );
});

/**
 * @return array<string, mixed>
 */
function homeOrderPayload(): array
{
    return [
        'code' => '20260522123456000001',
        'payment_method' => 'cod',
        'payment_status' => 'pending',
        'order_status' => 'pending',
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
    ];
}
