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
$username = trim((string) (($body['username'] ?? '') !== '' ? $body['username'] : ($body['name'] ?? '')));
$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');
$confirmPassword = (string) ($body['confirmPassword'] ?? '');

if ($username === '' || $email === '' || $password === '' || $confirmPassword === '') {
    send_json(400, ['message' => 'Please fill in all fields.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['message' => 'Please use a valid email address.']);
}

if (mb_strlen($username) > 18) {
    send_json(400, ['message' => 'Username must be 18 characters or less.']);
}

if (strlen($password) < 8) {
    send_json(400, ['message' => 'Password must be at least 8 characters.']);
}

if ($password !== $confirmPassword) {
    send_json(400, ['message' => 'Passwords do not match.']);
}

try {
    $pdo = get_pdo($config);
    $checkStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $checkStmt->execute(['email' => $email]);
    if ($checkStmt->fetch()) {
        send_json(409, ['message' => 'Email is already registered.']);
    }

    $insertStmt = $pdo->prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (:username, :email, :password_hash)'
    );
    $insertStmt->execute([
        'username' => $username,
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while creating account.']);
}

send_json(201, [
    'message' => 'Account created successfully.',
    'user' => [
        'username' => $username,
        'name' => $username,
        'email' => $email,
    ],
]);

