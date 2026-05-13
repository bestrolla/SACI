<?php
require __DIR__.'/../logica/deudas.php';
require __DIR__.'/../logica/vistas.php';
require __DIR__.'/../logica/tasa.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_cliente = (int)($_POST['id_cliente'] ?? 0);
    $descripcion = trim((string)($_POST['descripcion'] ?? ''));
    $monto = (float)($_POST['monto_total'] ?? 0);
    $moneda = (string)($_POST['moneda'] ?? 'BS');
    $fecha_deuda = (string)($_POST['fecha_deuda'] ?? '');
    $fecha_venc = (string)($_POST['fecha_vencimiento'] ?? '');
    $obs = trim((string)($_POST['observaciones'] ?? ''));
    if ($id_cliente && $descripcion && $monto > 0 && $fecha_deuda) {
        crearDeudaSP($id_cliente, $descripcion, $monto, $moneda, $fecha_deuda, $fecha_venc ?: null, $obs ?: null);
        header('Location: deudas.php');
        exit;
    }
}
$clientes = listarClientesActivos();
$tasa = obtenerTasaActual();
?><!doctype html><html><head><meta charset="utf-8"><title>Nueva deuda</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Nueva deuda</h1>
<form method="post">
<label>Cliente</label>
<div class="autocomplete">
  <input type="text" id="cliente-search" placeholder="Buscar por nombre o alias" autocomplete="off" required>
  <input type="hidden" name="id_cliente" id="id_cliente">
  <div id="cliente-suggest" class="autocomplete-list"></div>
</div>
<div id="cliente-selected" class="selected-debt"></div>
<label>Descripción</label>
<input name="descripcion" required>
<label>Monto total</label>
<input type="number" step="0.01" name="monto_total" required>
<label>Moneda</label>
<select name="moneda">
  <option>BS</option>
  <option>USD</option>
</select>
<label>Fecha deuda</label>
<input type="date" name="fecha_deuda" required>
<label>Observaciones</label>
<input name="observaciones">
<button>Guardar</button>
<script>window.__clientesActivos = <?= json_encode($clientes, JSON_UNESCAPED_UNICODE) ?>;</script>
</form>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
