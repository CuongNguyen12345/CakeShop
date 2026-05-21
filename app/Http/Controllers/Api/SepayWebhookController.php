<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\SepayTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SepayWebhookController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if (! $this->isAuthorized($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }

        $payload = $request->all();
        $transactionId = (string) ($payload['id'] ?? '');

        if (! $transactionId) {
            return response()->json([
                'success' => false,
                'message' => 'Missing transaction id.',
            ], 422);
        }

        if (SepayTransaction::where('sepay_transaction_id', $transactionId)->exists()) {
            return response()->json(['success' => true]);
        }

        $transferType = strtoupper((string) ($payload['transferType'] ?? ''));
        $transferAmount = (int) ($payload['transferAmount'] ?? 0);
        $content = (string) ($payload['content'] ?? '');
        $referenceCode = $payload['referenceCode'] ?? null;
        $order = $this->findOrder($payload, $content);

        DB::transaction(function () use ($content, $order, $payload, $referenceCode, $transactionId, $transferAmount, $transferType): void {
            SepayTransaction::create([
                'order_id' => $order?->id,
                'sepay_transaction_id' => $transactionId,
                'transfer_type' => $transferType,
                'transfer_amount' => $transferAmount,
                'content' => $content,
                'reference_code' => is_string($referenceCode) ? $referenceCode : null,
                'payload' => $payload,
            ]);

            if (! $order || $transferType !== 'IN') {
                return;
            }

            if ($transferAmount >= $order->amount) {
                $order->markAsPaid();

                return;
            }

            $order->forceFill(['payment_status' => 'partial'])->save();
        });

        return response()->json(['success' => true]);
    }

    private function isAuthorized(Request $request): bool
    {
        $apiKey = trim((string) config('services.sepay.api_key'));

        if (! $apiKey) {
            return false;
        }

        return hash_equals('Apikey '.$apiKey, (string) $request->header('Authorization', ''));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function findOrder(array $payload, string $content): ?Order
    {
        $code = $payload['code'] ?? null;

        if (is_string($code) && $code !== '') {
            $order = Order::where('transfer_content', $code)->first();

            if ($order) {
                return $order;
            }
        }

        return Order::query()
            ->whereNotNull('transfer_content')
            ->get()
            ->first(fn (Order $order): bool => Str::contains($content, (string) $order->transfer_content));
    }
}
