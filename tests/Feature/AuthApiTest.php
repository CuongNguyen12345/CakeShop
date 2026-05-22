<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table) {
        $table->increments('id');
        $table->string('username', 100)->unique();
        $table->string('email', 255)->nullable()->unique();
        $table->string('password')->nullable();
        $table->string('role')->default('USER');
        $table->boolean('login_by_google')->default(false);
        $table->dateTime('create_date')->useCurrent();
        $table->dateTime('modified_date')->useCurrent();
    });
});

it('registers a normal user with a hashed password', function () {
    $this->postJson('/api/register', [
        'username' => 'normal_user',
        'email' => 'normal@example.com',
        'password' => 'secret123',
    ])
        ->assertCreated()
        ->assertJsonPath('user.username', 'normal_user')
        ->assertJsonPath('user.email', 'normal@example.com')
        ->assertJsonPath('user.role', 'USER')
        ->assertJsonPath('user.login_by_google', false);

    $storedUser = DB::table('users')->where('username', 'normal_user')->first();

    expect($storedUser->password)->not->toBe('secret123')
        ->and(Hash::check('secret123', $storedUser->password))->toBeTrue()
        ->and($storedUser->email)->toBe('normal@example.com')
        ->and($storedUser->role)->toBe('USER')
        ->and((bool) $storedUser->login_by_google)->toBeFalse();
});

it('logs in with username and password', function () {
    DB::table('users')->insert([
        'username' => 'login_user',
        'email' => 'login@example.com',
        'password' => Hash::make('secret123'),
        'role' => 'USER',
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
        'email' => 'login@example.com',
        'password' => Hash::make('secret123'),
        'role' => 'USER',
        'login_by_google' => false,
    ]);

    $this->postJson('/api/login', [
        'username' => 'login_user',
        'password' => 'wrong-password',
    ])
        ->assertInvalid(['username'])
        ->assertJsonPath('errors.username.0', 'Sai tên đăng nhập hoặc mật khẩu.');
});

it('resets a password using username and email', function () {
    DB::table('users')->insert([
        'username' => 'forgot_user',
        'email' => 'forgot@example.com',
        'password' => Hash::make('old-secret'),
        'role' => 'USER',
        'login_by_google' => false,
    ]);

    $this->postJson('/api/forgot-password', [
        'username' => 'forgot_user',
        'email' => 'forgot@example.com',
        'new_password' => 'new-secret',
    ])->assertSuccessful();

    $storedUser = DB::table('users')->where('username', 'forgot_user')->first();

    expect(Hash::check('new-secret', $storedUser->password))->toBeTrue();
});

it('creates a google login user from a verified google credential', function () {
    config()->set('services.google.client_id', 'google-client-id.test');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'google-client-id.test',
            'sub' => '109876543210987654321',
            'email' => 'google.user@example.com',
            'email_verified' => 'true',
            'name' => 'Google User',
        ]),
    ]);

    $this->postJson('/api/login/google', [
        'credential' => 'valid-google-id-token',
    ])
        ->assertSuccessful()
        ->assertJsonPath('user.username', 'google.user')
        ->assertJsonPath('user.login_by_google', true);

    $storedUser = DB::table('users')->where('username', 'google.user')->first();

    expect($storedUser->password)->toBeNull()
        ->and($storedUser->email)->toBe('google.user@example.com')
        ->and($storedUser->role)->toBe('USER')
        ->and((bool) $storedUser->login_by_google)->toBeTrue();
});

it('normalizes an existing google user username from the email local part', function () {
    config()->set('services.google.client_id', 'google-client-id.test');

    DB::table('users')->insert([
        'username' => 'nguyencuong11112004_283497917',
        'email' => 'nguyencuong11112004@gmail.com',
        'password' => null,
        'role' => 'USER',
        'login_by_google' => true,
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'google-client-id.test',
            'sub' => '109876543210987654321',
            'email' => 'nguyencuong11112004@gmail.com',
            'email_verified' => 'true',
            'name' => 'Nguyen Cuong',
        ]),
    ]);

    $this->postJson('/api/login/google', [
        'credential' => 'valid-google-id-token',
    ])
        ->assertSuccessful()
        ->assertJsonPath('user.username', 'nguyencuong11112004')
        ->assertJsonPath('user.login_by_google', true);

    expect(DB::table('users')->where('username', 'nguyencuong11112004')->exists())->toBeTrue()
        ->and(DB::table('users')->where('username', 'nguyencuong11112004_283497917')->exists())->toBeFalse();
});

it('rejects a google credential for a different client id', function () {
    config()->set('services.google.client_id', 'google-client-id.test');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'other-client-id.test',
            'sub' => '109876543210987654321',
            'email' => 'google.user@example.com',
            'email_verified' => 'true',
            'name' => 'Google User',
        ]),
    ]);

    $this->postJson('/api/login/google', [
        'credential' => 'wrong-audience-token',
    ])
        ->assertInvalid(['credential']);
});
