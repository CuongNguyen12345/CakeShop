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
        Schema::create('sepay_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('order_id')->nullable()->index();
            $table->string('sepay_transaction_id', 100)->unique();
            $table->string('transfer_type', 10);
            $table->unsignedInteger('transfer_amount');
            $table->string('content', 1000)->nullable();
            $table->string('reference_code', 255)->nullable();
            $table->json('payload');
            $table->timestamps();
            $table->index(['transfer_type', 'transfer_amount']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sepay_transactions');
    }
};
