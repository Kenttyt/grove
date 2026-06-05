<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');
$role = trim((string) ($body['role'] ?? 'worker'));

if ($username === '' || $password === '') {
    send_json(400, ['message' => 'Username and password are required.']);
}

if (mb_strlen($username) > 18) {
    send_json(400, ['message' => 'Username must be 18 characters or less.']);
}

if (strlen($password) < 8) {
    send_json(400, ['message' => 'Password must be at least 8 characters.']);
}

if (!in_array($role, ['admin', 'worker'])) {
    send_json(400, ['message' => 'Role must be either admin or worker.']);
}

try {
    $pdo = get_pdo($config);
    
    // Check if username already exists
    $checkUsernameStmt = $pdo->prepare('SELECT id FROM users WHERE username = :username LIMIT 1');
    $checkUsernameStmt->execute(['username' => $username]);
    if ($checkUsernameStmt->fetch()) {
        send_json(409, ['message' => 'Username is already taken.']);
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO users (username, password_hash, role) VALUES (:username, :password_hash, :role)'
    );
    $insertStmt->execute([
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'role' => $role,
    ]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while creating user.']);
}

send_json(201, [
    'message' => 'User created successfully.',
    'user' => [
        'username' => $username,
        'role' => $role,
    ],
]);
