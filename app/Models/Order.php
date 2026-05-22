<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_BAKING = 'baking';

    public const STATUS_READY_FOR_SHIPPER = 'ready_for_shipper';

    public const STATUS_SHIPPING = 'shipping';

    public const STATUS_DELIVERED = 'delivered';

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
     * @return array<string, string>
     */
    public static function statusLabels(): array
    {
        return [
            self::STATUS_PENDING => 'Chờ xác nhận',
            self::STATUS_CONFIRMED => 'Đã xác nhận',
            self::STATUS_BAKING => 'Đang làm bánh',
            self::STATUS_READY_FOR_SHIPPER => 'Bàn giao shipper',
            self::STATUS_SHIPPING => 'Đang giao hàng',
            self::STATUS_DELIVERED => 'Giao hàng thành công',
        ];
    }

    public function statusLabel(): string
    {
        return self::statusLabels()[$this->order_status] ?? (string) $this->order_status;
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<SepayTransaction, $this>
     */
    public function sepayTransactions(): HasMany
    {
        return $this->hasMany(SepayTransaction::class);
    }
}
