<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
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
}
