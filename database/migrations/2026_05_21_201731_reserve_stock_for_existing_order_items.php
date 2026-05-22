<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('order_items')
            ->select('product_id', DB::raw('SUM(quantity) as reserved_quantity'))
            ->whereNotNull('product_id')
            ->groupBy('product_id')
            ->orderBy('product_id')
            ->get()
            ->each(function (object $reservedItem): void {
                DB::table('products')
                    ->where('id', $reservedItem->product_id)
                    ->update([
                        'stock_quantity' => DB::raw('GREATEST(stock_quantity - '.(int) $reservedItem->reserved_quantity.', 0)'),
                    ]);
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('order_items')
            ->select('product_id', DB::raw('SUM(quantity) as reserved_quantity'))
            ->whereNotNull('product_id')
            ->groupBy('product_id')
            ->orderBy('product_id')
            ->get()
            ->each(function (object $reservedItem): void {
                DB::table('products')
                    ->where('id', $reservedItem->product_id)
                    ->increment('stock_quantity', (int) $reservedItem->reserved_quantity);
            });
    }
};
