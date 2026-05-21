<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVoucherRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $voucherId = $this->route('voucher')?->id;

        return [
            'code' => ['required', 'string', 'max:50', Rule::unique('vouchers', 'code')->ignore($voucherId)],
            'discount_percent' => ['required', 'integer', 'min:1', 'max:100'],
            'usage_limit' => ['required', 'integer', 'min:1', 'max:100000'],
            'used_count' => ['nullable', 'integer', 'min:0', 'max:100000', 'lte:usage_limit'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
