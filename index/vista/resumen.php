<?php
require __DIR__.'/../logica/vistas.php';
require __DIR__.'/../logica/tasa.php';
$rows = obtenerResumen();
$tasa = obtenerTasaActual();
$tasaActual = (float)($tasa['tasa_bolivares'] ?? 0);
?><!doctype html><html><head><meta charset="utf-8"><title>Resumen</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Resumen de deudas</h1>
<div class="toolbar">
<label>Filtrar</label>
<input class="filter-input" data-target="#tbl-resumen" placeholder="Buscar...">
<label>Ordenar</label>
<select class="sort-input" data-target="#tbl-resumen">
  <option value="pend_desc">Deuda mayor → menor</option>
  <option value="pend_asc">Deuda menor → mayor</option>
  <option value="name_asc">Cliente A→Z</option>
  <option value="name_desc">Cliente Z→A</option>
  </select>
</div>
<table id="tbl-resumen" border="1" cellpadding="6">
<tr>
<th>ID</th><th>Cliente</th><th>Alias</th><th># Deudas</th><th>Total</th><th>Pendiente</th>
</tr>
<?php if (!$rows): ?>
<tr><td colspan="6">No hay datos</td></tr>
<?php endif; ?>
<?php foreach($rows as $r): ?>
<tr>
<td><?=htmlspecialchars((string)$r['id_cliente'])?></td>
<td><?=htmlspecialchars((string)$r['nombre_completo'])?></td>
<td><?=htmlspecialchars((string)$r['alias'])?></td>
<td><?=htmlspecialchars((string)$r['total_deudas'])?></td>
<?php $bs = isset($r['total_deudado_bs']) ? (float)$r['total_deudado_bs'] : (float)($r['total_deudado'] ?? 0); $usd = isset($r['total_deudado_usd']) ? (float)$r['total_deudado_usd'] : ($tasaActual>0 ? $bs/$tasaActual : 0); $pendBs = isset($r['deuda_pendiente_bs']) ? (float)$r['deuda_pendiente_bs'] : (float)($r['deuda_pendiente'] ?? 0); $pendBs = max(0,$pendBs); $pendUsd = $tasaActual>0 ? $pendBs/$tasaActual : 0; ?>
<td><span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars(number_format((float)$bs,2,'.',''))?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$usd,2,'.',''))?></span></span></td>
<td><span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars(number_format((float)$pendBs,2,'.',''))?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$pendUsd,2,'.',''))?></span></span></td>
</tr>
<?php endforeach; ?>
</table>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
