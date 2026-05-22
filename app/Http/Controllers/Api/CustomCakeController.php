<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCustomCakeRequest;
use App\Http\Requests\Api\UpdateCustomCakeRequest;
use App\Http\Resources\CustomCakeResource;
use App\Models\CustomCake;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class CustomCakeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $customCakes = CustomCake::query()
            ->with('user')
            ->when($request->integer('user_id'), function (Builder $query, int $userId): void {
                $query->where('user_id', $userId);
            })
            ->when($request->filled('status'), function (Builder $query) use ($request): void {
                $query->where('status', $request->string('status')->toString());
            })
            ->latest('id')
            ->get();

        return CustomCakeResource::collection($customCakes)->additional([
            'statuses' => CustomCake::statusLabels(),
        ]);
    }

    public function store(StoreCustomCakeRequest $request): JsonResponse
    {
        $referenceImageUrl = null;

        if ($request->hasFile('reference_image')) {
            $path = $request->file('reference_image')->store('custom-cakes', 'public');
            $referenceImageUrl = Storage::disk('public')->url($path);
        }

        $customCake = CustomCake::query()->create([
            ...$request->safe()->only([
                'user_id',
                'customer_name',
                'customer_phone',
                'cake_size',
                'flavor',
                'servings',
                'desired_date',
                'budget',
                'text_on_cake',
                'accessories',
                'note',
            ]),
            'reference_image_url' => $referenceImageUrl,
            'status' => CustomCake::STATUS_PENDING_REVIEW,
        ]);

        return response()->json([
            'message' => 'Da gui yeu cau dat banh rieng.',
            'custom_cake' => new CustomCakeResource($customCake),
        ], 201);
    }

    public function show(CustomCake $customCake): CustomCakeResource
    {
        return new CustomCakeResource($customCake->load('user'));
    }

    public function update(UpdateCustomCakeRequest $request, CustomCake $customCake): CustomCakeResource
    {
        $validated = $request->validated();
        $status = (string) $validated['status'];

        $customCake->update([
            'status' => $status,
            'estimated_price' => $validated['estimated_price'] ?? $customCake->estimated_price,
            'admin_note' => $validated['admin_note'] ?? null,
            'quoted_at' => $status === CustomCake::STATUS_QUOTED ? now() : $customCake->quoted_at,
        ]);

        return new CustomCakeResource($customCake->refresh()->load('user'));
    }

    public function destroy(CustomCake $customCake): JsonResponse
    {
        $customCake->delete();

        return response()->json([
            'message' => 'Da xoa yeu cau dat banh rieng.',
        ]);
    }
}
