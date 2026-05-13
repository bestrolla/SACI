<?php
require_once __DIR__.'/db.php';
function obtenerResumen(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT * FROM VistaResumenDeudas ORDER BY total_deudado_bs DESC')->fetchAll();
    } catch (PDOException $e) {
        try {
            return $pdo->query('SELECT 
                c.id_cliente,
                CONCAT(c.nombre, " ", c.apellido) AS nombre_completo,
                c.alias,
                COUNT(d.id_deuda) AS total_deudas,
                COALESCE(SUM(CASE WHEN d.moneda="USD" THEN d.monto_total * COALESCE(d.tasa_dolar_dia,0) ELSE d.monto_total END),0) AS total_deudado_bs,
                COALESCE(SUM(CASE WHEN d.moneda="USD" THEN d.monto_total ELSE CASE WHEN COALESCE(d.tasa_dolar_dia,0)>0 THEN d.monto_total / COALESCE(d.tasa_dolar_dia,0) ELSE 0 END END),0) AS total_deudado_usd,
                COALESCE(SUM(
                  GREATEST(0,
                    (CASE WHEN d.moneda="USD" THEN d.monto_total * COALESCE(d.tasa_dolar_dia,0) ELSE d.monto_total END)
                    - COALESCE((
                      SELECT SUM(CASE 
                        WHEN pg.moneda="USD" THEN pg.monto_pago * COALESCE(pg.tasa_dolar_dia, COALESCE(d.tasa_dolar_dia,0)) 
                        ELSE pg.monto_pago 
                      END) 
                      FROM Pagos pg WHERE pg.id_deuda=d.id_deuda
                    ),0)
                  )
                ),0) AS deuda_pendiente
            FROM Clientes c 
            LEFT JOIN Deudas d ON d.id_cliente=c.id_cliente 
            GROUP BY c.id_cliente, c.nombre, c.apellido, c.alias 
            ORDER BY total_deudado_bs DESC')->fetchAll();
        } catch (PDOException $e2) {
            return [];
        }
    }
}
function listarDeudasPendientes(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT * FROM VistaDeudasClientes ORDER BY fecha_deuda DESC')->fetchAll();
    } catch (PDOException $e) {
        try {
            return $pdo->query('SELECT 
                c.id_cliente,
                d.id_deuda,
                CONCAT(c.nombre, " ", c.apellido) AS nombre_completo,
                c.alias,
                d.descripcion,
                d.fecha_deuda,
                d.moneda,
                d.monto_total,
                d.tasa_dolar_dia,
                d.estado,
                COALESCE(SUM(
                    CASE 
                        WHEN pg.moneda="USD" THEN (CASE WHEN d.moneda="USD" THEN pg.monto_pago ELSE pg.monto_pago * COALESCE(pg.tasa_dolar_dia,0) END)
                        ELSE (CASE WHEN d.moneda="USD" THEN (CASE WHEN COALESCE(pg.tasa_dolar_dia,0)>0 THEN pg.monto_pago/COALESCE(pg.tasa_dolar_dia,0) ELSE 0 END) ELSE pg.monto_pago END)
                    END
                ),0) AS total_pagado,
                ROUND(GREATEST(0, (d.monto_total - COALESCE(SUM(
                    CASE 
                        WHEN pg.moneda="USD" THEN (CASE WHEN d.moneda="USD" THEN pg.monto_pago ELSE pg.monto_pago * COALESCE(pg.tasa_dolar_dia,0) END)
                        ELSE (CASE WHEN d.moneda="USD" THEN (CASE WHEN COALESCE(pg.tasa_dolar_dia,0)>0 THEN pg.monto_pago/COALESCE(pg.tasa_dolar_dia,0) ELSE 0 END) ELSE pg.monto_pago END)
                    END
                ),0))), 2) AS deuda_pendiente
            FROM Deudas d 
            INNER JOIN Clientes c ON c.id_cliente=d.id_cliente 
            LEFT JOIN Pagos pg ON pg.id_deuda=d.id_deuda 
            GROUP BY c.id_cliente, d.id_deuda, c.nombre, c.apellido, c.alias, d.descripcion, d.fecha_deuda, d.moneda, d.monto_total, d.tasa_dolar_dia, d.estado 
            ORDER BY d.fecha_deuda DESC')->fetchAll();
        } catch (PDOException $e2) {
            return [];
        }
    }
}
function listarPendientesParaPago(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT id_deuda, nombre_completo, descripcion, monto_total, moneda, total_pagado, deuda_pendiente, tasa_dolar_dia FROM VistaDeudasClientes WHERE estado <> "PAGADA" ORDER BY fecha_deuda DESC')->fetchAll();
    } catch (PDOException $e) {
        try {
            $rows = $pdo->query('SELECT 
                d.id_deuda,
                CONCAT(c.nombre, " ", c.apellido) AS nombre_completo,
                d.descripcion,
                d.monto_total,
                d.moneda,
                d.tasa_dolar_dia,
                COALESCE(SUM(
                    CASE 
                        WHEN pg.moneda="USD" THEN (CASE WHEN d.moneda="USD" THEN pg.monto_pago ELSE pg.monto_pago * COALESCE(pg.tasa_dolar_dia,0) END)
                        ELSE (CASE WHEN d.moneda="USD" THEN (CASE WHEN COALESCE(pg.tasa_dolar_dia,0)>0 THEN pg.monto_pago/COALESCE(pg.tasa_dolar_dia,0) ELSE 0 END) ELSE pg.monto_pago END)
                    END
                ),0) AS total_pagado,
                ROUND(GREATEST(0, (d.monto_total - COALESCE(SUM(
                    CASE 
                        WHEN pg.moneda="USD" THEN (CASE WHEN d.moneda="USD" THEN pg.monto_pago ELSE pg.monto_pago * COALESCE(pg.tasa_dolar_dia,0) END)
                        ELSE (CASE WHEN d.moneda="USD" THEN (CASE WHEN COALESCE(pg.tasa_dolar_dia,0)>0 THEN pg.monto_pago/COALESCE(pg.tasa_dolar_dia,0) ELSE 0 END) ELSE pg.monto_pago END)
                    END
                ),0))), 2) AS deuda_pendiente
            FROM Deudas d 
            INNER JOIN Clientes c ON c.id_cliente=d.id_cliente 
            LEFT JOIN Pagos pg ON pg.id_deuda=d.id_deuda 
            WHERE d.estado <> "PAGADA" 
            GROUP BY d.id_deuda, c.nombre, c.apellido, d.descripcion, d.monto_total, d.moneda, d.tasa_dolar_dia 
            ORDER BY d.fecha_deuda DESC')->fetchAll();
            return $rows;
        } catch (PDOException $e2) {
            return [];
        }
    }
}
function listarClientesActivos(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT id_cliente, nombre, apellido, alias FROM Clientes WHERE estado="ACTIVO" ORDER BY nombre')->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}
function resumenGeneral(): array {
    $pdo = db();
    try {
        $tot = $pdo->query('SELECT COUNT(*) as total_deudas, SUM(monto_total_bs) as total_deudado_bs, SUM(monto_total_usd) as total_deudado_usd FROM VistaDeudasClientes')->fetch();
        $rows = $pdo->query('SELECT moneda, tasa_dolar_dia, deuda_pendiente FROM VistaDeudasClientes')->fetchAll();
        $pend_bs = 0.0; $pend_usd = 0.0;
        foreach ($rows as $r) {
            $m = $r['moneda']; $t = (float)$r['tasa_dolar_dia']; $p = (float)$r['deuda_pendiente'];
            if ($m === 'USD') { $pend_bs += $p * $t; $pend_usd += $p; }
            else { $pend_bs += $p; $pend_usd += $t>0 ? ($p / $t) : 0; }
        }
        return [
            'total_deudas' => (int)($tot['total_deudas'] ?? 0),
            'total_deudado_bs' => (float)($tot['total_deudado_bs'] ?? 0),
            'total_deudado_usd' => (float)($tot['total_deudado_usd'] ?? 0),
            'total_pendiente_bs' => $pend_bs,
            'total_pendiente_usd' => $pend_usd,
        ];
    } catch (PDOException $e) {
        $rows = [];
        try {
            $rows = $pdo->query('SELECT 
                d.id_deuda,
                d.moneda,
                d.tasa_dolar_dia,
                d.monto_total,
                COALESCE(SUM(
                    CASE 
                        WHEN pg.moneda="USD" THEN (CASE WHEN d.moneda="USD" THEN pg.monto_pago ELSE pg.monto_pago * COALESCE(pg.tasa_dolar_dia,0) END)
                        ELSE (CASE WHEN d.moneda="USD" THEN (CASE WHEN COALESCE(pg.tasa_dolar_dia,0)>0 THEN pg.monto_pago/COALESCE(pg.tasa_dolar_dia,0) ELSE 0 END) ELSE pg.monto_pago END)
                    END
                ),0) AS total_pagado
            FROM Deudas d 
            LEFT JOIN Pagos pg ON pg.id_deuda=d.id_deuda 
            GROUP BY d.id_deuda, d.moneda, d.tasa_dolar_dia, d.monto_total')->fetchAll();
        } catch (PDOException $e2) {}
        $total_deudas = count($rows);
        $bsTot = 0.0; $usdTot = 0.0; $pend_bs = 0.0; $pend_usd = 0.0;
        foreach ($rows as $r) {
            $m = (string)($r['moneda'] ?? 'BS');
            $t = (float)($r['tasa_dolar_dia'] ?? 0);
            $mt = (float)($r['monto_total'] ?? 0);
            $tp = (float)($r['total_pagado'] ?? 0);
            $bsTot += ($m === 'USD') ? ($mt * $t) : $mt;
            $usdTot += ($m === 'USD') ? $mt : ($t>0 ? ($mt / $t) : 0);
            $pend = $mt - $tp;
            $pend_bs += ($m === 'USD') ? ($pend * $t) : $pend;
            $pend_usd += ($m === 'USD') ? $pend : ($t>0 ? ($pend / $t) : 0);
        }
        return [
            'total_deudas' => $total_deudas,
            'total_deudado_bs' => $bsTot,
            'total_deudado_usd' => $usdTot,
            'total_pendiente_bs' => $pend_bs,
            'total_pendiente_usd' => $pend_usd,
        ];
    }
}
function modoRespaldo(): bool {
    $pdo = db();
    try {
        $pdo->query('SELECT 1 FROM VistaDeudasClientes LIMIT 1');
        $pdo->query('SELECT 1 FROM VistaResumenDeudas LIMIT 1');
        return false;
    } catch (PDOException $e) {
        return true;
    }
}
function listarFacturasCliente(int $id_cliente): array {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('SELECT id_deuda, descripcion, fecha_deuda, monto_total, moneda, tasa_dolar_dia FROM Deudas WHERE id_cliente=? ORDER BY fecha_deuda DESC');
        $stmt->execute([$id_cliente]);
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        try {
            $stmt = $pdo->prepare('SELECT d.id_deuda, d.descripcion, d.fecha_deuda, d.monto_total, d.moneda, d.tasa_dolar_dia FROM Deudas d INNER JOIN Clientes c ON c.id_cliente=d.id_cliente WHERE c.id_cliente=? ORDER BY d.fecha_deuda DESC');
            $stmt->execute([$id_cliente]);
            return $stmt->fetchAll();
        } catch (PDOException $e2) {
            return [];
        }
    }
}
