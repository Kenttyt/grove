<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');

$config = require __DIR__ . '/../../../src/config.php';

if (empty($config['expose_public_status'])) {
    http_response_code(404);
    if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        header('Content-Type: application/json');
        echo json_encode(['message' => 'Not found.']);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

header('Content-Type: application/json');

$dbConnected = false;
$mysqlVersion = null;
$dbError = null;

try {
    require_once __DIR__ . '/../../../src/database.php';
    $pdo = get_pdo($config);
    $pdo->query('SELECT 1');
    $dbConnected = true;
    $ver = $pdo->query('SELECT VERSION() AS v')->fetch();
    if (is_array($ver) && isset($ver['v'])) {
        $mysqlVersion = (string) $ver['v'];
    }
} catch (Throwable $e) {
    $dbConnected = false;
    $dbError = 'Could not connect (check MySQL and config).';
}

$smtpUser = trim((string) ($config['smtp_user'] ?? ''));
$smtpPass = (string) ($config['smtp_pass'] ?? '');
$smtpPlaceholder = str_contains($smtpPass, 'PUT_YOUR') || str_contains($smtpPass, 'YOUR_');
$smtpConfigured = $smtpUser !== '' && $smtpPass !== '' && !$smtpPlaceholder;

$googleConfigured = trim((string) ($config['google_client_id'] ?? '')) !== '';

echo json_encode([
    'app' => 'LeoWorks API',
    'php_version' => PHP_VERSION,
    'server_time_utc' => gmdate('c'),
    'database' => [
        'connected' => $dbConnected,
        'name' => (string) ($config['db_name'] ?? ''),
        'host' => (string) ($config['db_host'] ?? ''),
        'port' => (int) ($config['db_port'] ?? 3306),
        'mysql_version' => $mysqlVersion,
        'error' => $dbError,
    ],
    'smtp_configured' => $smtpConfigured,
    'google_oauth_backend_configured' => $googleConfigured,
], JSON_UNESCAPED_SLASHES);
