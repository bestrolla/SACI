<?php
require __DIR__.'/../logica/clientes.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['accion'])) {
    $nombre = trim((string)($_POST['nombre'] ?? ''));
    $apellido = trim((string)($_POST['apellido'] ?? ''));
    $alias = trim((string)($_POST['alias'] ?? ''));
    if ($nombre && $apellido) {
        crearCliente($nombre, $apellido, $alias ?: null);
        header('Location: clientes.php');
        exit;
    }
}
if (isset($_POST['accion']) && $_POST['accion'] === 'estado') {
    $id = (int)($_POST['id_cliente'] ?? 0);
    $estado = (string)($_POST['estado'] ?? 'ACTIVO');
    if ($id) {
        actualizarEstadoCliente($id, $estado);
        header('Location: clientes.php');
        exit;
    }
}
$rows = listarClientes();
?><!doctype html><html><head><meta charset="utf-8"><title>Clientes</title><link rel="stylesheet" href="assets/css/style.css"><script src="assets/js/main.js" defer></script></head><body>
<?php require __DIR__.'/partials/nav.php'; ?>
<div class="container">
<h1>Clientes</h1>
<h2>Nuevo cliente</h2>
<form method="post">
<label>Nombre</label>
<input name="nombre" required>
<label>Apellido</label>
<input name="apellido" required>
<label>Alias</label>
<input name="alias">
<button>Guardar</button>
</form>
<h2>Listado</h2>
<div class="toolbar">
<label>Filtrar</label>
<input class="filter-input" data-target="#tbl-clientes" placeholder="Buscar...">
<label>Ordenar</label>
<select class="sort-input" data-target="#tbl-clientes">
  <option value="name_asc">Cliente A→Z</option>
  <option value="name_desc">Cliente Z→A</option>
</select>
</div>
<table id="tbl-clientes" border="1" cellpadding="6">
<tr>
<th>ID</th><th>Nombre</th><th>Apellido</th><th>Alias</th><th>Registro</th><th>Estado</th><th>Acción</th>
</tr>
<?php if (!$rows): ?>
<tr><td colspan="7">No hay clientes</td></tr>
<?php endif; ?>
<?php foreach($rows as $r): ?>
<tr>
<td><?=htmlspecialchars((string)$r['id_cliente'])?></td>
<td><?=htmlspecialchars((string)$r['nombre'])?></td>
<td><?=htmlspecialchars((string)$r['apellido'])?></td>
<td><?=htmlspecialchars((string)$r['alias'])?></td>
<td><?=htmlspecialchars((string)$r['fecha_registro'])?></td>
<td><?=htmlspecialchars((string)$r['estado'])?></td>
<td>
<form method="post" style="display:inline">
<input type="hidden" name="accion" value="estado">
<input type="hidden" name="id_cliente" value="<?=htmlspecialchars((string)$r['id_cliente'])?>">
<select name="estado">
<option<?=$r['estado']==='ACTIVO'?' selected':''?>>ACTIVO</option>
<option<?=$r['estado']==='INACTIVO'?' selected':''?>>INACTIVO</option>
</select>
<button>Actualizar</button>
</form>
</td>
</tr>
<?php endforeach; ?>
</table>
</div>
<?php require __DIR__.'/partials/footer.php'; ?>
</body></html>
