<?php

use App\Models\Category;
use App\Models\Product;

it('creates a cake category', function () {
    $this->postJson('/api/categories', [
        'name' => 'Mousse cake',
    ])
        ->assertCreated()
        ->assertJsonPath('category.name', 'Mousse cake')
        ->assertJsonPath('category.slug', 'mousse-cake');

    $this->assertDatabaseHas('categories', [
        'name' => 'Mousse cake',
        'slug' => 'mousse-cake',
    ]);
});

it('creates a cake product in a category', function () {
    $category = Category::factory()->create([
        'name' => 'Cheesecake',
        'slug' => 'cheesecake',
    ]);

    $this->postJson('/api/products', [
        'category_id' => $category->id,
        'name' => 'Blueberry Cheesecake',
        'description' => 'Banh cheesecake viet quat.',
        'price' => 220000,
        'image_url' => 'https://example.com/blueberry.jpg',
        'size_inch' => 6,
        'stock_quantity' => 12,
        'tag' => 'Best Seller',
        'is_available' => true,
    ])
        ->assertCreated()
        ->assertJsonPath('product.name', 'Blueberry Cheesecake')
        ->assertJsonPath('product.category.name', 'Cheesecake')
        ->assertJsonPath('product.stock_quantity', 12)
        ->assertJsonPath('product.price_formatted', '220.000đ');

    $this->assertDatabaseHas('products', [
        'category_id' => $category->id,
        'name' => 'Blueberry Cheesecake',
        'price' => 220000,
        'stock_quantity' => 12,
    ]);
});

it('updates cake product stock quantity', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create([
        'stock_quantity' => 5,
    ]);

    $this->putJson("/api/products/{$product->id}", [
        'category_id' => $category->id,
        'name' => $product->name,
        'description' => $product->description,
        'price' => $product->price,
        'image_url' => $product->image_url,
        'size_inch' => $product->size_inch,
        'stock_quantity' => 25,
        'tag' => $product->tag,
        'is_available' => true,
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.stock_quantity', 25);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'stock_quantity' => 25,
    ]);
});

it('updates cake product details', function () {
    $category = Category::factory()->create();
    $newCategory = Category::factory()->create([
        'name' => 'Birthday Cake',
        'slug' => 'birthday-cake',
    ]);
    $product = Product::factory()->for($category)->create([
        'name' => 'Old Cake Name',
        'price' => 100000,
    ]);

    $this->putJson("/api/products/{$product->id}", [
        'category_id' => $newCategory->id,
        'name' => 'Chocolate Birthday Cake',
        'description' => 'Banh sinh nhat chocolate.',
        'price' => 350000,
        'image_url' => 'https://example.com/chocolate.jpg',
        'size_inch' => 8,
        'stock_quantity' => 9,
        'tag' => 'Moi',
        'is_available' => false,
    ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Chocolate Birthday Cake')
        ->assertJsonPath('data.category.name', 'Birthday Cake')
        ->assertJsonPath('data.is_available', false);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'category_id' => $newCategory->id,
        'name' => 'Chocolate Birthday Cake',
        'price' => 350000,
        'size_inch' => 8,
        'stock_quantity' => 9,
        'is_available' => false,
    ]);
});

it('deletes related cake products when deleting a category', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->for($category)->create();

    $this->deleteJson("/api/categories/{$category->id}")
        ->assertSuccessful()
        ->assertJsonPath('message', 'Da xoa danh muc va cac san pham lien quan.');

    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);

    $this->assertDatabaseMissing('products', [
        'id' => $product->id,
    ]);
});
