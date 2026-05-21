<?php

namespace Database\Factories;

use App\Models\Voucher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Voucher>
 */
class VoucherFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('CAKE##??')),
            'discount_percent' => fake()->numberBetween(5, 50),
            'usage_limit' => fake()->numberBetween(5, 100),
            'used_count' => 0,
            'is_active' => true,
        ];
    }
}
