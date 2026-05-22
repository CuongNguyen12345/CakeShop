<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutPaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'payment_method' => ['required', 'string', 'in:cod,bank'],
            'amount' => ['required', 'numeric', 'min:1000', 'max:999999999'],
            'order_code' => ['nullable', 'string', 'max:50'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:15'],
            'customer_email' => ['nullable', 'email', 'max:100'],
            'customer_address' => ['required', 'string', 'max:255'],
            'customer_district' => ['required', 'string', 'max:100'],
            'customer_note' => ['nullable', 'string', 'max:255'],
            'delivery_date' => ['required', 'date_format:Y-m-d'],
            'delivery_slot' => ['required', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['nullable', 'integer'],
            'items.*.name' => ['required', 'string', 'max:155'],
            'items.*.description' => ['nullable', 'string', 'max:500'],
            'items.*.image_url' => ['nullable', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.price' => ['required', 'numeric', 'min:0', 'max:999999999'],
        ];
    }
}
