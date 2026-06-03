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
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    send_json(400, ['message' => 'Please enter both email and password.']);
}

try {
    $pdo = get_pdo($config);
    $stmt = $pdo->prepare('SELECT username, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while logging in.']);
}

if (!$user || !isset($user['password_hash']) || !password_verify($password, (string) $user['password_hash'])) {
    send_json(401, ['message' => 'Invalid email or password.']);
}

send_json(200, [
    'message' => 'Login successful.',
    'user' => [
        'username' => (string) ($user['username'] ?? ''),
        'name' => (string) ($user['username'] ?? ''),
        'email' => (string) ($user['email'] ?? $email),
    ],
]);

