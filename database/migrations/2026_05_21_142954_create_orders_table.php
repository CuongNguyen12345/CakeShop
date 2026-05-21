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
        if (! Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('code', 50)->unique();
                $table->string('customer_name', 100);
                $table->string('customer_phone', 15);
                $table->string('customer_email', 100);
                $table->text('shipping_address');
                $table->string('customer_address');
                $table->string('customer_district', 100);
                $table->string('customer_note')->nullable();
                $table->date('delivery_date');
                $table->time('delivery_time')->default('00:00:00');
                $table->string('delivery_slot', 50);
                $table->decimal('total_amount', 10, 2);
                $table->unsignedInteger('amount');
                $table->string('payment_method', 50)->default('cod');
                $table->string('payment_status', 50)->default('pending');
                $table->string('order_status', 50)->default('Processing');
                $table->string('bank_code', 50)->nullable();
                $table->string('bank_account_number', 50)->nullable();
                $table->string('bank_account_name')->nullable();
                $table->string('transfer_content', 100)->nullable()->unique();
                $table->string('qr_url', 1000)->nullable();
                $table->timestamp('paid_at')->nullable();
                $table->dateTime('created_date')->useCurrent();

                $table->index(['payment_method', 'payment_status']);
            });

            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'code')) {
                $table->string('code', 50)->nullable()->unique()->after('id');
            }

            if (! Schema::hasColumn('orders', 'customer_email')) {
                $table->string('customer_email', 100)->nullable()->after('customer_phone');
            }

            if (! Schema::hasColumn('orders', 'customer_address')) {
                $table->string('customer_address')->nullable()->after('shipping_address');
            }

            if (! Schema::hasColumn('orders', 'customer_district')) {
                $table->string('customer_district', 100)->nullable()->after('customer_address');
            }

            if (! Schema::hasColumn('orders', 'customer_note')) {
                $table->string('customer_note')->nullable()->after('customer_district');
            }

            if (! Schema::hasColumn('orders', 'delivery_slot')) {
                $table->string('delivery_slot', 50)->nullable()->after('delivery_time');
            }

            if (! Schema::hasColumn('orders', 'amount')) {
                $table->unsignedInteger('amount')->nullable()->after('total_amount');
            }

            if (! Schema::hasColumn('orders', 'bank_code')) {
                $table->string('bank_code', 50)->nullable()->after('order_status');
            }

            if (! Schema::hasColumn('orders', 'bank_account_number')) {
                $table->string('bank_account_number', 50)->nullable()->after('bank_code');
            }

            if (! Schema::hasColumn('orders', 'bank_account_name')) {
                $table->string('bank_account_name')->nullable()->after('bank_account_number');
            }

            if (! Schema::hasColumn('orders', 'transfer_content')) {
                $table->string('transfer_content', 100)->nullable()->unique()->after('bank_account_name');
            }

            if (! Schema::hasColumn('orders', 'qr_url')) {
                $table->string('qr_url', 1000)->nullable()->after('transfer_content');
            }

            if (! Schema::hasColumn('orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('qr_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                foreach ([
                    'code',
                    'customer_email',
                    'customer_address',
                    'customer_district',
                    'customer_note',
                    'delivery_slot',
                    'amount',
                    'bank_code',
                    'bank_account_number',
                    'bank_account_name',
                    'transfer_content',
                    'qr_url',
                    'paid_at',
                ] as $column) {
                    if (Schema::hasColumn('orders', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
