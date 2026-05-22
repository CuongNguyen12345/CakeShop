<?php

namespace App\Http\Requests\Api;

use App\Models\CustomCake;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomCakeRequest extends FormRequest
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
            'status' => ['required', 'string', Rule::in(array_keys(CustomCake::statusLabels()))],
            'estimated_price' => ['nullable', 'required_if:status,'.CustomCake::STATUS_QUOTED, 'numeric', 'min:0', 'max:999999999'],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
