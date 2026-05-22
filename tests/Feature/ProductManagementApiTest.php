<?php

use App\Models\Category;
use App\Models\Product;

it('paginates cake products', function () {
    Product::factory()->count(5)->create();

    $this->getJson('/api/products?per_page=2')
        ->assertSuccessful()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 5)
        ->assertJsonPath('meta.last_page', 3)
        ->assertJsonPath('links.next', fn (?string $url) => $url !== null && str_contains($url, 'page=2'));
});

it('returns all cake products when no listing filters are requested', function () {
    Product::factory()->count(11)->create();

    $this->getJson('/api/products')
        ->assertSuccessful()
        ->assertJsonCount(11, 'data')
        ->assertJsonMissingPath('meta.current_page');
});

it('filters cake products by keyword category and price range', function () {
    $birthdayCakes = Category::factory()->create([
        'name' => 'Birthday Cake',
        'slug' => 'birthday-cake',
    ]);
    $cheesecakes = Category::factory()->create([
        'name' => 'Cheesecake',
        'slug' => 'cheesecake',
    ]);

    $matchingProduct = Product::factory()->for($birthdayCakes)->create([
        'name' => 'Chocolate Birthday Cake',
        'description' => 'Rich cocoa cake',
        'price' => 350000,
    ]);
    Product::factory()->for($birthdayCakes)->create([
        'name' => 'Chocolate Premium Cake',
        'price' => 650000,
    ]);
    Product::factory()->for($cheesecakes)->create([
        'name' => 'Chocolate Cheesecake',
        'price' => 320000,
    ]);

    $this->getJson("/api/products?keyword=chocolate&category_id={$birthdayCakes->id}&min_price=300000&max_price=400000")
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $matchingProduct->id)
        ->assertJsonPath('data.0.name', 'Chocolate Birthday Cake')
        ->assertJsonPath('meta.total', 1);
});

it('finds cake products with accent insensitive keyword search', function () {
    $zodiacCategory = Category::factory()->create([
        'name' => '12 Cung Hoàng Đạo',
        'slug' => '12-cung-hoang-dao',
    ]);
    $matchingProduct = Product::factory()->for($zodiacCategory)->create([
        'name' => 'Cung Bọ Cạp',
        'price' => 125000,
        'is_available' => true,
    ]);
    Product::factory()->create([
        'name' => 'Cung Bảo Bình',
        'price' => 125000,
        'is_available' => true,
    ]);

    $this->getJson('/api/products?keyword=b%C3%B2%20c%E1%BA%A1p&is_available=1&per_page=10')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $matchingProduct->id)
        ->assertJsonPath('data.0.name', 'Cung Bọ Cạp')
        ->assertJsonPath('meta.total', 1);
});

it('filters cake products by maximum price without a minimum price', function () {
    $affordableProduct = Product::factory()->create([
        'name' => 'Mini Cupcake',
        'price' => 90000,
    ]);
    Product::factory()->create([
        'name' => 'Luxury Birthday Cake',
        'price' => 900000,
    ]);

    $this->getJson('/api/products?max_price=100000')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $affordableProduct->id)
        ->assertJsonPath('meta.total', 1);
});

it('paginates available cake products for the storefront menu', function () {
    Product::factory()->count(11)->create([
        'is_available' => true,
    ]);
    Product::factory()->count(2)->create([
        'is_available' => false,
    ]);

    $this->getJson('/api/products?is_available=1&per_page=10')
        ->assertSuccessful()
        ->assertJsonCount(10, 'data')
        ->assertJsonPath('meta.per_page', 10)
        ->assertJsonPath('meta.total', 11)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('data.0.is_available', true);
});

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
