<?php

use App\Models\Category;
use App\Models\Product;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the clicked cake detail with related products', function () {
    $category = Category::factory()->create([
        'name' => 'Mousse Cake',
        'slug' => 'mousse-cake',
    ]);
    $product = Product::factory()->for($category)->create([
        'name' => 'Sakura Mousse Cake',
        'description' => 'Kem tuoi hoa anh dao',
        'price' => 185000,
        'size_inch' => 6,
        'stock_quantity' => 8,
        'tag' => 'Ban chay',
        'is_available' => true,
    ]);
    $relatedProduct = Product::factory()->for($category)->create([
        'name' => 'Blueberry Mousse Cake',
        'is_available' => true,
    ]);
    Product::factory()->for($category)->create([
        'name' => 'Hidden Mousse Cake',
        'is_available' => false,
    ]);

    $this->get("/products/{$product->id}")
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('bakery/product-detail')
            ->where('product.id', $product->id)
            ->where('product.name', 'Sakura Mousse Cake')
            ->where('product.category.name', 'Mousse Cake')
            ->where('product.price_formatted', '185.000đ')
            ->has('relatedProducts', 1)
            ->where('relatedProducts.0.id', $relatedProduct->id)
        );
});
