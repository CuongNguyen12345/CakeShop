<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CheckoutPaymentRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function show(Order $order): JsonResponse
    {
        $order->load('items');

        return response()->json((new OrderResource($order))->resolve());
    }

    public function checkout(CheckoutPaymentRequest $request): JsonResponse
    {
        $amount = (int) round((float) $request->input('amount'));
        $orderCode = $request->input('order_code') ?: $this->makeOrderCode();
        $paymentMethod = $request->input('payment_method');

        if ($paymentMethod === 'bank') {
            return $this->bankCheckoutResponse($request, $amount, $orderCode);
        }

        $order = $this->createOrder($request, $amount, $orderCode, 'cod');

        return response()->json([
            'message' => 'Da tao don hang COD.',
            'order_code' => $order->code,
            'payment_method' => 'cod',
            'payment_status' => $order->payment_status,
            'payment_url' => $this->confirmationUrl($order),
        ]);
    }

    private function bankCheckoutResponse(CheckoutPaymentRequest $request, int $amount, string $orderCode): JsonResponse
    {
        $bankCode = trim((string) config('services.sepay.bank_code'));
        $accountNumber = trim((string) config('services.sepay.account_number'));
        $accountName = trim((string) config('services.sepay.account_name'));

        abort_if(! $bankCode || ! $accountNumber, 422, 'Chua cau hinh SePay. Vui long kiem tra SEPAY_BANK_CODE va SEPAY_ACCOUNT_NUMBER.');

        $transferContent = $this->makeTransferContent($orderCode);
        $qrUrl = $this->makeSepayQrUrl($amount, $transferContent, $bankCode, $accountNumber);
        $order = $this->createOrder($request, $amount, $orderCode, 'bank', [
            'bank_code' => $bankCode,
            'bank_account_number' => $accountNumber,
            'bank_account_name' => $accountName,
            'transfer_content' => $transferContent,
            'qr_url' => $qrUrl,
        ]);

        return response()->json([
            'message' => 'Da tao thong tin thanh toan ngan hang.',
            'order_code' => $order->code,
            'payment_method' => 'bank',
            'payment_status' => $order->payment_status,
            'payment_url' => $this->confirmationUrl($order),
            'bank' => [
                'code' => $bankCode,
                'account_number' => $accountNumber,
                'account_name' => $accountName,
                'transfer_content' => $transferContent,
                'qr_url' => $qrUrl,
            ],
        ]);
    }

    /**
     * @param  array<string, string|null>  $paymentDetails
     */
    private function createOrder(CheckoutPaymentRequest $request, int $amount, string $orderCode, string $paymentMethod, array $paymentDetails = []): Order
    {
        $customerAddress = $request->string('customer_address')->toString();
        $customerDistrict = $request->string('customer_district')->toString();
        $deliverySlot = $request->string('delivery_slot')->toString();

        return DB::transaction(function () use ($amount, $customerAddress, $customerDistrict, $deliverySlot, $orderCode, $paymentDetails, $paymentMethod, $request): Order {
            $items = collect($request->input('items', []));
            $user = $request->filled('user_id') ? User::query()->find($request->integer('user_id')) : null;

            $this->reserveProductStock($items);

            $order = Order::create(array_merge([
                'user_id' => $user?->id,
                'code' => $orderCode,
                'payment_method' => $paymentMethod,
                'payment_status' => 'pending',
                'order_status' => Order::STATUS_PENDING,
                'amount' => $amount,
                'total_amount' => $amount,
                'customer_name' => $request->string('customer_name')->toString(),
                'customer_phone' => $request->string('customer_phone')->toString(),
                'customer_email' => $user?->email ?: ($request->filled('customer_email') ? $request->string('customer_email')->toString() : null),
                'shipping_address' => collect([$customerAddress, $customerDistrict])->filter()->implode(', '),
                'customer_address' => $customerAddress,
                'customer_district' => $customerDistrict,
                'customer_note' => $request->filled('customer_note') ? $request->string('customer_note')->toString() : null,
                'delivery_date' => $request->input('delivery_date'),
                'delivery_time' => $this->deliveryTimeFromSlot($deliverySlot),
                'delivery_slot' => $deliverySlot,
                'created_date' => now(),
            ], $paymentDetails));

            $order->items()->createMany($items->map(fn (array $item): array => [
                'product_id' => $item['product_id'] ?? null,
                'item_name' => $item['name'],
                'item_description' => $item['description'] ?? null,
                'item_image_url' => $item['image_url'] ?? null,
                'quantity' => (int) $item['quantity'],
                'price' => (float) $item['price'],
            ])->all());

            return $order;
        });
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $items
     */
    private function reserveProductStock(Collection $items): void
    {
        $items
            ->filter(fn (array $item): bool => filled($item['product_id'] ?? null))
            ->groupBy(fn (array $item): int => (int) $item['product_id'])
            ->each(function ($productItems, int $productId): void {
                $quantity = $productItems->sum(fn (array $item): int => (int) $item['quantity']);
                $product = Product::query()->whereKey($productId)->lockForUpdate()->first();

                if (! $product || $product->stock_quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => ['San pham '.$productItems->first()['name'].' khong du so luong ton kho.'],
                    ]);
                }

                $product->decrement('stock_quantity', $quantity);
            });
    }

    private function confirmationUrl(Order $order): string
    {
        return route('bakery.confirm', [
            'order_code' => $order->code,
            'payment_method' => $order->payment_method,
            'payment_status' => $order->payment_status,
            'amount' => $order->amount,
            'bank_code' => $order->bank_code,
            'bank_account_number' => $order->bank_account_number,
            'bank_account_name' => $order->bank_account_name,
            'transfer_content' => $order->transfer_content,
            'qr_url' => $order->qr_url,
            'customer_address' => $order->customer_address,
            'customer_district' => $order->customer_district,
            'delivery_slot' => $order->delivery_slot,
        ]);
    }

    private function makeSepayQrUrl(int $amount, string $transferContent, string $bankCode, string $accountNumber): string
    {
        return trim((string) config('services.sepay.qr_url')).'?'.http_build_query([
            'acc' => $accountNumber,
            'bank' => $bankCode,
            'amount' => $amount,
            'des' => $transferContent,
            'template' => trim((string) config('services.sepay.template')) ?: 'compact',
        ]);
    }

    private function makeTransferContent(string $orderCode): string
    {
        $prefix = trim((string) config('services.sepay.payment_prefix')) ?: 'FL';

        return $prefix.$orderCode;
    }

    private function deliveryTimeFromSlot(string $deliverySlot): string
    {
        if (preg_match('/\b(\d{1,2}):(\d{2})\b/', $deliverySlot, $matches) !== 1) {
            return '00:00:00';
        }

        return sprintf('%02d:%02d:00', (int) $matches[1], (int) $matches[2]);
    }

    private function makeOrderCode(): string
    {
        return now('Asia/Ho_Chi_Minh')->format('YmdHis').random_int(100000, 999999);
    }
}
