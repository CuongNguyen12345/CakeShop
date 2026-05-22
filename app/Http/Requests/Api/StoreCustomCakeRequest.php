<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;

class StoreCustomCakeRequest extends FormRequest
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
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'cake_size' => ['required', 'string', 'max:50'],
            'flavor' => ['required', 'string', 'max:100'],
            'servings' => ['nullable', 'integer', 'min:1', 'max:300'],
            'desired_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:999999999'],
            'text_on_cake' => ['nullable', 'string', 'max:255'],
            'accessories' => ['nullable', 'string', 'max:1000'],
            'note' => ['nullable', 'string', 'max:2000'],
            'reference_image' => ['nullable', File::image()->max(5 * 1024)],
        ];
    }
}
