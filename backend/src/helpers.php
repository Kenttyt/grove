<?php

declare(strict_types=1);

function send_json(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function ensure_storage_file(string $storageFile): void
{
    $dir = dirname($storageFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    if (!file_exists($storageFile)) {
        file_put_contents($storageFile, json_encode(new stdClass()));
    }
}

function load_json_file(string $storageFile): array
{
    ensure_storage_file($storageFile);
    $json = file_get_contents($storageFile);
    if ($json === false || trim($json) === '') {
        return [];
    }

    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

function save_json_file(string $storageFile, array $data): void
{
    ensure_storage_file($storageFile);
    file_put_contents($storageFile, json_encode($data, JSON_PRETTY_PRINT));
}

function load_codes(string $storageFile): array
{
    return load_json_file($storageFile);
}

function save_codes(string $storageFile, array $codes): void
{
    save_json_file($storageFile, $codes);
}

function cleanup_expired_codes(array $codes): array
{
    $now = time();
    foreach ($codes as $email => $payload) {
        $expiresAt = (int) ($payload['expires_at'] ?? 0);
        if ($expiresAt <= $now) {
            unset($codes[$email]);
        }
    }

    return $codes;
}

