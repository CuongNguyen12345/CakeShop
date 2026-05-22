<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomCake extends Model
{
    public const STATUS_PENDING_REVIEW = 'pending_review';

    public const STATUS_NEED_MORE_INFO = 'need_more_info';

    public const STATUS_QUOTED = 'quoted';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CONVERTED_TO_ORDER = 'converted_to_order';

    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_phone',
        'cake_size',
        'flavor',
        'servings',
        'desired_date',
        'budget',
        'text_on_cake',
        'accessories',
        'reference_image_url',
        'note',
        'estimated_price',
        'status',
        'admin_note',
        'quoted_at',
        'converted_order_id',
    ];

    protected $attributes = [
        'status' => self::STATUS_PENDING_REVIEW,
    ];

    protected function casts(): array
    {
        return [
            'servings' => 'integer',
            'desired_date' => 'date',
            'budget' => 'decimal:2',
            'estimated_price' => 'decimal:2',
            'quoted_at' => 'datetime',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function statusLabels(): array
    {
        return [
            self::STATUS_PENDING_REVIEW => 'Chờ tiệm xem xét',
            self::STATUS_NEED_MORE_INFO => 'Cần bổ sung thông tin',
            self::STATUS_QUOTED => 'Đã báo giá',
            self::STATUS_REJECTED => 'Tiệm từ chối',
            self::STATUS_CONVERTED_TO_ORDER => 'Đã tạo đơn hàng',
        ];
    }

    public function statusLabel(): string
    {
        return self::statusLabels()[$this->status] ?? (string) $this->status;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function convertedOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'converted_order_id');
    }
}
