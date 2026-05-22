<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $addedEmail = false;

        if (! Schema::hasColumn('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('email')->nullable()->after('username');
            });

            $addedEmail = true;
        }

        if (Schema::hasColumn('users', 'username')) {
            DB::table('users')
                ->whereNull('email')
                ->orWhere('email', '')
                ->orderBy('id')
                ->get(['id', 'username'])
                ->each(function (object $user): void {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'email' => $user->username.'+legacy'.$user->id.'@local.invalid',
                        ]);
                });
        }

        if (Schema::hasColumn('users', 'role')) {
            DB::table('users')
                ->whereNull('role')
                ->orWhere('role', '')
                ->update(['role' => 'USER']);
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'email')) {
                $table->string('email')->nullable()->change();
            }

            if (Schema::hasColumn('users', 'password')) {
                $table->string('password')->nullable()->change();
            }

            if (Schema::hasColumn('users', 'role')) {
                $table->string('role', 20)->default('USER')->change();
            }
        });

        if (Schema::hasColumn('users', 'phone_number')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('phone_number');
            });
        }

        if ($addedEmail) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('email');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->after('login_by_google');
            }

            if (Schema::hasColumn('users', 'email')) {
                $table->dropUnique(['email']);
                $table->dropColumn('email');
            }

            if (Schema::hasColumn('users', 'role')) {
                $table->string('role', 20)->nullable()->default('User')->change();
            }
        });
    }
};
