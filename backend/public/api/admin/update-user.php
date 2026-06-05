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
$userId = (int) ($body['userId'] ?? 0);
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');
$role = (string) ($body['role'] ?? '');

if ($userId === 0) {
    send_json(400, ['message' => 'User ID is required.']);
}

if ($username === '') {
    send_json(400, ['message' => 'Username cannot be empty.']);
}

if (mb_strlen($username) > 18) {
    send_json(400, ['message' => 'Username must be 18 characters or less.']);
}

if (!in_array($role, ['admin', 'worker'])) {
    send_json(400, ['message' => 'Invalid role.']);
}

try {
    $pdo = get_pdo($config);
    
    // Check if username already exists (excluding current user)
    $checkUsernameStmt = $pdo->prepare('SELECT id FROM users WHERE username = :username AND id != :userId LIMIT 1');
    $checkUsernameStmt->execute(['username' => $username, 'userId' => $userId]);
    if ($checkUsernameStmt->fetch()) {
        send_json(409, ['message' => 'Username is already taken.']);
    }

    // Build update query dynamically based on what fields are provided
    $updateFields = ['username = :username', 'role = :role'];
    $params = [
        'username' => $username,
        'role' => $role,
        'userId' => $userId,
    ];

    // Only update password if provided
    if ($password !== '') {
        if (strlen($password) < 8) {
            send_json(400, ['message' => 'Password must be at least 8 characters.']);
        }
        $updateFields[] = 'password_hash = :password_hash';
        $params['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $updateFields) . ' WHERE id = :userId';
    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);
    
    if ($updateStmt->rowCount() === 0) {
        send_json(404, ['message' => 'User not found.']);
    }

    send_json(200, ['message' => 'User updated successfully.']);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while updating user.']);
}
