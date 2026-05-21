<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class SepayTransaction extends Model
{
    protected $fillable = [
        'order_id',
        'sepay_transaction_id',
        'transfer_type',
        'transfer_amount',
        'content',
        'reference_code',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'transfer_amount' => 'integer',
            'payload' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
