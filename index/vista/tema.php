<?php
$path = __DIR__ . '/../logica/theme.csv';
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $theme = 'light';
    if (is_file($path)) {
        $row = trim((string)file_get_contents($path));
        if ($row === 'dark' || $row === 'light') { $theme = $row; }
    }
    echo json_encode(['theme' => $theme], JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $t = strtolower((string)($_POST['theme'] ?? ''));
    if ($t !== 'dark' && $t !== 'light') { echo json_encode(['ok' => false]); exit; }
    @file_put_contents($path, $t);
    echo json_encode(['ok' => true, 'theme' => $t], JSON_UNESCAPED_UNICODE);
    exit;
}
echo json_encode(['ok' => false]);
