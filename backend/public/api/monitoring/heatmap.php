<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json');

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

    // Get ONLY the latest monitoring record per unique site (by site_name).
    // This ensures 1 site = 1 heatmap point regardless of how many
    // monitoring visits have been recorded.
    $stmt = $pdo->query(
        'SELECT
            m.latitude,
            m.longitude,
            m.number_seedlings,
            m.growing_count,
            m.at_risk_count,
            m.dead_count,
            m.condition_status,
            m.survival_status
        FROM monitoring_records m
        INNER JOIN (
            SELECT site_name, MAX(monitoring_date) AS latest_date
            FROM monitoring_records
            WHERE status = "published"
              AND latitude  IS NOT NULL
              AND longitude IS NOT NULL
            GROUP BY site_name
        ) AS latest
          ON m.site_name      = latest.site_name
         AND m.monitoring_date = latest.latest_date
        WHERE m.status = "published"'
    );

    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $healthy = [];
    $atRisk  = [];
    $dead    = [];

    foreach ($records as $row) {
        $lat = filter_var($row['latitude'],  FILTER_VALIDATE_FLOAT);
        $lng = filter_var($row['longitude'], FILTER_VALIDATE_FLOAT);

        if ($lat === false || $lng === false) {
            continue;
        }

        $total    = max(1, (int) $row['number_seedlings']);
        $atRiskN  = max(0, (int) $row['at_risk_count']);
        $deadN    = max(0, (int) $row['dead_count']);

        $survival  = strtolower(trim((string) $row['survival_status']));
        $condition = strtolower(trim((string) $row['condition_status']));

        // ── Healthy / Surviving layer ──────────────────────────────────
        $survivingN    = max(0, $total - $atRiskN - $deadN);
        $healthyWeight = round($survivingN / $total, 4);

        if (in_array($survival, ['surviving', 'newly planted'], true) || $condition === 'good') {
            $healthyWeight = max($healthyWeight, 0.6);
        }

        if ($healthyWeight > 0.0) {
            $healthy[] = [$lat, $lng, $healthyWeight];
        }

        // ── At-Risk layer ───────────────────────────────────────────────
        $atRiskWeight = round($atRiskN / $total, 4);

        if ($survival === 'at risk' || $condition === 'fair') {
            $atRiskWeight = max($atRiskWeight, 0.5);
        }

        if ($atRiskWeight > 0.0) {
            $atRisk[] = [$lat, $lng, $atRiskWeight];
        }

        // ── Dead layer ──────────────────────────────────────────────────
        $deadWeight = round($deadN / $total, 4);

        if (in_array($survival, ['dead', 'not surviving'], true) || $condition === 'poor') {
            $deadWeight = max($deadWeight, 0.5);
        }

        if ($deadWeight > 0.0) {
            $dead[] = [$lat, $lng, $deadWeight];
        }
    }

    echo json_encode([
        'healthy' => $healthy,
        'at_risk' => $atRisk,
        'dead'    => $dead,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error while retrieving heatmap data.']);
}
