<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'price_formatted' => number_format((float) $this->price, 0, ',', '.').'đ',
            'image_url' => $this->image_url,
            'size_inch' => $this->size_inch,
            'stock_quantity' => (int) ($this->stock_quantity ?? 0),
            'sold_count' => (int) ($this->sold_count ?? 0),
            'tag' => $this->tag,
            'is_available' => (bool) $this->is_available,
            'category' => new CategoryResource($this->whenLoaded('category')),
        ];
    }
}
