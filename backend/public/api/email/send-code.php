<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

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

$autoloadPath = __DIR__ . '/../../../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode(['message' => 'Composer dependencies missing. Run composer install in backend/.']);
    exit;
}

require_once $autoloadPath;
require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

$body = read_json_body();
$email = strtolower(trim((string) ($body['email'] ?? '')));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json(400, ['message' => 'Invalid email address.']);
}

if (
    $config['smtp_user'] === '' ||
    $config['smtp_pass'] === '' ||
    $config['smtp_from_email'] === ''
) {
    send_json(500, ['message' => 'SMTP is not configured.']);
}

$code = (string) random_int(100000, 999999);
$expiresAt = date('Y-m-d H:i:s', time() + (int) $config['code_expiry_seconds']);

try {
    $pdo = get_pdo($config);
    $cleanupStmt = $pdo->prepare('DELETE FROM email_verification_codes WHERE expires_at <= NOW()');
    $cleanupStmt->execute();

    $upsertStmt = $pdo->prepare(
        'INSERT INTO email_verification_codes (email, code, expires_at)
         VALUES (:email, :code, :expires_at)
         ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP'
    );
    $upsertStmt->execute([
        'email' => $email,
        'code' => $code,
        'expires_at' => $expiresAt,
    ]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while creating verification code.']);
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $config['smtp_host'];
    $mail->Port = (int) $config['smtp_port'];
    $mail->SMTPAuth = true;
    $mail->Username = $config['smtp_user'];
    $mail->Password = $config['smtp_pass'];
    $mail->SMTPSecure = $mail->Port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;

    $mail->setFrom($config['smtp_from_email'], $config['smtp_from_name']);
    $mail->addAddress($email);
    $mail->Subject = 'Your verification code';
    $mail->Body = "Your verification code is {$code}. It expires in 10 minutes.";

    $mail->send();
    send_json(200, ['message' => 'Verification code sent to your email.']);
} catch (Exception $e) {
    error_log('Email send failed: ' . $e->getMessage());
    send_json(500, ['message' => 'Failed to send verification code.']);
}

