<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ApplyVoucherRequest;
use App\Http\Requests\Api\StoreVoucherRequest;
use App\Http\Requests\Api\UpdateVoucherRequest;
use App\Http\Resources\VoucherResource;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VoucherController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $vouchers = Voucher::query()
            ->latest('id')
            ->get();

        return VoucherResource::collection($vouchers);
    }

    public function store(StoreVoucherRequest $request): JsonResponse
    {
        $voucher = Voucher::query()->create([
            ...$request->safe()->only([
                'code',
                'discount_percent',
                'usage_limit',
                'used_count',
            ]),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return response()->json([
            'message' => 'Tao voucher thanh cong.',
            'voucher' => new VoucherResource($voucher),
        ], 201);
    }

    public function show(Voucher $voucher): VoucherResource
    {
        return new VoucherResource($voucher);
    }

    public function update(UpdateVoucherRequest $request, Voucher $voucher): VoucherResource
    {
        $voucher->update([
            ...$request->safe()->only([
                'code',
                'discount_percent',
                'usage_limit',
                'used_count',
            ]),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return new VoucherResource($voucher);
    }

    public function destroy(Voucher $voucher): JsonResponse
    {
        $voucher->delete();

        return response()->json([
            'message' => 'Da xoa voucher.',
        ]);
    }

    public function apply(ApplyVoucherRequest $request): JsonResponse
    {
        $voucher = Voucher::query()
            ->where('code', (string) $request->input('code'))
            ->first();

        if (! $voucher || ! $voucher->canBeApplied()) {
            return response()->json([
                'message' => 'Ma giam gia khong hop le hoac da het luot su dung.',
            ], 422);
        }

        $subtotal = (float) $request->input('subtotal');
        $discountAmount = round($subtotal * $voucher->discount_percent / 100);

        return response()->json([
            'message' => 'Ap dung ma giam gia thanh cong.',
            'voucher' => new VoucherResource($voucher),
            'discount_amount' => $discountAmount,
            'discount_amount_formatted' => number_format($discountAmount, 0, ',', '.').'d',
            'total' => max(0, $subtotal - $discountAmount),
            'total_formatted' => number_format(max(0, $subtotal - $discountAmount), 0, ',', '.').'d',
        ]);
    }
}
