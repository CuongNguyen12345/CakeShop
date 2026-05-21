<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table) {
        $table->increments('id');
        $table->string('username', 100)->unique();
        $table->string('password')->nullable();
        $table->string('role')->default('User');
        $table->boolean('login_by_google')->default(false);
        $table->dateTime('create_date')->useCurrent();
        $table->dateTime('modified_date')->useCurrent();
        $table->string('phone_number', 20);
    });
});

it('registers a normal user with a hashed password', function () {
    $this->postJson('/api/register', [
        'username' => 'normal_user',
        'phone_number' => '0900000003',
        'password' => 'secret123',
    ])
        ->assertCreated()
        ->assertJsonPath('user.username', 'normal_user')
        ->assertJsonPath('user.login_by_google', false);

    $storedUser = DB::table('users')->where('username', 'normal_user')->first();

    expect($storedUser->password)->not->toBe('secret123')
        ->and(Hash::check('secret123', $storedUser->password))->toBeTrue()
        ->and((bool) $storedUser->login_by_google)->toBeFalse();
});

it('logs in with username and password', function () {
    DB::table('users')->insert([
        'username' => 'login_user',
        'phone_number' => '0900000004',
        'password' => Hash::make('secret123'),
        'role' => 'User',
        'login_by_google' => false,
    ]);

    $this->postJson('/api/login', [
        'username' => 'login_user',
        'password' => 'secret123',
    ])
        ->assertSuccessful()
        ->assertJsonPath('user.username', 'login_user')
        ->assertJsonMissingPath('user.password');
});

it('rejects invalid login credentials', function () {
    DB::table('users')->insert([
        'username' => 'login_user',
        'phone_number' => '0900000004',
        'password' => Hash::make('secret123'),
        'role' => 'User',
        'login_by_google' => false,
    ]);

    $this->postJson('/api/login', [
        'username' => 'login_user',
        'password' => 'wrong-password',
    ])
        ->assertInvalid(['username'])
        ->assertJsonPath('errors.username.0', 'Sai tên đăng nhập hoặc mật khẩu.');
});

it('resets a password using username and phone number', function () {
    DB::table('users')->insert([
        'username' => 'forgot_user',
        'phone_number' => '0900000005',
        'password' => Hash::make('old-secret'),
        'role' => 'User',
        'login_by_google' => false,
    ]);

    $this->postJson('/api/forgot-password', [
        'username' => 'forgot_user',
        'phone_number' => '0900000005',
        'new_password' => 'new-secret',
    ])->assertSuccessful();

    $storedUser = DB::table('users')->where('username', 'forgot_user')->first();

    expect(Hash::check('new-secret', $storedUser->password))->toBeTrue();
});

it('creates a google login user with login by google enabled', function () {
    $this->postJson('/api/login/google', [
        'username' => 'google_user',
        'phone_number' => '0900000006',
    ])
        ->assertSuccessful()
        ->assertJsonPath('user.username', 'google_user')
        ->assertJsonPath('user.login_by_google', true);

    $storedUser = DB::table('users')->where('username', 'google_user')->first();

    expect($storedUser->password)->toBeNull()
        ->and((bool) $storedUser->login_by_google)->toBeTrue();
});
