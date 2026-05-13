<?php
require __DIR__.'/../logica/tasa.php';
require __DIR__.'/../logica/vistas.php';
$tasa = obtenerTasaActual();
$hist = listarTasas();
$sum = resumenGeneral();
?><!doctype html><html><head><meta charset="utf-8"><title>Bodega</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Bodega</h1>
<?php
require_once __DIR__.'/../logica/vistas.php';
$fallback = false;
try { $fallback = modoRespaldo(); } catch (Throwable $e) { $fallback = true; }
if ($fallback): ?>
<div style="margin:8px 0 16px;padding:10px;border:1px solid var(--primary);background:var(--hover);border-radius:8px;color:var(--fg)">
Modo respaldo activo: faltan vistas/tablas. Importa el SQL para habilitar todo.
</div>
<?php endif; ?>
<section>
<h2>Resumen general</h2>
<div style="display:flex;gap:16px;flex-wrap:wrap">
  <div style="flex:1;min-width:220px;border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--surface)">
    <div><strong>Total de deudas:</strong> <?=htmlspecialchars((string)$sum['total_deudas'])?></div>
    <div><strong>Total:</strong> <span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars((string)$sum['total_deudado_bs'])?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$sum['total_deudado_usd'],2,'.',''))?></span></span></div>
    <div><strong>Pendiente:</strong> <span class="amount"><span class="bs"><?= 'Bs ' . htmlspecialchars((string)$sum['total_pendiente_bs'])?></span><span class="usd"><?= '$ ' . htmlspecialchars(number_format((float)$sum['total_pendiente_usd'],2,'.',''))?></span></span></div>
  </div>
</div>
</section>
<section>
<h2>Tasa del día</h2>
<div style="display:flex;gap:16px;flex-wrap:wrap">
  <div style="flex:1;min-width:280px;border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--surface)">
    <div><strong>Fecha:</strong> <?=htmlspecialchars((string)($tasa['fecha_tasa'] ?? ''))?></div>
    <div><strong>Tasa (Bs/USD):</strong> <?=htmlspecialchars((string)($tasa['tasa_bolivares'] ?? ''))?></div>
    <div><strong>Fuente:</strong> <?=htmlspecialchars((string)($tasa['fuente'] ?? ''))?></div>
    <div><strong>Observaciones:</strong> <?=htmlspecialchars((string)($tasa['observaciones'] ?? ''))?></div>
  </div>
  <div style="flex:1;min-width:280px;border:1px solid var(--border);border-radius:8px;padding:12px;background:var(--surface)">
    <form method="post" action="registrar_tasa.php">
      <label>Fecha</label>
      <input type="date" name="fecha" required value="<?=htmlspecialchars((string)($tasa['fecha_tasa'] ?? ''))?>">
      <label>Tasa Bs/USD</label>
      <input type="number" step="0.01" name="tasa" required value="<?=htmlspecialchars((string)($tasa['tasa_bolivares'] ?? ''))?>">
      <label>Fuente</label>
      <input name="fuente" value="<?=htmlspecialchars((string)($tasa['fuente'] ?? 'BCV'))?>">
      <label>Observaciones</label>
      <input name="observaciones" value="<?=htmlspecialchars((string)($tasa['observaciones'] ?? ''))?>">
      <button>Guardar tasa</button>
    </form>
  </div>
</div>
</section>
<section>
<h2>Historial de tasas</h2>
<table border="1" cellpadding="6">
<tr><th>Fecha</th><th>Tasa Bs/USD</th><th>Fuente</th><th>Observaciones</th></tr>
<?php foreach($hist as $h): ?>
<tr>
<td><?=htmlspecialchars((string)$h['fecha_tasa'])?></td>
<td><?=htmlspecialchars((string)$h['tasa_bolivares'])?></td>
<td><?=htmlspecialchars((string)$h['fuente'])?></td>
<td><?=htmlspecialchars((string)$h['observaciones'])?></td>
</tr>
<?php endforeach; ?>
</table>
</section>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
