<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListWishlistRequest;
use App\Http\Requests\Api\ToggleWishlistRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    public function index(ListWishlistRequest $request): AnonymousResourceCollection
    {
        $productIds = DB::table('wishlists')
            ->where('user_id', $request->integer('user_id'))
            ->pluck('product_id');

        $products = Product::query()
            ->with('category')
            ->whereIn('id', $productIds)
            ->orderByDesc('id')
            ->get();

        return ProductResource::collection($products);
    }

    public function toggle(ToggleWishlistRequest $request): JsonResponse
    {
        $userId = $request->integer('user_id');
        $productId = $request->integer('product_id');
        $wishlistQuery = DB::table('wishlists')
            ->where('user_id', $userId)
            ->where('product_id', $productId);

        if ($wishlistQuery->exists()) {
            $wishlistQuery->delete();
            $isFavorite = false;
        } else {
            DB::table('wishlists')->insert([
                'user_id' => $userId,
                'product_id' => $productId,
            ]);
            $isFavorite = true;
        }

        $product = Product::query()->with('category')->findOrFail($productId);

        return response()->json([
            'message' => $isFavorite ? 'Da them vao wishlist.' : 'Da xoa khoi wishlist.',
            'is_favorite' => $isFavorite,
            'product' => (new ProductResource($product))->resolve(),
        ]);
    }
}
