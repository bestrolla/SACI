<?php
require_once __DIR__.'/db.php';
function crearCliente(string $nombre, string $apellido, ?string $alias): void {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('INSERT INTO Clientes (nombre, apellido, alias) VALUES (?,?,?)');
        $stmt->execute([$nombre, $apellido, $alias]);
    } catch (PDOException $e) {}
}
function actualizarEstadoCliente(int $id, string $estado): void {
    $pdo = db();
    try {
        $stmt = $pdo->prepare('UPDATE Clientes SET estado=? WHERE id_cliente=?');
        $stmt->execute([$estado, $id]);
    } catch (PDOException $e) {}
}
function listarClientes(): array {
    $pdo = db();
    try {
        return $pdo->query('SELECT * FROM Clientes ORDER BY fecha_registro DESC')->fetchAll();
    } catch (PDOException $e) {
        return [];
    }
}
?>
