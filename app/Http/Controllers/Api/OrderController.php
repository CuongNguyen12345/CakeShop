<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ListOrdersRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(ListOrdersRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();

        $orders = Order::query()
            ->with('items')
            ->when($filters['status'] ?? null, function (Builder $query, string $status): void {
                $query->where('order_status', $status);
            })
            ->latest('id')
            ->paginate($request->perPage())
            ->withQueryString();

        return OrderResource::collection($orders)->additional([
            'statuses' => Order::statusLabels(),
            'status_counts' => $this->statusCounts(),
        ]);
    }

    public function userHistory(User $user): JsonResponse
    {
        $orders = Order::query()
            ->with('items')
            ->where('user_id', $user->id)
            ->latest('id')
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders)->resolve(),
        ]);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'order_status' => ['required', 'string', Rule::in(array_keys(Order::statusLabels()))],
        ]);

        $order->forceFill([
            'order_status' => $validated['order_status'],
        ])->save();

        $order->load('items');

        return response()->json([
            'message' => 'Da cap nhat trang thai don hang.',
            'order' => (new OrderResource($order))->resolve(),
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function statusCounts(): array
    {
        $counts = Order::query()
            ->select('order_status')
            ->selectRaw('count(*) as orders_count')
            ->groupBy('order_status')
            ->pluck('orders_count', 'order_status');

        return collect(array_keys(Order::statusLabels()))
            ->mapWithKeys(fn (string $status): array => [$status => (int) ($counts[$status] ?? 0)])
            ->all();
    }
}
