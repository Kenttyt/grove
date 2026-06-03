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
$credential = trim((string) ($body['credential'] ?? ''));

if ($credential === '') {
    send_json(400, ['message' => 'Missing Google credential.']);
}

$tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);
$tokenInfoRaw = @file_get_contents($tokenInfoUrl);
if ($tokenInfoRaw === false) {
    send_json(401, ['message' => 'Unable to verify Google credential.']);
}

$tokenInfo = json_decode($tokenInfoRaw, true);
if (!is_array($tokenInfo)) {
    send_json(401, ['message' => 'Invalid Google token response.']);
}

$aud = (string) ($tokenInfo['aud'] ?? '');
$email = strtolower(trim((string) ($tokenInfo['email'] ?? '')));
$sub = trim((string) ($tokenInfo['sub'] ?? ''));
$emailVerified = (string) ($tokenInfo['email_verified'] ?? 'false');
$displayName = trim((string) ($tokenInfo['name'] ?? ''));

if ($config['google_client_id'] !== '' && $aud !== (string) $config['google_client_id']) {
    send_json(401, ['message' => 'Google client ID mismatch.']);
}

if ($email === '' || $sub === '' || $emailVerified !== 'true') {
    send_json(401, ['message' => 'Invalid Google account data.']);
}

$username = $displayName !== '' ? $displayName : explode('@', $email)[0];
$username = mb_substr($username, 0, 18);

try {
    $pdo = get_pdo($config);

    $findStmt = $pdo->prepare('SELECT id, username, email FROM users WHERE email = :email OR google_sub = :google_sub LIMIT 1');
    $findStmt->execute([
        'email' => $email,
        'google_sub' => $sub,
    ]);
    $existing = $findStmt->fetch();

    if ($existing) {
        $updateStmt = $pdo->prepare(
            'UPDATE users
             SET username = :username, email = :email, google_sub = :google_sub
             WHERE id = :id'
        );
        $updateStmt->execute([
            'username' => $username,
            'email' => $email,
            'google_sub' => $sub,
            'id' => (int) $existing['id'],
        ]);
    } else {
        $randomSecret = bin2hex(random_bytes(24));
        $insertStmt = $pdo->prepare(
            'INSERT INTO users (username, email, google_sub, password_hash)
             VALUES (:username, :email, :google_sub, :password_hash)'
        );
        $insertStmt->execute([
            'username' => $username,
            'email' => $email,
            'google_sub' => $sub,
            'password_hash' => password_hash($randomSecret, PASSWORD_DEFAULT),
        ]);
    }
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while processing Google login.']);
}

send_json(200, [
    'message' => 'Google login successful.',
    'user' => [
        'username' => $username,
        'email' => $email,
    ],
]);

