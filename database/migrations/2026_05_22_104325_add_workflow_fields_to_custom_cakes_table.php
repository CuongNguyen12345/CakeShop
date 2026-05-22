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
        if (! Schema::hasTable('custom_cakes')) {
            Schema::create('custom_cakes', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('customer_name', 100)->nullable();
                $table->string('customer_phone', 20)->nullable();
                $table->string('cake_size', 50)->nullable();
                $table->string('flavor', 100)->nullable();
                $table->unsignedSmallInteger('servings')->nullable();
                $table->date('desired_date')->nullable();
                $table->decimal('budget', 10, 2)->nullable();
                $table->string('text_on_cake')->nullable();
                $table->text('accessories')->nullable();
                $table->string('reference_image_url')->nullable();
                $table->text('note')->nullable();
                $table->decimal('estimated_price', 10, 2)->nullable();
                $table->string('status', 50)->default('pending_review')->index();
                $table->text('admin_note')->nullable();
                $table->timestamp('quoted_at')->nullable();
                $table->unsignedBigInteger('converted_order_id')->nullable()->index();
                $table->timestamps();
            });

            return;
        }

        Schema::table('custom_cakes', function (Blueprint $table) {
            if (! Schema::hasColumn('custom_cakes', 'customer_name')) {
                $table->string('customer_name', 100)->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('custom_cakes', 'customer_phone')) {
                $table->string('customer_phone', 20)->nullable()->after('customer_name');
            }

            if (! Schema::hasColumn('custom_cakes', 'servings')) {
                $table->unsignedSmallInteger('servings')->nullable()->after('flavor');
            }

            if (! Schema::hasColumn('custom_cakes', 'desired_date')) {
                $table->date('desired_date')->nullable()->after('servings');
            }

            if (! Schema::hasColumn('custom_cakes', 'budget')) {
                $table->decimal('budget', 10, 2)->nullable()->after('desired_date');
            }

            if (! Schema::hasColumn('custom_cakes', 'status')) {
                $table->string('status', 50)->default('pending_review')->index()->after('estimated_price');
            }

            if (! Schema::hasColumn('custom_cakes', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('status');
            }

            if (! Schema::hasColumn('custom_cakes', 'quoted_at')) {
                $table->timestamp('quoted_at')->nullable()->after('admin_note');
            }

            if (! Schema::hasColumn('custom_cakes', 'converted_order_id')) {
                $table->unsignedBigInteger('converted_order_id')->nullable()->index()->after('quoted_at');
            }

            if (! Schema::hasColumn('custom_cakes', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('custom_cakes')) {
            return;
        }

        Schema::table('custom_cakes', function (Blueprint $table) {
            foreach ([
                'customer_name',
                'customer_phone',
                'servings',
                'desired_date',
                'budget',
                'status',
                'admin_note',
                'quoted_at',
                'converted_order_id',
                'created_at',
                'updated_at',
            ] as $column) {
                if (Schema::hasColumn('custom_cakes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
