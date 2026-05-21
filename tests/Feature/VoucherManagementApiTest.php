<?php

use App\Models\Voucher;

it('creates a voucher', function () {
    $this->postJson('/api/vouchers', [
        'code' => ' cake10 ',
        'discount_percent' => 10,
        'usage_limit' => 5,
        'is_active' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('voucher.code', 'CAKE10')
        ->assertJsonPath('voucher.discount_percent', 10)
        ->assertJsonPath('voucher.remaining_uses', 5);

    $this->assertDatabaseHas('vouchers', [
        'code' => 'CAKE10',
        'discount_percent' => 10,
        'usage_limit' => 5,
        'used_count' => 0,
        'is_active' => true,
    ]);
});

it('updates a voucher', function () {
    $voucher = Voucher::factory()->create([
        'code' => 'CAKE10',
        'discount_percent' => 10,
        'usage_limit' => 5,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $this->putJson("/api/vouchers/{$voucher->id}", [
        'code' => 'cake20',
        'discount_percent' => 20,
        'usage_limit' => 8,
        'used_count' => 2,
        'is_active' => false,
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.code', 'CAKE20')
        ->assertJsonPath('data.discount_percent', 20)
        ->assertJsonPath('data.remaining_uses', 6)
        ->assertJsonPath('data.is_active', false);

    $this->assertDatabaseHas('vouchers', [
        'id' => $voucher->id,
        'code' => 'CAKE20',
        'discount_percent' => 20,
        'usage_limit' => 8,
        'used_count' => 2,
        'is_active' => false,
    ]);
});

it('applies an active voucher to a subtotal', function () {
    Voucher::factory()->create([
        'code' => 'SAVE15',
        'discount_percent' => 15,
        'usage_limit' => 10,
        'used_count' => 3,
        'is_active' => true,
    ]);

    $this->postJson('/api/vouchers/apply', [
        'code' => 'save15',
        'subtotal' => 200000,
    ])
        ->assertSuccessful()
        ->assertJsonPath('voucher.code', 'SAVE15')
        ->assertJsonPath('discount_amount', 30000)
        ->assertJsonPath('total', 170000);
});

it('rejects inactive or fully used vouchers', function () {
    Voucher::factory()->create([
        'code' => 'DONE',
        'discount_percent' => 50,
        'usage_limit' => 2,
        'used_count' => 2,
        'is_active' => true,
    ]);

    $this->postJson('/api/vouchers/apply', [
        'code' => 'DONE',
        'subtotal' => 200000,
    ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Ma giam gia khong hop le hoac da het luot su dung.');
});

it('deletes a voucher', function () {
    $voucher = Voucher::factory()->create();

    $this->deleteJson("/api/vouchers/{$voucher->id}")
        ->assertSuccessful()
        ->assertJsonPath('message', 'Da xoa voucher.');

    $this->assertDatabaseMissing('vouchers', [
        'id' => $voucher->id,
    ]);
});
