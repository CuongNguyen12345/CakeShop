<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListProductsRequest;
use App\Http\Requests\Api\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(ListProductsRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        $products = Product::query()
            ->with('category')
            ->when($filters['category_id'] ?? null, function (Builder $query, int $categoryId): void {
                $query->where('category_id', $categoryId);
            })
            ->when($filters['min_price'] ?? null, function (Builder $query, string|int|float $minimumPrice): void {
                $query->where('price', '>=', $minimumPrice);
            })
            ->when($filters['max_price'] ?? null, function (Builder $query, string|int|float $maximumPrice): void {
                $query->where('price', '<=', $maximumPrice);
            })
            ->latest('id');

        if (array_key_exists('is_available', $filters)) {
            $products->where('is_available', $request->boolean('is_available'));
        }

        if (! $request->shouldPaginate()) {
            return ProductResource::collection($products->get());
        }

        if ($filters['keyword'] ?? null) {
            $filteredProducts = $this->filterProductsByKeyword($products->get(), $filters['keyword']);

            return ProductResource::collection($this->paginateCollection($filteredProducts, $request));
        }

        return ProductResource::collection($products->paginate($request->perPage())->withQueryString());
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

    /**
     * @param  Collection<int, Product>  $products
     * @return Collection<int, Product>
     */
    private function filterProductsByKeyword(Collection $products, string $keyword): Collection
    {
        $normalizedKeyword = $this->normalizeSearchText($keyword);

        return $products
            ->filter(fn (Product $product): bool => $this->productMatchesKeyword($product, $normalizedKeyword))
            ->values();
    }

    private function productMatchesKeyword(Product $product, string $normalizedKeyword): bool
    {
        return collect([
            $product->name,
            $product->description,
            $product->tag,
            $product->category?->name,
        ])->contains(fn (?string $value): bool => str_contains($this->normalizeSearchText($value ?? ''), $normalizedKeyword));
    }

    private function normalizeSearchText(string $value): string
    {
        return Str::of($value)->ascii()->lower()->squish()->toString();
    }

    /**
     * @param  Collection<int, Product>  $products
     */
    private function paginateCollection(Collection $products, ListProductsRequest $request): LengthAwarePaginator
    {
        $currentPage = max(1, $request->integer('page', 1));

        return (new LengthAwarePaginator(
            $products->forPage($currentPage, $request->perPage())->values(),
            $products->count(),
            $request->perPage(),
            $currentPage,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'pageName' => 'page',
            ],
        ))->withQueryString();
    }
}
