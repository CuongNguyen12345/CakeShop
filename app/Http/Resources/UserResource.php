<?php

namespace App\Http\Resources;

use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $attributes = $this->resource->getAttributes();

        return [
            'id' => $this->id,
            'name' => $this->when(array_key_exists('name', $attributes), $attributes['name'] ?? null),
            'email' => $this->when(array_key_exists('email', $attributes), $attributes['email'] ?? null),
            'username' => $this->when(array_key_exists('username', $attributes), $attributes['username'] ?? null),
            'role' => $this->when(array_key_exists('role', $attributes), $attributes['role'] ?? null),
            'login_by_google' => $this->when(
                array_key_exists('login_by_google', $attributes),
                (bool) ($attributes['login_by_google'] ?? false)
            ),
            'phone_number' => $this->when(array_key_exists('phone_number', $attributes), $attributes['phone_number'] ?? null),
            'created_at' => $this->when(
                array_key_exists('created_at', $attributes) || array_key_exists('create_date', $attributes),
                $this->formatDate($this->created_at ?? $attributes['create_date'] ?? null)
            ),
            'updated_at' => $this->when(
                array_key_exists('updated_at', $attributes) || array_key_exists('modified_date', $attributes),
                $this->formatDate($this->updated_at ?? $attributes['modified_date'] ?? null)
            ),
        ];
    }

    private function formatDate(DateTimeInterface|string|null $date): ?string
    {
        if ($date instanceof DateTimeInterface) {
            return $date->format(DateTimeInterface::ATOM);
        }

        return $date;
    }
}
