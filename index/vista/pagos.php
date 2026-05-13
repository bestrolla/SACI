<?php
require __DIR__.'/../logica/pagos.php';
require __DIR__.'/../logica/vistas.php';
require __DIR__.'/../logica/tasa.php';
$msg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_deuda = (int)($_POST['id_deuda'] ?? 0);
    $ids_csv = trim((string)($_POST['ids_deudas'] ?? ''));
    $ids_multi = array_values(array_filter(array_map('intval', explode(',', $ids_csv))));
    $moneda = (string)($_POST['moneda'] ?? 'BS');
    $metodo = (string)($_POST['metodo'] ?? 'EFECTIVO');
    $obs = trim((string)($_POST['observaciones'] ?? ''));
    $t = obtenerTasaActual();
    $tasaRef = (float)($t['tasa_bolivares'] ?? 0);
    $pendientes = listarPendientesParaPago();
    $targets = $ids_multi ? $ids_multi : [$id_deuda];
    $info = [];
    foreach ($targets as $did) {
        foreach ($pendientes as $p) {
            if ((int)$p['id_deuda'] === (int)$did) {
                $monDeuda = (string)($p['moneda'] ?? 'BS');
                $pen = (float)($p['deuda_pendiente'] ?? 0);
                $pen_usd = ($monDeuda === 'USD') ? $pen : (($tasaRef>0) ? ($pen / $tasaRef) : 0);
                $info[] = ['id'=>$did,'pend_usd'=>$pen_usd];
                break;
            }
        }
    }
    usort($info, function($a,$b){ return ($a['pend_usd'] <=> $b['pend_usd']); });
    $totalPendUsd = 0.0; foreach ($info as $it) { $totalPendUsd += (float)$it['pend_usd']; }
    if ($metodo === 'BS/$') {
        $pool_bs = (float)($_POST['monto_bs'] ?? 0);
        $pool_usd = (float)($_POST['monto_usd'] ?? 0);
        $pool_usd = $pool_usd + (($tasaRef>0) ? ($pool_bs / $tasaRef) : 0);
        if ($pool_usd > $totalPendUsd) { $pool_usd = $totalPendUsd; }
        if (($id_deuda || $ids_multi) && ($pool_usd > 0)) {
            $ok = true; $lastMsg = '';
            foreach ($info as $it) {
                if ($pool_usd <= 0) break;
                $usd_used = min($pool_usd, $it['pend_usd']);
                $usd_used = round($usd_used, 2);
                if ($usd_used > 0) {
                    $res = registrarPago((int)$it['id'], (float)$usd_used, 'USD', 'BS/$', $obs ?: null);
                    $lastMsg = $res;
                    if (strpos($res, 'Pago registrado') === false) { $ok = false; break; }
                    $pool_usd -= $usd_used;
                }
            }
            if ($ok) { header('Location: deudas.php'); exit; }
            else { $msg = $lastMsg; }
        }
    } else {
        $monto = (float)($_POST['monto'] ?? 0);
        if (($id_deuda || $ids_multi) && $monto > 0) {
            $ok = true; $lastMsg = '';
            if ($moneda === 'USD') {
                $pool_usd = $monto; if ($pool_usd > $totalPendUsd) { $pool_usd = $totalPendUsd; }
                foreach ($info as $it) {
                    if ($pool_usd <= 0) break;
                    $usd_used = min($pool_usd, $it['pend_usd']);
                    $usd_used = round($usd_used, 2);
                    if ($usd_used > 0) {
                        $res = registrarPago((int)$it['id'], (float)$usd_used, 'USD', $metodo, $obs ?: null);
                        $lastMsg = $res;
                        if (strpos($res, 'Pago registrado') === false) { $ok = false; break; }
                        $pool_usd -= $usd_used;
                    }
                }
            } else {
                $pool_bs = $monto; $totalPendBs = $totalPendUsd * $tasaRef; if ($pool_bs > $totalPendBs) { $pool_bs = $totalPendBs; }
                foreach ($info as $it) {
                    if ($pool_bs <= 0) break;
                    $pen_bs = ($tasaRef>0) ? ($it['pend_usd'] * $tasaRef) : 0;
                    $bs_used = min($pool_bs, $pen_bs);
                    $bs_used = round($bs_used, 2);
                    if ($bs_used > 0) {
                        $res = registrarPago((int)$it['id'], (float)$bs_used, 'BS', $metodo, $obs ?: null);
                        $lastMsg = $res;
                        if (strpos($res, 'Pago registrado') === false) { $ok = false; break; }
                        $pool_bs -= $bs_used;
                    }
                }
            }
            if ($ok) { header('Location: deudas.php'); exit; }
            else { $msg = $lastMsg; }
        }
    }
}
$pendientes = listarPendientesParaPago();
$tasa = obtenerTasaActual();
$tasaActual = (float)($tasa['tasa_bolivares'] ?? 0);
?><!doctype html><html><head><meta charset="utf-8"><title>Pagos</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Registrar pago</h1>
<?php if ($msg): ?><p><?=htmlspecialchars($msg)?></p><?php endif; ?>
<form method="post">
<label>Deuda</label>
<div class="autocomplete">
  <input type="text" id="deuda-search" placeholder="Buscar por cliente o descripción" autocomplete="off">
  <input type="hidden" name="id_deuda" id="id_deuda">
  <input type="hidden" name="ids_deudas" id="ids_deudas">
  <div id="deuda-suggest" class="autocomplete-list"></div>
</div>
<div id="deuda-selected" class="selected-debt"></div>
<div id="deuda-pick-list" class="selected-debt"></div>
<label>Monto</label>
<input type="number" step="0.01" name="monto" id="monto" placeholder="Monto" style="display:block">
<div class="dual-amount" style="display:none">
  <input type="number" step="0.01" name="monto_bs" placeholder="Bs" title="Monto en bolívares">
  <input type="number" step="0.01" name="monto_usd" placeholder="$" title="Monto en dólares">
</div>
<label>Moneda</label>
<select name="moneda">
<option>BS</option>
<option>USD</option>
</select>
<label>Método</label>
<select name="metodo">
<option>EFECTIVO</option>
<option>TRANSFERENCIA</option>
<option>TARJETA</option>
<option>PAGO-MOVIL</option>
<option>BIO-PAGO</option>
<option>BS/$</option>
</select>
<label>Observaciones</label>
<input name="observaciones">
<button>Guardar</button>
</form>
<script>
window.__deudasPendientes = <?= json_encode($pendientes, JSON_UNESCAPED_UNICODE) ?>;
window.__tasaActual = <?= json_encode($tasaActual, JSON_UNESCAPED_UNICODE) ?>;
</script>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
