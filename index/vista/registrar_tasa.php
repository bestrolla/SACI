<?php
require __DIR__.'/../logica/tasa.php';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fecha = (string)($_POST['fecha'] ?? '');
    $tasa = (float)($_POST['tasa'] ?? 0);
    $fuente = trim((string)($_POST['fuente'] ?? 'BCV')) ?: 'BCV';
    $obs = trim((string)($_POST['observaciones'] ?? '')) ?: null;
    if ($fecha && $tasa > 0) {
        registrarTasa($fecha, $tasa, $fuente, $obs);
    }
}
header('Location: home.php');
exit;
?>
