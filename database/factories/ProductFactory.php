<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(90000, 650000),
            'image_url' => fake()->imageUrl(640, 480, 'cake'),
            'size_inch' => fake()->randomElement([4, 6, 8, 10]),
            'stock_quantity' => fake()->numberBetween(0, 50),
            'tag' => fake()->randomElement(['Moi', 'Best Seller', 'Dat truoc']),
            'is_available' => true,
        ];
    }
}
