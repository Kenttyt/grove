<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

try {
    $pdo = get_pdo($config);
    
    $stmt = $pdo->prepare('SELECT id, name, username, role, last_activity, status, created_at FROM users ORDER BY created_at DESC');
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    send_json(200, ['users' => $users]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while fetching users.']);
}
