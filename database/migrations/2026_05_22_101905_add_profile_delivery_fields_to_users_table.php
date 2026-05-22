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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'full_name')) {
                $table->string('full_name', 100)->nullable()->after('email');
            }

            if (! Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->after('full_name');
            }

            if (! Schema::hasColumn('users', 'delivery_address')) {
                $table->string('delivery_address', 255)->nullable()->after('phone_number');
            }

            if (! Schema::hasColumn('users', 'delivery_district')) {
                $table->string('delivery_district', 100)->nullable()->after('delivery_address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'delivery_district')) {
                $table->dropColumn('delivery_district');
            }

            if (Schema::hasColumn('users', 'delivery_address')) {
                $table->dropColumn('delivery_address');
            }

            if (Schema::hasColumn('users', 'phone_number')) {
                $table->dropColumn('phone_number');
            }

            if (Schema::hasColumn('users', 'full_name')) {
                $table->dropColumn('full_name');
            }
        });
    }
};
