<?php

namespace App\Http\Resources;

use App\Models\CustomCake;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin CustomCake */
class CustomCakeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'cake_size' => $this->cake_size,
            'flavor' => $this->flavor,
            'servings' => $this->servings,
            'desired_date' => $this->desired_date?->toDateString(),
            'budget' => $this->budget !== null ? (float) $this->budget : null,
            'budget_formatted' => $this->budget !== null ? number_format((float) $this->budget, 0, ',', '.').'đ' : null,
            'text_on_cake' => $this->text_on_cake,
            'accessories' => $this->accessories,
            'reference_image_url' => $this->reference_image_url,
            'note' => $this->note,
            'estimated_price' => $this->estimated_price !== null ? (float) $this->estimated_price : null,
            'estimated_price_formatted' => $this->estimated_price !== null ? number_format((float) $this->estimated_price, 0, ',', '.').'đ' : null,
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'admin_note' => $this->admin_note,
            'quoted_at' => $this->quoted_at?->toISOString(),
            'converted_order_id' => $this->converted_order_id,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn (): array => [
                'id' => $this->user->id,
                'username' => $this->user->username ?? null,
                'email' => $this->user->email ?? null,
                'full_name' => $this->user->full_name ?? $this->user->name ?? null,
            ]),
        ];
    }
}
