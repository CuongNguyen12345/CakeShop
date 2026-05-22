<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID', env('VITE_GOOGLE_CLIENT_ID')),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'sepay' => [
        'api_key' => env('SEPAY_API_KEY'),
        'qr_url' => env('SEPAY_QR_URL', 'https://qr.sepay.vn/img'),
        'bank_code' => env('SEPAY_BANK_CODE'),
        'account_number' => env('SEPAY_ACCOUNT_NUMBER'),
        'account_name' => env('SEPAY_ACCOUNT_NAME'),
        'payment_prefix' => env('SEPAY_PAYMENT_PREFIX', 'FL'),
        'template' => env('SEPAY_QR_TEMPLATE', 'compact'),
    ],

];
