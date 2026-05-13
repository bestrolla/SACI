<?php
require_once __DIR__.'/db.php';
function obtenerTasaActual(): ?array {
    $pdo = db();
    try {
        $row = $pdo->query('SELECT * FROM VistaTasaActual')->fetch();
        if ($row) return $row;
    } catch (PDOException $e) {}
    try {
        $row = $pdo->query('SELECT * FROM TasaDolar ORDER BY fecha_tasa DESC LIMIT 1')->fetch();
        if ($row) return $row;
    } catch (PDOException $e) {}
    return null;
}
function listarTasas(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT * FROM TasaDolar ORDER BY fecha_tasa DESC')->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}
function registrarTasa(string $fecha, float $tasa, string $fuente = 'BCV', ?string $obs = null): string {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('CALL RegistrarTasaDolar(?,?,?,?)');
        $stmt->execute([$fecha, $tasa, $fuente, $obs]);
        return 'Tasa registrada/actualizada';
    } catch (PDOException $e) {
        try {
            $stmt = $pdo->prepare('INSERT INTO TasaDolar (fecha_tasa, tasa_bolivares, fuente, observaciones) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE tasa_bolivares=VALUES(tasa_bolivares), fuente=VALUES(fuente), observaciones=VALUES(observaciones)');
            $stmt->execute([$fecha, $tasa, $fuente, $obs]);
            return 'Tasa registrada/actualizada';
        } catch (PDOException $e2) {
            return 'No se pudo registrar la tasa: '.$e2->getMessage();
        }
    }
}
?>
