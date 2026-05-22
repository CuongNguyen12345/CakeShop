<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    private const DISPLAY_TIMEZONE = 'Asia/Ho_Chi_Minh';

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items->map(fn ($item): array => [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'name' => $item->item_name,
            'description' => $item->item_description,
            'image_url' => $item->item_image_url,
            'quantity' => $item->quantity,
            'price' => (float) $item->price,
            'line_total' => (float) $item->price * $item->quantity,
        ])->values() : collect();

        return [
            'id' => $this->id,
            'code' => $this->code,
            'order_code' => $this->code,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'customer_district' => $this->customer_district,
            'customer_note' => $this->customer_note,
            'shipping_address' => $this->shipping_address,
            'delivery_date' => $this->delivery_date?->toDateString(),
            'delivery_time' => $this->delivery_time,
            'delivery_slot' => $this->delivery_slot,
            'amount' => $this->amount,
            'total_amount' => (float) $this->total_amount,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status,
            'order_status' => $this->order_status,
            'order_status_label' => $this->statusLabel(),
            'transfer_content' => $this->transfer_content,
            'paid_at' => $this->paid_at?->toISOString(),
            'created_date' => $this->created_date?->toISOString(),
            'items' => $items,
            'timeline' => $this->timeline(),
        ];
    }

    /**
     * @return array<int, array{status: string, label: string, state: string, note: string}>
     */
    private function timeline(): array
    {
        $statuses = array_keys(Order::statusLabels());
        $currentIndex = array_search($this->order_status, $statuses, true);
        $currentIndex = $currentIndex === false ? 0 : $currentIndex;

        return collect(Order::statusLabels())
            ->map(function (string $label, string $status) use ($statuses, $currentIndex): array {
                $statusIndex = array_search($status, $statuses, true);
                $statusIndex = $statusIndex === false ? 0 : $statusIndex;

                return [
                    'status' => $status,
                    'label' => $label,
                    'state' => $statusIndex < $currentIndex ? 'done' : ($statusIndex === $currentIndex ? 'active' : 'pending'),
                    'note' => $statusIndex <= $currentIndex ? $this->formattedCreatedDate() ?? 'Đã cập nhật' : 'Chờ xử lý',
                ];
            })
            ->values()
            ->all();
    }

    private function formattedCreatedDate(): ?string
    {
        return $this->created_date?->copy()
            ->timezone(self::DISPLAY_TIMEZONE)
            ->format('d/m/Y H:i');
    }
}
