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
        DB::table('orders')
            ->whereNull('order_status')
            ->orWhereIn('order_status', ['Processing', 'Pending'])
            ->update(['order_status' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('orders')
            ->where('order_status', 'pending')
            ->update(['order_status' => 'Processing']);
    }
};
