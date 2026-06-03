<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Content-Type: application/json');

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

$input = json_decode(file_get_contents('php://input'), true);
$recordId = isset($input['id']) ? (int) $input['id'] : 0;

if ($recordId <= 0) {
    send_json(400, ['message' => 'Invalid record ID.']);
}

try {
    $pdo = get_pdo($config);
    
    // First, get the record to check if it exists and get photo path
    $stmt = $pdo->prepare('SELECT photo_path FROM monitoring_records WHERE id = ?');
    $stmt->execute([$recordId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        send_json(404, ['message' => 'Record not found.']);
    }
    
    // Delete the photo if it exists
    if ($record['photo_path']) {
        $photoPath = __DIR__ . '/../../../' . $record['photo_path'];
        if (file_exists($photoPath)) {
            @unlink($photoPath);
        }
    }
    
    // Delete the record
    $stmt = $pdo->prepare('DELETE FROM monitoring_records WHERE id = ?');
    $stmt->execute([$recordId]);
    
    send_json(200, ['message' => 'Record deleted successfully.']);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while deleting the record.']);
}
