<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:155'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'image_url' => ['nullable', 'string', 'max:255'],
            'size_inch' => ['nullable', 'integer', 'min:1', 'max:30'],
            'stock_quantity' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'tag' => ['nullable', 'string', 'max:50'],
            'is_available' => ['sometimes', 'boolean'],
        ];
    }
}
