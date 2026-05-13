<?php
declare(strict_types=1);
function db(): PDO {
    $host = getenv('BODEGA_DB_HOST') ?: 'localhost';
    $name = getenv('BODEGA_DB_NAME') ?: 'ControlDeudasBodega';
    $user = getenv('BODEGA_DB_USER') ?: 'root';
    $pass = getenv('BODEGA_DB_PASS') ?: '';
    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Unknown database') !== false) {
            $adminDsn = "mysql:host={$host};charset=utf8mb4";
            $admin = new PDO($adminDsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            $admin->exec("CREATE DATABASE IF NOT EXISTS `{$name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $admin = null;
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            return $pdo;
        }
        throw $e;
    }
}
?>
