<?php
declare(strict_types=1);

// Single entry point router for Vercel Serverless PHP
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = trim($uri, '/');

// Base directory for vista files
$vistaDir = __DIR__ . '/../index/vista';

// Determine target PHP file
if ($path === '' || $path === 'index.php' || $path === 'home.php') {
    $targetFile = $vistaDir . '/home.php';
} else {
    $filename = basename($path);
    if (!str_ends_with($filename, '.php')) {
        $filename .= '.php';
    }
    
    $candidate = $vistaDir . '/' . $filename;
    if (file_exists($candidate)) {
        $targetFile = $candidate;
    } else {
        $targetFile = $vistaDir . '/home.php';
    }
}

if (file_exists($targetFile)) {
    chdir(dirname($targetFile));
    require $targetFile;
} else {
    http_response_code(404);
    echo "Página no encontrada";
}
