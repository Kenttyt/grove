<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

$body = read_json_body();
$userId = (int) ($body['userId'] ?? 0);

if ($userId === 0) {
    send_json(400, ['message' => 'User ID is required.']);
}

try {
    $pdo = get_pdo($config);
    
    // Delete user
    $deleteStmt = $pdo->prepare('DELETE FROM users WHERE id = :userId');
    $deleteStmt->execute(['userId' => $userId]);
    
    if ($deleteStmt->rowCount() === 0) {
        send_json(404, ['message' => 'User not found.']);
    }

    send_json(200, ['message' => 'User deleted successfully.']);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while deleting user.']);
}
