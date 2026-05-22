<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with('items')
            ->latest('id')
            ->limit(100)
            ->get();

        return response()->json([
            'data' => OrderResource::collection($orders)->resolve(),
            'statuses' => Order::statusLabels(),
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
}
