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
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $userId = DB::table((new User)->getTable())->insertGetId([
            'username' => $request->string('username')->toString(),
            'password' => Hash::make($request->string('password')->toString()),
            'phone_number' => $request->string('phone_number')->toString(),
            'role' => 'User',
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

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
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
            ->where('phone_number', $request->string('phone_number')->toString())
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
        $table = (new User)->getTable();
        $username = $request->string('username')->toString();
        $existingUser = User::query()->where('username', $username)->first();

        if ($existingUser) {
            DB::table($table)
                ->where('id', $existingUser->id)
                ->update([
                    'phone_number' => $request->string('phone_number')->toString(),
                    'login_by_google' => true,
                    'modified_date' => now(),
                ]);
        } else {
            DB::table($table)->insert([
                'username' => $username,
                'phone_number' => $request->string('phone_number')->toString(),
                'role' => 'User',
                'login_by_google' => true,
                'modified_date' => now(),
            ]);
        }

        $user = User::query()->where('username', $username)->firstOrFail();

        return response()->json([
            'message' => 'Dang nhap Google thanh cong.',
            'user' => new UserResource($user),
        ]);
    }
}
