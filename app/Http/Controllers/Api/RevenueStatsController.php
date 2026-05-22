<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class RevenueStatsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $period = in_array($request->query('period'), ['day', 'month', 'year'], true)
            ? (string) $request->query('period')
            : 'day';
        $now = now('Asia/Ho_Chi_Minh');
        [$currentStart, $currentEnd, $previousStart, $previousEnd] = $this->periodRanges($period, $now);
        $revenueOrders = $this->revenueOrders($previousStart, $currentEnd);
        $currentOrders = $this->ordersInRange($revenueOrders, $currentStart, $currentEnd);
        $previousOrders = $this->ordersInRange($revenueOrders, $previousStart, $previousEnd);
        $totalOrders = Order::query()
            ->whereBetween('created_date', [$currentStart, $currentEnd])
            ->count();

        $summary = [
            'period' => $period,
            'total_revenue' => $this->ordersRevenue($currentOrders),
            'total_revenue_formatted' => $this->formatMoney($this->ordersRevenue($currentOrders)),
            'previous_revenue' => $this->ordersRevenue($previousOrders),
            'previous_revenue_formatted' => $this->formatMoney($this->ordersRevenue($previousOrders)),
            'revenue_change_percent' => $this->changePercent($this->ordersRevenue($currentOrders), $this->ordersRevenue($previousOrders)),
            'paid_orders_count' => $currentOrders->count(),
            'completion_rate' => $totalOrders > 0 ? (int) round(($currentOrders->count() / $totalOrders) * 100) : 0,
        ];
        $chart = $this->chart($period, $currentOrders, $currentStart);
        $topProducts = $this->topProducts($currentOrders);

        return response()->json([
            'summary' => $summary,
            'chart' => $chart,
            'top_products' => $topProducts,
            'best_seller' => $topProducts->first(),
            'tables' => ['orders', 'order_items'],
        ]);
    }

    /**
     * @return Collection<int, Order>
     */
    private function revenueOrders(Carbon $start, Carbon $end): Collection
    {
        return Order::query()
            ->with('items')
            ->whereBetween('created_date', [$start, $end])
            ->get()
            ->filter(fn (Order $order): bool => $this->isRevenueOrder($order))
            ->values();
    }

    private function isRevenueOrder(Order $order): bool
    {
        return strtolower((string) $order->payment_status) === 'paid'
            || filled($order->paid_at)
            || $order->order_status === Order::STATUS_DELIVERED;
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return Collection<int, Order>
     */
    private function ordersInRange(Collection $orders, Carbon $start, Carbon $end): Collection
    {
        return $orders
            ->filter(fn (Order $order): bool => $order->created_date !== null && $order->created_date->betweenIncluded($start, $end))
            ->values();
    }

    /**
     * @param  Collection<int, Order>  $orders
     */
    private function ordersRevenue(Collection $orders): int
    {
        return (int) $orders->sum(fn (Order $order): int => (int) ($order->amount ?? $order->total_amount ?? 0));
    }

    /**
     * @return array{0: Carbon, 1: Carbon, 2: Carbon, 3: Carbon}
     */
    private function periodRanges(string $period, Carbon $now): array
    {
        if ($period === 'month') {
            $currentStart = $now->copy()->startOfYear();
            $currentEnd = $now->copy()->endOfYear();
            $previousStart = $now->copy()->subYear()->startOfYear();
            $previousEnd = $now->copy()->subYear()->endOfYear();

            return [$currentStart, $currentEnd, $previousStart, $previousEnd];
        }

        if ($period === 'year') {
            $currentStart = $now->copy()->subYears(4)->startOfYear();
            $currentEnd = $now->copy()->endOfYear();
            $previousStart = $now->copy()->subYears(9)->startOfYear();
            $previousEnd = $now->copy()->subYears(5)->endOfYear();

            return [$currentStart, $currentEnd, $previousStart, $previousEnd];
        }

        $currentStart = $now->copy()->startOfWeek();
        $currentEnd = $now->copy()->endOfWeek();
        $previousStart = $now->copy()->subWeek()->startOfWeek();
        $previousEnd = $now->copy()->subWeek()->endOfWeek();

        return [$currentStart, $currentEnd, $previousStart, $previousEnd];
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return array<int, array{label: string, revenue: int, revenue_formatted: string, height_percent: int}>
     */
    private function chart(string $period, Collection $orders, Carbon $start): array
    {
        $buckets = $this->emptyBuckets($period, $start);

        $orders->each(function (Order $order) use (&$buckets, $period): void {
            $date = $order->created_date;

            if (! $date) {
                return;
            }

            $key = $this->bucketKey($period, $date);

            if (! array_key_exists($key, $buckets)) {
                return;
            }

            $buckets[$key]['revenue'] += (int) ($order->amount ?? $order->total_amount ?? 0);
        });

        $maxRevenue = max(1, ...array_column($buckets, 'revenue'));

        return collect($buckets)
            ->map(fn (array $bucket): array => [
                'label' => $bucket['label'],
                'revenue' => $bucket['revenue'],
                'revenue_formatted' => $this->formatCompactMoney($bucket['revenue']),
                'height_percent' => $bucket['revenue'] > 0 ? max(8, (int) round(($bucket['revenue'] / $maxRevenue) * 100)) : 0,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, array{label: string, revenue: int}>
     */
    private function emptyBuckets(string $period, Carbon $start): array
    {
        if ($period === 'month') {
            return collect(range(1, 12))
                ->mapWithKeys(fn (int $month): array => [sprintf('%02d', $month) => ['label' => 'T'.$month, 'revenue' => 0]])
                ->all();
        }

        if ($period === 'year') {
            $firstYear = (int) $start->format('Y');

            return collect(range($firstYear, $firstYear + 4))
                ->mapWithKeys(fn (int $year): array => [(string) $year => ['label' => (string) $year, 'revenue' => 0]])
                ->all();
        }

        return [
            '1' => ['label' => 'T2', 'revenue' => 0],
            '2' => ['label' => 'T3', 'revenue' => 0],
            '3' => ['label' => 'T4', 'revenue' => 0],
            '4' => ['label' => 'T5', 'revenue' => 0],
            '5' => ['label' => 'T6', 'revenue' => 0],
            '6' => ['label' => 'T7', 'revenue' => 0],
            '7' => ['label' => 'CN', 'revenue' => 0],
        ];
    }

    private function bucketKey(string $period, Carbon $date): string
    {
        if ($period === 'month') {
            return $date->format('m');
        }

        if ($period === 'year') {
            return $date->format('Y');
        }

        return (string) $date->dayOfWeekIso;
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return Collection<int, array{name: string, quantity: int, orders_count: int, revenue: int, revenue_formatted: string}>
     */
    private function topProducts(Collection $orders): Collection
    {
        return $orders
            ->flatMap(fn (Order $order) => $order->items->map(fn ($item): array => [
                'order_id' => $order->id,
                'name' => $item->item_name ?: 'Sản phẩm',
                'quantity' => (int) $item->quantity,
                'revenue' => (int) round((float) $item->price * (int) $item->quantity),
            ]))
            ->groupBy('name')
            ->map(fn (Collection $items, string $name): array => [
                'name' => $name,
                'quantity' => (int) $items->sum('quantity'),
                'orders_count' => $items->pluck('order_id')->unique()->count(),
                'revenue' => (int) $items->sum('revenue'),
                'revenue_formatted' => $this->formatMoney((int) $items->sum('revenue')),
            ])
            ->sortByDesc('revenue')
            ->take(5)
            ->values();
    }

    private function changePercent(int $current, int $previous): int
    {
        if ($previous === 0) {
            return $current > 0 ? 100 : 0;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }

    private function formatMoney(int $amount): string
    {
        return number_format($amount, 0, ',', '.').'đ';
    }

    private function formatCompactMoney(int $amount): string
    {
        if ($amount >= 1000000) {
            return rtrim(rtrim(number_format($amount / 1000000, 1, ',', ''), '0'), ',').'tr';
        }

        if ($amount >= 1000) {
            return rtrim(rtrim(number_format($amount / 1000, 1, ',', ''), '0'), ',').'k';
        }

        return (string) $amount;
    }
}
