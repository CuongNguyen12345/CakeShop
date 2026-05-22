<?php

use App\Models\Product;
use Illuminate\Support\Facades\DB;

it('toggles a cake product in a user wishlist', function () {
    $userId = DB::table('users')->insertGetId([
        'name' => 'Nguyen Van A',
        'email' => 'nguyenvana@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $product = Product::factory()->create([
        'name' => 'Sakura Mousse Cake',
        'price' => 185000,
    ]);

    $this->postJson('/api/wishlists/toggle', [
        'user_id' => $userId,
        'product_id' => $product->id,
    ])
        ->assertSuccessful()
        ->assertJsonPath('is_favorite', true)
        ->assertJsonPath('product.id', $product->id);

    $this->assertDatabaseHas('wishlists', [
        'user_id' => $userId,
        'product_id' => $product->id,
    ]);

    $this->postJson('/api/wishlists/toggle', [
        'user_id' => $userId,
        'product_id' => $product->id,
    ])
        ->assertSuccessful()
        ->assertJsonPath('is_favorite', false);

    $this->assertDatabaseMissing('wishlists', [
        'user_id' => $userId,
        'product_id' => $product->id,
    ]);
});

it('lists favorite cakes for a user', function () {
    $userId = DB::table('users')->insertGetId([
        'name' => 'Nguyen Van A',
        'email' => 'nguyenvana@example.com',
        'password' => 'secret',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    $favoriteProduct = Product::factory()->create([
        'name' => 'Blueberry Cheesecake',
        'price' => 220000,
    ]);
    $otherProduct = Product::factory()->create([
        'name' => 'Matcha Lavender Roll',
    ]);

    DB::table('wishlists')->insert([
        'user_id' => $userId,
        'product_id' => $favoriteProduct->id,
    ]);

    $this->getJson("/api/wishlists?user_id={$userId}")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $favoriteProduct->id)
        ->assertJsonPath('data.0.name', 'Blueberry Cheesecake')
        ->assertJsonMissingPath('data.1')
        ->assertJsonMissing(['id' => $otherProduct->id]);
});
