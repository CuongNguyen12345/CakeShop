<?php

use App\Models\User;

it('returns users through the api', function () {
    $users = User::factory()
        ->count(2)
        ->sequence(
            ['name' => 'Alice Tester', 'email' => 'alice@example.com'],
            ['name' => 'Bob Tester', 'email' => 'bob@example.com'],
        )
        ->create();

    $this->getJson('/api/users')
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment([
            'name' => $users->first()->name,
            'email' => $users->first()->email,
        ])
        ->assertJsonMissingPath('data.0.password')
        ->assertJsonMissingPath('data.0.remember_token');
});

it('updates profile and delivery information through the api', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
    ]);

    $this->patchJson("/api/users/{$user->id}/profile", [
        'name' => 'Nguyen Van A',
        'full_name' => 'Nguyen Van A',
        'email' => 'customer@example.com',
        'phone_number' => '0901234567',
        'delivery_address' => '12 Nguyen Trai',
        'delivery_district' => 'Quan 1',
    ])
        ->assertSuccessful()
        ->assertJsonPath('user.name', 'Nguyen Van A')
        ->assertJsonPath('user.full_name', 'Nguyen Van A')
        ->assertJsonPath('user.email', 'customer@example.com')
        ->assertJsonPath('user.phone_number', '0901234567')
        ->assertJsonPath('user.delivery_address', '12 Nguyen Trai')
        ->assertJsonPath('user.delivery_district', 'Quan 1');

    $user->refresh();

    expect($user->full_name)->toBe('Nguyen Van A')
        ->and($user->phone_number)->toBe('0901234567')
        ->and($user->delivery_address)->toBe('12 Nguyen Trai')
        ->and($user->delivery_district)->toBe('Quan 1');
});
