<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('order_items')) {
            Schema::create('order_items', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedBigInteger('order_id')->nullable()->index();
                $table->unsignedInteger('product_id')->nullable()->index();
                $table->unsignedInteger('custom_cake_id')->nullable()->index();
                $table->string('item_name', 155);
                $table->text('item_description')->nullable();
                $table->string('item_image_url')->nullable();
                $table->unsignedInteger('quantity');
                $table->decimal('price', 10, 2);

                $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
                $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            });

            return;
        }

        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'item_name')) {
                $table->string('item_name', 155)->nullable()->after('custom_cake_id');
            }

            if (! Schema::hasColumn('order_items', 'item_description')) {
                $table->text('item_description')->nullable()->after('item_name');
            }

            if (! Schema::hasColumn('order_items', 'item_image_url')) {
                $table->string('item_image_url')->nullable()->after('item_description');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) {
            foreach (['item_image_url', 'item_description', 'item_name'] as $column) {
                if (Schema::hasColumn('order_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
