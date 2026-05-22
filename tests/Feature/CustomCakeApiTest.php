<?php

use App\Models\CustomCake;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

it('creates a custom cake request with a reference image', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $this->post('/api/custom-cakes', [
        'user_id' => $user->id,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'cake_size' => '6 inch',
        'flavor' => 'Chocolate',
        'servings' => 8,
        'desired_date' => now()->addDays(3)->toDateString(),
        'budget' => 500000,
        'text_on_cake' => 'Happy Birthday',
        'accessories' => 'Nến, hoa kem',
        'note' => 'Muốn giống ảnh mẫu khoảng 80%',
        'reference_image' => fakePngUpload(),
    ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('custom_cake.customer_name', 'Nguyen Van A')
        ->assertJsonPath('custom_cake.status', CustomCake::STATUS_PENDING_REVIEW)
        ->assertJsonPath('custom_cake.status_label', 'Chờ tiệm xem xét');

    $customCake = CustomCake::query()->firstOrFail();

    expect($customCake->reference_image_url)->not->toBeNull()
        ->and($customCake->cake_size)->toBe('6 inch')
        ->and($customCake->flavor)->toBe('Chocolate');

    Storage::disk('public')->assertExists(str_replace('/storage/', '', (string) $customCake->reference_image_url));
});

function fakePngUpload(): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'custom-cake');
    file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='));

    return new UploadedFile($path, 'sample-cake.png', 'image/png', null, true);
}

it('filters custom cake requests by user', function () {
    $customer = User::factory()->create();
    $otherCustomer = User::factory()->create();

    CustomCake::query()->create([
        'user_id' => $customer->id,
        'customer_name' => 'Customer A',
        'customer_phone' => '0901111111',
        'cake_size' => '6 inch',
        'flavor' => 'Matcha',
        'desired_date' => now()->addDays(4)->toDateString(),
        'status' => CustomCake::STATUS_PENDING_REVIEW,
    ]);

    CustomCake::query()->create([
        'user_id' => $otherCustomer->id,
        'customer_name' => 'Customer B',
        'customer_phone' => '0902222222',
        'cake_size' => '8 inch',
        'flavor' => 'Dâu',
        'desired_date' => now()->addDays(5)->toDateString(),
        'status' => CustomCake::STATUS_QUOTED,
        'estimated_price' => 700000,
    ]);

    $this->getJson("/api/custom-cakes?user_id={$customer->id}")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.customer_name', 'Customer A')
        ->assertJsonPath('statuses.'.CustomCake::STATUS_QUOTED, 'Đã báo giá');
});

it('updates custom cake review status and quoted price', function () {
    $customCake = CustomCake::query()->create([
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'cake_size' => '6 inch',
        'flavor' => 'Chocolate',
        'desired_date' => now()->addDays(3)->toDateString(),
        'status' => CustomCake::STATUS_PENDING_REVIEW,
    ]);

    $this->putJson("/api/custom-cakes/{$customCake->id}", [
        'status' => CustomCake::STATUS_QUOTED,
        'estimated_price' => 650000,
        'admin_note' => 'Tiệm có thể làm mẫu này, cần đặt trước 2 ngày.',
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.status', CustomCake::STATUS_QUOTED)
        ->assertJsonPath('data.estimated_price', 650000)
        ->assertJsonPath('data.admin_note', 'Tiệm có thể làm mẫu này, cần đặt trước 2 ngày.');

    $customCake->refresh();

    expect($customCake->status)->toBe(CustomCake::STATUS_QUOTED)
        ->and((float) $customCake->estimated_price)->toBe(650000.0)
        ->and($customCake->quoted_at)->not->toBeNull();
});

it('converts a quoted custom cake to an order during checkout', function () {
    $user = User::factory()->create([
        'email' => 'customer@example.com',
    ]);

    $customCake = CustomCake::query()->create([
        'user_id' => $user->id,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'cake_size' => '6 inch',
        'flavor' => 'Chocolate',
        'desired_date' => now()->addDays(3)->toDateString(),
        'status' => CustomCake::STATUS_QUOTED,
        'estimated_price' => 650000,
    ]);

    $this->postJson('/api/payments/checkout', [
        'user_id' => $user->id,
        'payment_method' => 'cod',
        'amount' => 650000,
        'customer_name' => 'Nguyen Van A',
        'customer_phone' => '0901234567',
        'customer_email' => 'customer@example.com',
        'customer_address' => '12 Nguyen Trai',
        'customer_district' => 'Quan 1',
        'delivery_date' => now()->addDays(3)->toDateString(),
        'delivery_slot' => '09:00 - 10:00',
        'items' => [
            [
                'custom_cake_id' => $customCake->id,
                'name' => 'Bánh đặt riêng #'.$customCake->id,
                'quantity' => 1,
                'price' => 650000,
            ],
        ],
    ])
        ->assertSuccessful()
        ->assertJsonPath('payment_method', 'cod');

    $customCake->refresh();

    expect($customCake->status)->toBe(CustomCake::STATUS_CONVERTED_TO_ORDER)
        ->and($customCake->converted_order_id)->not->toBeNull()
        ->and(DB::table('order_items')->where('custom_cake_id', $customCake->id)->exists())->toBeTrue();
});
