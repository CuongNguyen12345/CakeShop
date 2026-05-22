<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateUserProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(): AnonymousResourceCollection
    {
        $safeColumns = collect(Schema::getColumnListing((new User)->getTable()))
            ->intersect([
                'id',
                'name',
                'email',
                'username',
                'full_name',
                'phone_number',
                'delivery_address',
                'delivery_district',
                'role',
                'login_by_google',
                'created_at',
                'updated_at',
                'create_date',
                'modified_date',
            ])
            ->values()
            ->all();

        $users = User::query()
            ->select($safeColumns)
            ->latest('id')
            ->get();

        return UserResource::collection($users);
    }

    public function update(UpdateUserProfileRequest $request, User $user): JsonResponse
    {
        $safeColumns = collect(Schema::getColumnListing($user->getTable()))
            ->intersect([
                'name',
                'username',
                'email',
                'full_name',
                'phone_number',
                'delivery_address',
                'delivery_district',
                'modified_date',
                'updated_at',
            ]);

        $updates = collect($request->validated())
            ->only($safeColumns->all())
            ->map(fn (?string $value): ?string => is_string($value) ? trim($value) ?: null : $value)
            ->all();

        if ($safeColumns->contains('modified_date')) {
            $updates['modified_date'] = now();
        }

        if ($safeColumns->contains('updated_at')) {
            $updates['updated_at'] = now();
        }

        DB::table($user->getTable())
            ->where('id', $user->id)
            ->update($updates);

        return response()->json([
            'message' => 'Da cap nhat thong tin tai khoan.',
            'user' => new UserResource(User::query()->findOrFail($user->id)),
        ]);
    }
}
