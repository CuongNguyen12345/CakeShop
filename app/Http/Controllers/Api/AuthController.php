<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ForgotPasswordRequest;
use App\Http\Requests\Api\GoogleLoginRequest;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $userId = DB::table((new User)->getTable())->insertGetId([
            'username' => $request->string('username')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
            'role' => 'USER',
            'login_by_google' => false,
        ]);

        return response()->json([
            'message' => 'Dang ky thanh cong.',
            'user' => new UserResource(User::query()->findOrFail($userId)),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()
            ->where('username', $request->string('username')->toString())
            ->first();

        if (! $user || ! $user->password || ! Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Sai tên đăng nhập hoặc mật khẩu.'],
            ]);
        }

        return response()->json([
            'message' => 'Dang nhap thanh cong.',
            'user' => new UserResource($user),
        ]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $updated = DB::table((new User)->getTable())
            ->where('username', $request->string('username')->toString())
            ->where('email', $request->string('email')->toString())
            ->update([
                'password' => Hash::make($request->string('new_password')->toString()),
                'modified_date' => now(),
            ]);

        if ($updated === 0) {
            throw ValidationException::withMessages([
                'username' => ['Khong tim thay tai khoan phu hop.'],
            ]);
        }

        return response()->json([
            'message' => 'Dat lai mat khau thanh cong.',
        ]);
    }

    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        $clientId = trim((string) config('services.google.client_id'));

        if (! $clientId) {
            throw ValidationException::withMessages([
                'credential' => ['Chua cau hinh Google Client ID.'],
            ]);
        }

        $googleUser = $this->verifiedGoogleUser($request->string('credential')->toString(), $clientId);
        $table = (new User)->getTable();
        $username = $this->makeGoogleUsername($googleUser['email']);
        $existingUser = User::query()->where('email', $googleUser['email'])->first();

        if ($existingUser) {
            $usernameIsTaken = User::query()
                ->where('username', $username)
                ->where('id', '!=', $existingUser->id)
                ->exists();

            if ($usernameIsTaken) {
                $username = (string) $existingUser->username;
            }

            DB::table($table)
                ->where('id', $existingUser->id)
                ->update([
                    'username' => $username,
                    'email' => $googleUser['email'],
                    'role' => $existingUser->role ?: 'USER',
                    'login_by_google' => true,
                    'modified_date' => now(),
                ]);
        } else {
            if (User::query()->where('username', $username)->exists()) {
                throw ValidationException::withMessages([
                    'credential' => ['Ten dang nhap lay tu email Google da ton tai.'],
                ]);
            }

            DB::table($table)->insert([
                'username' => $username,
                'email' => $googleUser['email'],
                'password' => null,
                'role' => 'USER',
                'login_by_google' => true,
                'modified_date' => now(),
            ]);
        }

        $user = User::query()->where('email', $googleUser['email'])->firstOrFail();

        return response()->json([
            'message' => 'Dang nhap Google thanh cong.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * @return array{sub: string, email: string, name: string|null}
     */
    private function verifiedGoogleUser(string $credential, string $clientId): array
    {
        $response = Http::acceptJson()->get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $credential,
        ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'credential' => ['Google credential khong hop le.'],
            ]);
        }

        $payload = $response->json();
        $emailVerified = $payload['email_verified'] ?? false;

        if (($payload['aud'] ?? null) !== $clientId || ! in_array($emailVerified, [true, 'true', 1, '1'], true)) {
            throw ValidationException::withMessages([
                'credential' => ['Google credential khong hop le.'],
            ]);
        }

        $sub = (string) ($payload['sub'] ?? '');
        $email = (string) ($payload['email'] ?? '');

        if ($sub === '' || $email === '') {
            throw ValidationException::withMessages([
                'credential' => ['Google credential thieu thong tin tai khoan.'],
            ]);
        }

        return [
            'sub' => $sub,
            'email' => $email,
            'name' => isset($payload['name']) ? (string) $payload['name'] : null,
        ];
    }

    private function makeGoogleUsername(string $email): string
    {
        $username = Str::of($email)
            ->before('@')
            ->lower()
            ->trim()
            ->value() ?: 'google_user';

        return mb_substr($username, 0, 50);
    }
}
