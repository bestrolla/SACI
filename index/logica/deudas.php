<?php
require_once __DIR__.'/db.php';
function crearDeudaSP(int $id_cliente, string $descripcion, float $monto, string $moneda, string $fecha_deuda, ?string $fecha_venc, ?string $obs): void {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('CALL RegistrarDeuda(?,?,?,?,?,?,?)');
        $stmt->execute([$id_cliente, $descripcion, $monto, $moneda, $fecha_deuda, $fecha_venc, $obs]);
    } catch (PDOException $e) {
        $tasa = null;
        try {
            $t = $pdo->query('SELECT tasa_bolivares FROM TasaDolar ORDER BY fecha_tasa DESC LIMIT 1')->fetch();
            $tasa = $t ? (float)$t['tasa_bolivares'] : null;
        } catch (PDOException $e2) {}
        $stmt = $pdo->prepare('INSERT INTO Deudas (id_cliente, descripcion, monto_total, moneda, tasa_dolar_dia, fecha_deuda, fecha_vencimiento, observaciones) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([$id_cliente, $descripcion, $monto, $moneda, $tasa, $fecha_deuda, $fecha_venc, $obs]);
    }
}
?>
