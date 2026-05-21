<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $products = Product::query()
            ->with('category')
            ->latest('id')
            ->get();

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::query()->create([
            ...$request->safe()->only([
                'category_id',
                'name',
                'description',
                'price',
                'image_url',
                'size_inch',
                'stock_quantity',
                'tag',
            ]),
            'is_available' => $request->boolean('is_available', true),
        ]);

        return response()->json([
            'message' => 'Tao san pham thanh cong.',
            'product' => new ProductResource($product->load('category')),
        ], 201);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load('category'));
    }

    public function update(StoreProductRequest $request, Product $product): ProductResource
    {
        $product->update([
            ...$request->safe()->only([
                'category_id',
                'name',
                'description',
                'price',
                'image_url',
                'size_inch',
                'stock_quantity',
                'tag',
            ]),
            'is_available' => $request->boolean('is_available', true),
        ]);

        return new ProductResource($product->load('category'));
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => 'Da xoa san pham.',
        ]);
    }
}
