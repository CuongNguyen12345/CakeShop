<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ListProductsRequest extends FormRequest
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
        $maximumPriceRules = ['nullable', 'numeric', 'min:0', 'max:99999999.99'];

        if ($this->query->has('min_price')) {
            $maximumPriceRules[] = 'gte:min_price';
        }

        return [
            'keyword' => ['nullable', 'string', 'max:155'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'min_price' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
            'max_price' => $maximumPriceRules,
            'is_available' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function shouldPaginate(): bool
    {
        foreach (['keyword', 'category_id', 'min_price', 'max_price', 'is_available', 'page', 'per_page'] as $queryParameter) {
            if ($this->query->has($queryParameter)) {
                return true;
            }
        }

        return false;
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? 10);
    }
}
