<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UpdateUserProfileRequest extends FormRequest
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
        $user = $this->route('user');
        $userId = $user instanceof User ? $user->id : null;
        $userTable = 'users';

        $rules = [
            'full_name' => ['nullable', 'string', 'max:100'],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'delivery_address' => ['nullable', 'string', 'max:255'],
            'delivery_district' => ['nullable', 'string', 'max:100'],
        ];

        if (Schema::hasColumn($userTable, 'name')) {
            $rules['name'] = ['nullable', 'string', 'max:255'];
        }

        if (Schema::hasColumn($userTable, 'username')) {
            $rules['username'] = ['sometimes', 'required', 'string', 'max:50', Rule::unique($userTable, 'username')->ignore($userId)];
        }

        if (Schema::hasColumn($userTable, 'email')) {
            $rules['email'] = ['nullable', 'email', 'max:255', Rule::unique($userTable, 'email')->ignore($userId)];
        }

        return $rules;
    }
}
