<?php

declare(strict_types=1);

$z = isset($_GET['z']) ? (int) $_GET['z'] : null;
$x = isset($_GET['x']) ? (int) $_GET['x'] : null;
$y = isset($_GET['y']) ? (int) $_GET['y'] : null;
$provider = isset($_GET['provider']) ? (string) $_GET['provider'] : 'carto';

if ($z === null || $x === null || $y === null) {
  http_response_code(400);
  echo 'Missing tile coordinates.';
  exit;
}

if ($z < 0 || $x < 0 || $y < 0) {
  http_response_code(400);
  echo 'Invalid tile coordinates.';
  exit;
}

$tileUrl = '';

switch ($provider) {
  case 'osm':
    $subdomain = ['a', 'b', 'c'][($x + $y) % 3];
    $tileUrl = "https://{$subdomain}.tile.openstreetmap.org/{$z}/{$x}/{$y}.png";
    break;
  case 'esri':
    $tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{$z}/{$y}/{$x}";
    break;
  case 'carto':
  default:
    $subdomain = ['a', 'b', 'c', 'd'][($x + $y) % 4];
    $tileUrl = "https://{$subdomain}.basemaps.cartocdn.com/light_all/{$z}/{$x}/{$y}.png";
    break;
}

$ch = curl_init($tileUrl);
if ($ch === false) {
  http_response_code(500);
  echo 'Unable to initialize tile request.';
  exit;
}

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
curl_setopt($ch, CURLOPT_TIMEOUT, 12);
curl_setopt($ch, CURLOPT_USERAGENT, 'LeoWorksMapProxy/1.0');

$data = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);

curl_close($ch);

if ($data === false || $httpCode !== 200) {
  http_response_code(502);
  echo $curlError ? "Tile fetch failed: {$curlError}" : 'Tile fetch failed.';
  exit;
}

header('Content-Type: ' . ($contentType ?: 'image/png'));
header('Cache-Control: public, max-age=86400');

echo $data;
