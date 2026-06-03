<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

$body = read_json_body();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$code = trim((string) ($body['code'] ?? ''));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['message' => 'Invalid email address.']);
}

if (!preg_match('/^\d{6}$/', $code)) {
    send_json(400, ['message' => 'Code must be a 6-digit number.']);
}

try {
    $pdo = get_pdo($config);

    $cleanupStmt = $pdo->prepare('DELETE FROM email_verification_codes WHERE expires_at <= NOW()');
    $cleanupStmt->execute();

    $selectStmt = $pdo->prepare(
        'SELECT code FROM email_verification_codes WHERE email = :email LIMIT 1'
    );
    $selectStmt->execute(['email' => $email]);
    $record = $selectStmt->fetch();

    if (!$record) {
        send_json(400, ['message' => 'No active verification code. Please request a new one.']);
    }

    if ((string) ($record['code'] ?? '') !== $code) {
        send_json(400, ['message' => 'Invalid verification code.']);
    }

    $deleteStmt = $pdo->prepare('DELETE FROM email_verification_codes WHERE email = :email');
    $deleteStmt->execute(['email' => $email]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while verifying code.']);
}

send_json(200, ['message' => 'Email verified successfully.', 'verified' => true]);

