<?php
require_once __DIR__.'/db.php';
function registrarPago(int $id_deuda, float $monto, string $moneda, string $metodo, ?string $obs): string {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('CALL RegistrarPago(?,?,?,?,?)');
        $stmt->execute([$id_deuda, $monto, $moneda, $metodo, $obs]);
        return 'Pago registrado';
    } catch (PDOException $e) {
        try {
            $d = $pdo->prepare('SELECT monto_total, fecha_vencimiento, moneda FROM Deudas WHERE id_deuda=?');
            $d->execute([$id_deuda]);
            $deuda = $d->fetch();
            if (!$deuda) return 'Deuda no encontrada';
            $actual = (float)$deuda['monto_total'];
            $monDeuda = (string)$deuda['moneda'];
            $tp = $pdo->prepare('SELECT moneda, monto_pago, tasa_dolar_dia FROM Pagos WHERE id_deuda=?');
            $tp->execute([$id_deuda]);
            $total_pagado = 0.0;
            foreach ($tp->fetchAll() as $p) {
                $pm = (string)($p['moneda'] ?? 'BS');
                $pmonto = (float)($p['monto_pago'] ?? 0);
                $ptasa = (float)($p['tasa_dolar_dia'] ?? 0);
                if ($pm === 'USD') {
                    $total_pagado += ($monDeuda === 'USD') ? $pmonto : ($pmonto * $ptasa);
                } else {
                    $total_pagado += ($monDeuda === 'USD') ? ($ptasa>0 ? ($pmonto / $ptasa) : 0) : $pmonto;
                }
            }
            // Ajustar el monto ingresado al mismo sistema de moneda de la deuda para validar
            $tasaRef = null;
            try {
                $t = $pdo->query('SELECT tasa_bolivares FROM TasaDolar ORDER BY fecha_tasa DESC LIMIT 1')->fetch();
                $tasaRef = $t ? (float)$t['tasa_bolivares'] : null;
            } catch (PDOException $e3) {}
            if ($moneda === 'USD') {
                $monto_en_moneda_deuda = ($monDeuda === 'USD') ? $monto : ($monto * (float)($tasaRef ?? 0));
            } else {
                $monto_en_moneda_deuda = ($monDeuda === 'USD') ? (((float)($tasaRef ?? 0) > 0) ? ($monto / (float)$tasaRef) : 0) : $monto;
            }
            if (($total_pagado + $monto_en_moneda_deuda) > $actual) return 'El pago excede el monto de la deuda';
            $tasa = $tasaRef;
            $hoy = date('Y-m-d');
            $ins = $pdo->prepare('INSERT INTO Pagos (id_deuda, fecha_pago, monto_pago, moneda, tasa_dolar_dia, metodo_pago, observaciones) VALUES (?,?,?,?,?,?,?)');
            $ins->execute([$id_deuda, $hoy, $monto, $moneda, $tasa, $metodo, $obs]);
            if (($total_pagado + $monto_en_moneda_deuda) >= $actual) {
                $pdo->prepare('UPDATE Deudas SET estado="PAGADA" WHERE id_deuda=?')->execute([$id_deuda]);
            } else {
                $fv = $deuda['fecha_vencimiento'];
                if ($fv && $fv < $hoy) {
                    $pdo->prepare('UPDATE Deudas SET estado="PARCIAL" WHERE id_deuda=?')->execute([$id_deuda]);
                }
            }
            return 'Pago registrado';
        } catch (PDOException $e2) {
            return $e2->getMessage();
        }
    }
}
?>
