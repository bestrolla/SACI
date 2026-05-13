<?php
require __DIR__.'/../logica/deudas.php';
require __DIR__.'/../logica/vistas.php';
require __DIR__.'/../logica/tasa.php';
if (isset($_GET['historial'])) {
    header('Content-Type: application/json');
    $id = (int)($_GET['id_cliente'] ?? 0);
    echo json_encode(listarFacturasCliente($id), JSON_UNESCAPED_UNICODE);
    exit;
}
$clientes = listarClientesActivos();
$deudas = listarDeudasPendientes();
$tasa = obtenerTasaActual();
$tasaActual = (float)($tasa['tasa_bolivares'] ?? 0);
?><!doctype html><html><head><meta charset="utf-8"><title>Deudas</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Deudas</h1>

<div class="toolbar">
<label>Filtrar</label>
<input class="filter-input" data-target="#tbl-deudas" placeholder="Buscar...">
<label>Ordenar</label>
<select class="sort-input" data-target="#tbl-deudas">
  <option value="pend_desc">Deuda mayor → menor</option>
  <option value="pend_asc">Deuda menor → mayor</option>
  <option value="name_asc">Cliente A→Z</option>
  <option value="name_desc">Cliente Z→A</option>
  <option value="date_asc">Fecha vieja → nueva</option>
  <option value="date_desc">Fecha nueva → vieja</option>
  </select>
</div>
<table id="tbl-deudas" border="1" cellpadding="6">
<tr>
<th>Cliente</th><th>Alias</th><th>Deuda</th><th>Fecha</th><th>Total</th><th>Pagado</th><th>Pendiente</th><th>Historial</th><th>Estado</th>
</tr>
<?php if (!$deudas): ?>
<tr><td colspan="9">No hay deudas</td></tr>
<?php endif; ?>
<?php foreach($deudas as $d): ?>
<tr>
<td><?=htmlspecialchars((string)$d['nombre_completo'])?></td>
<td><?=htmlspecialchars((string)$d['alias'])?></td>
<td><?=htmlspecialchars((string)$d['descripcion'])?></td>
<td><?=htmlspecialchars((string)$d['fecha_deuda'])?></td>
<?php $tRow = $tasaActual; $mon = (string)($d['moneda'] ?? 'BS'); $mt = (float)($d['monto_total'] ?? 0); $bsTot = $mon==='USD' ? $mt * $tRow : $mt; $usdTot = $tRow>0 ? ($mon==='USD' ? $mt : $mt/$tRow) : 0; $pag = (float)($d['total_pagado'] ?? 0); $pen = (float)($d['deuda_pendiente'] ?? 0); if ((string)($d['estado'] ?? '') === 'PAGADA') { $pen = 0.0; } if ($pen < 0.005) { $pen = 0.0; } $pagBs = $mon==='USD' ? $pag * $tRow : $pag; $pagUsd = $mon==='USD' ? $pag : ($tRow>0 ? $pag/$tRow : 0); $penBs = max(0, ($mon==='USD' ? $pen * $tRow : $pen)); $penUsd = max(0, ($mon==='USD' ? $pen : ($tRow>0 ? $pen/$tRow : 0))); ?>
<td><span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars((string)$bsTot)?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$usdTot,2,'.',''))?></span></span></td>
<td><span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars((string)$pagBs)?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$pagUsd,2,'.',''))?></span></span></td>
<td><span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars((string)$penBs)?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$penUsd,2,'.',''))?></span></span></td>
<?php $idC = (int)($d['id_cliente'] ?? 0); ?>
<td><button type="button" class="btn-historial" data-id-cliente="<?= $idC ? htmlspecialchars((string)$idC) : '' ?>" <?= $idC ? '' : 'disabled' ?>>Historial</button></td>
<?php $estado = (string)($d['estado'] ?? ''); if ($estado === 'VENCIDA') { $estado = 'PARCIAL'; } ?>
<td><?=htmlspecialchars($estado)?></td>
</tr>
<?php endforeach; ?>
</table>
<div id="historial-panel" class="side-panel" aria-hidden="true">
  <div class="panel-header">
    <strong>Historial de facturas</strong>
    <button type="button" class="close-btn" title="Cerrar">✕</button>
  </div>
  <div id="historial-content" class="panel-body"></div>
  <div class="panel-footer"><small class="muted">Se muestran compras por fecha</small></div>
  </div>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
