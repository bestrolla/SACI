<?php $current = basename($_SERVER['SCRIPT_NAME']); ?>
<nav class="navbar">
<a href="home.php" class="brand"><img src="assets/img/logo1.jpg" alt="Bodega" class="brand-logo" id="brand-logo"></a>
<div class="nav-links">
<a href="home.php" class="<?= $current==='home.php'?'active':'' ?>">Inicio</a>
<a href="resumen.php" class="<?= $current==='resumen.php'?'active':'' ?>">Resumen</a>
<a href="deudas.php" class="<?= $current==='deudas.php'?'active':'' ?>">Deudas</a>
<a href="nueva_deuda.php" class="<?= $current==='nueva_deuda.php'?'active':'' ?>">Nueva deuda</a>
<a href="pagos.php" class="<?= $current==='pagos.php'?'active':'' ?>">Pagos</a>
<a href="clientes.php" class="<?= $current==='clientes.php'?'active':'' ?>">Clientes</a>
</div>
<button id="theme-toggle" class="theme-toggle" type="button">Tema</button>
<button id="currency-toggle" class="currency-toggle" type="button">Bs</button>
</nav>
