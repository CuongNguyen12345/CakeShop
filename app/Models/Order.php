<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'code',
        'customer_name',
        'customer_phone',
        'customer_email',
        'shipping_address',
        'customer_address',
        'customer_district',
        'customer_note',
        'delivery_date',
        'delivery_time',
        'delivery_slot',
        'total_amount',
        'amount',
        'payment_method',
        'payment_status',
        'order_status',
        'bank_code',
        'bank_account_number',
        'bank_account_name',
        'transfer_content',
        'qr_url',
        'paid_at',
        'created_date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'total_amount' => 'decimal:2',
            'delivery_date' => 'date',
            'paid_at' => 'datetime',
            'created_date' => 'datetime',
        ];
    }

    public function markAsPaid(): void
    {
        if ($this->payment_status === 'paid') {
            return;
        }

        $this->forceFill([
            'payment_status' => 'paid',
            'paid_at' => now(),
        ])->save();
    }

    /**
     * @return HasMany<SepayTransaction, $this>
     */
    public function sepayTransactions(): HasMany
    {
        return $this->hasMany(SepayTransaction::class);
    }
}
