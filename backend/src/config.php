<?php

declare(strict_types=1);

$defaults = [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => (int) (getenv('DB_PORT') ?: 3306),
    'db_name' => getenv('DB_NAME') ?: 'leoworks',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'smtp_host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'smtp_port' => (int) (getenv('SMTP_PORT') ?: 587),
    'smtp_user' => getenv('SMTP_USER') ?: '',
    'smtp_pass' => getenv('SMTP_PASS') ?: '',
    'smtp_from_email' => getenv('SMTP_FROM_EMAIL') ?: '',
    'smtp_from_name' => getenv('SMTP_FROM_NAME') ?: 'Mangrove App',
    'google_client_id' => getenv('GOOGLE_CLIENT_ID') ?: '',
    'code_expiry_seconds' => 600,
    /** When false, GET /api/system/status.php responds with 404 (hide diagnostics in production). */
    'expose_public_status' => filter_var(getenv('LEOWORKS_EXPOSE_PUBLIC_STATUS'), FILTER_VALIDATE_BOOLEAN),
];

$localConfigPath = __DIR__ . '/config.local.php';
if (file_exists($localConfigPath)) {
    $local = require $localConfigPath;
    if (is_array($local)) {
        return array_merge($defaults, $local);
    }
}

return $defaults;

