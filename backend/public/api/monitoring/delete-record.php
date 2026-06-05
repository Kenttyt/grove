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
$deleteEntireHistory = isset($input['delete_entire_history']) ? (bool) $input['delete_entire_history'] : false;

if ($recordId <= 0) {
    send_json(400, ['message' => 'Invalid record ID.']);
}

try {
    $pdo = get_pdo($config);
    
    // First, get the record to check if it exists and get details
    $stmt = $pdo->prepare('SELECT site_name, photo_path FROM monitoring_records WHERE id = ?');
    $stmt->execute([$recordId]);
    $record = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$record) {
        send_json(404, ['message' => 'Record not found.']);
    }
    
    if ($deleteEntireHistory && !empty($record['site_name'])) {
        $siteName = $record['site_name'];
        // Fetch all photo paths for this site name to clean them up
        $photoStmt = $pdo->prepare('SELECT photo_path FROM monitoring_records WHERE site_name = ?');
        $photoStmt->execute([$siteName]);
        $photos = $photoStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($photos as $p) {
            if (!empty($p['photo_path'])) {
                $photoPath = __DIR__ . '/../../../' . $p['photo_path'];
                if (file_exists($photoPath)) {
                    @unlink($photoPath);
                }
            }
        }
        
        // Delete all records with this site name
        $deleteStmt = $pdo->prepare('DELETE FROM monitoring_records WHERE site_name = ?');
        $deleteStmt->execute([$siteName]);
        
        send_json(200, ['message' => 'Entire site history deleted successfully.']);
    } else {
        // Delete the single photo if it exists
        if ($record['photo_path']) {
            $photoPath = __DIR__ . '/../../../' . $record['photo_path'];
            if (file_exists($photoPath)) {
                @unlink($photoPath);
            }
        }
        
        // Delete the single record
        $stmt = $pdo->prepare('DELETE FROM monitoring_records WHERE id = ?');
        $stmt->execute([$recordId]);
        
        send_json(200, ['message' => 'Record deleted successfully.']);
    }
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while deleting the record.']);
}
