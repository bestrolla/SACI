-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS ControlDeudasBodega CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ControlDeudasBodega;

-- Tabla para Tasa del Día (Dólar a Bolívares)
CREATE TABLE TasaDolar (
    id_tasa INT PRIMARY KEY AUTO_INCREMENT,
    fecha_tasa DATE NOT NULL UNIQUE,
    tasa_bolivares DECIMAL(10,2) NOT NULL,
    fuente VARCHAR(100) DEFAULT 'BCV',
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clientes (simplificada)
CREATE TABLE Clientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    alias VARCHAR(50),
    fecha_registro DATE DEFAULT (CURRENT_DATE),
    estado ENUM('ACTIVO', 'INACTIVO') DEFAULT 'ACTIVO'
);

-- Tabla de Deudas
CREATE TABLE Deudas (
    id_deuda INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    descripcion VARCHAR(200) NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    moneda ENUM('BS', 'USD') DEFAULT 'BS',
    tasa_dolar_dia DECIMAL(10,2),
    fecha_deuda DATE NOT NULL,
    fecha_vencimiento DATE,
    estado ENUM('PENDIENTE', 'PAGADA', 'VENCIDA') DEFAULT 'PENDIENTE',
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES Clientes(id_cliente)
);

-- Tabla de Pagos
CREATE TABLE Pagos (
    id_pago INT PRIMARY KEY AUTO_INCREMENT,
    id_deuda INT NOT NULL,
    fecha_pago DATE NOT NULL,
    monto_pago DECIMAL(10,2) NOT NULL,
    moneda ENUM('BS', 'USD') DEFAULT 'BS',
    tasa_dolar_dia DECIMAL(10,2),
    metodo_pago ENUM('EFECTIVO', 'TRANSFERENCIA', 'TARJETA') DEFAULT 'EFECTIVO',
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_deuda) REFERENCES Deudas(id_deuda)
);

-- Insertar datos de ejemplo para tasa del dólar
INSERT INTO TasaDolar (fecha_tasa, tasa_bolivares, fuente) VALUES
(CURDATE(), 36.50, 'BCV'),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 36.45, 'BCV'),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 36.40, 'BCV'),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 36.35, 'BCV');

-- Insertar datos de ejemplo para clientes
INSERT INTO Clientes (nombre, apellido, alias) VALUES
('Juan', 'Pérez', 'Juancho'),
('María', 'García', 'Marí'),
('Carlos', 'López', 'Carlitos'),
('Ana', 'Martínez', 'Anita');

-- Insertar datos de ejemplo para deudas (algunas en USD, otras en BS)
INSERT INTO Deudas (id_cliente, descripcion, monto_total, moneda, tasa_dolar_dia, fecha_deuda, fecha_vencimiento) VALUES
(1, 'Compra de abarrotes', 150.75, 'BS', 36.50, '2024-01-15', '2024-02-15'),
(1, 'Compra de bebidas - USD', 50.00, 'USD', 36.50, '2024-01-20', '2024-02-20'),
(2, 'Compra de víveres - USD', 100.00, 'USD', 36.45, '2024-01-10', '2024-02-10'),
(3, 'Compra varios', 120.30, 'BS', 36.50, '2024-01-25', '2024-02-25');

-- Vistas útiles

-- Vista para obtener la tasa actual del dólar
CREATE OR REPLACE VIEW VistaTasaActual AS
SELECT * FROM TasaDolar 
WHERE fecha_tasa = (SELECT MAX(fecha_tasa) FROM TasaDolar);

-- Vista para ver deudas pendientes por cliente con conversión a ambas monedas
CREATE OR REPLACE VIEW VistaDeudasClientes AS
SELECT 
    c.id_cliente,
    CONCAT(c.nombre, ' ', c.apellido) as nombre_completo,
    c.alias,
    d.id_deuda,
    d.descripcion,
    d.fecha_deuda,
    d.fecha_vencimiento,
    d.monto_total,
    d.moneda,
    d.tasa_dolar_dia,
    -- Conversión a bolívares si la deuda está en USD
    CASE 
        WHEN d.moneda = 'USD' THEN d.monto_total * d.tasa_dolar_dia
        ELSE d.monto_total
    END as monto_total_bs,
    -- Conversión a dólares si la deuda está en BS
    CASE 
        WHEN d.moneda = 'BS' THEN d.monto_total / d.tasa_dolar_dia
        ELSE d.monto_total
    END as monto_total_usd,
    COALESCE(SUM(p.monto_pago), 0) as total_pagado,
    (d.monto_total - COALESCE(SUM(p.monto_pago), 0)) as deuda_pendiente,
    -- Deuda pendiente en bolívares
    CASE 
        WHEN d.moneda = 'USD' THEN (d.monto_total - COALESCE(SUM(p.monto_pago), 0)) * d.tasa_dolar_dia
        ELSE (d.monto_total - COALESCE(SUM(p.monto_pago), 0))
    END as deuda_pendiente_bs,
    d.estado
FROM Clientes c
INNER JOIN Deudas d ON c.id_cliente = d.id_cliente
LEFT JOIN Pagos p ON d.id_deuda = p.id_deuda
WHERE d.estado != 'PAGADA'
GROUP BY c.id_cliente, d.id_deuda;

-- Vista para resumen de deudas totales por cliente CORREGIDA
CREATE OR REPLACE VIEW VistaResumenDeudas AS
SELECT 
    c.id_cliente,
    CONCAT(c.nombre, ' ', c.apellido) as nombre_completo,
    c.alias,
    COUNT(d.id_deuda) as total_deudas,
    SUM(
        CASE 
            WHEN d.moneda = 'USD' THEN d.monto_total * d.tasa_dolar_dia
            ELSE d.monto_total
        END
    ) as total_deudado_bs,
    SUM(
        CASE 
            WHEN d.moneda = 'BS' THEN d.monto_total / d.tasa_dolar_dia
            ELSE d.monto_total
        END
    ) as total_deudado_usd,
    SUM(
        CASE 
            WHEN d.moneda = 'USD' THEN d.monto_total * d.tasa_dolar_dia
            ELSE d.monto_total
        END
    ) - COALESCE(SUM(
        CASE 
            WHEN p.moneda = 'USD' THEN p.monto_pago * COALESCE(p.tasa_dolar_dia, d.tasa_dolar_dia)
            ELSE p.monto_pago
        END
    ), 0) as deuda_pendiente_bs
FROM Clientes c
INNER JOIN Deudas d ON c.id_cliente = d.id_cliente
LEFT JOIN Pagos p ON d.id_deuda = p.id_deuda
WHERE d.estado != 'PAGADA'
GROUP BY c.id_cliente, c.nombre, c.apellido, c.alias;

-- Vista para deudas vencidas
CREATE OR REPLACE VIEW VistaDeudasVencidas AS
SELECT 
    c.id_cliente,
    CONCAT(c.nombre, ' ', c.apellido) as nombre_completo,
    c.alias,
    d.id_deuda,
    d.descripcion,
    d.fecha_deuda,
    d.fecha_vencimiento,
    DATEDIFF(CURDATE(), d.fecha_vencimiento) as dias_vencido,
    d.monto_total,
    d.moneda,
    (d.monto_total - COALESCE(SUM(p.monto_pago), 0)) as deuda_pendiente,
    CASE 
        WHEN d.moneda = 'USD' THEN (d.monto_total - COALESCE(SUM(p.monto_pago), 0)) * d.tasa_dolar_dia
        ELSE (d.monto_total - COALESCE(SUM(p.monto_pago), 0))
    END as deuda_pendiente_bs
FROM Clientes c
INNER JOIN Deudas d ON c.id_cliente = d.id_cliente
LEFT JOIN Pagos p ON d.id_deuda = p.id_deuda
WHERE d.estado = 'VENCIDA'
GROUP BY c.id_cliente, d.id_deuda;

-- Vista para historial de deudas y pagos
CREATE OR REPLACE VIEW VistaHistorialCompleto AS
SELECT 
    c.id_cliente,
    CONCAT(c.nombre, ' ', c.apellido) as nombre_completo,
    c.alias,
    d.id_deuda,
    d.descripcion,
    d.fecha_deuda,
    d.fecha_vencimiento,
    d.monto_total,
    d.moneda as moneda_deuda,
    d.tasa_dolar_dia as tasa_deuda,
    d.estado,
    p.fecha_pago,
    p.monto_pago,
    p.moneda as moneda_pago,
    p.tasa_dolar_dia as tasa_pago,
    p.metodo_pago
FROM Clientes c
INNER JOIN Deudas d ON c.id_cliente = d.id_cliente
LEFT JOIN Pagos p ON d.id_deuda = p.id_deuda
ORDER BY c.nombre, d.fecha_deuda DESC, p.fecha_pago DESC;

-- Procedimientos almacenados

-- Procedimiento para registrar la tasa del día
DELIMITER //
CREATE PROCEDURE RegistrarTasaDolar(
    IN p_fecha_tasa DATE,
    IN p_tasa_bolivares DECIMAL(10,2),
    IN p_fuente VARCHAR(100),
    IN p_observaciones TEXT
)
BEGIN
    INSERT INTO TasaDolar (fecha_tasa, tasa_bolivares, fuente, observaciones)
    VALUES (p_fecha_tasa, p_tasa_bolivares, p_fuente, p_observaciones)
    ON DUPLICATE KEY UPDATE 
        tasa_bolivares = p_tasa_bolivares,
        fuente = p_fuente,
        observaciones = p_observaciones;
    
    SELECT 'Tasa registrada/actualizada correctamente' as mensaje;
END //
DELIMITER ;

-- Procedimiento para registrar una nueva deuda
DELIMITER //
CREATE PROCEDURE RegistrarDeuda(
    IN p_id_cliente INT,
    IN p_descripcion VARCHAR(200),
    IN p_monto_total DECIMAL(10,2),
    IN p_moneda ENUM('BS', 'USD'),
    IN p_fecha_deuda DATE,
    IN p_fecha_vencimiento DATE,
    IN p_observaciones TEXT
)
BEGIN
    DECLARE v_tasa_actual DECIMAL(10,2);
    
    -- Obtener la tasa actual del dólar
    SELECT tasa_bolivares INTO v_tasa_actual 
    FROM VistaTasaActual;
    
    INSERT INTO Deudas (id_cliente, descripcion, monto_total, moneda, tasa_dolar_dia, fecha_deuda, fecha_vencimiento, observaciones)
    VALUES (p_id_cliente, p_descripcion, p_monto_total, p_moneda, v_tasa_actual, p_fecha_deuda, p_fecha_vencimiento, p_observaciones);
    
    SELECT LAST_INSERT_ID() as id_deuda_generada;
END //
DELIMITER ;

-- Procedimiento para registrar un pago
DELIMITER //
CREATE PROCEDURE RegistrarPago(
    IN p_id_deuda INT,
    IN p_monto DECIMAL(10,2),
    IN p_moneda ENUM('BS', 'USD'),
    IN p_metodo ENUM('EFECTIVO', 'TRANSFERENCIA', 'TARJETA'),
    IN p_observaciones TEXT
)
BEGIN
    DECLARE deuda_actual DECIMAL(10,2);
    DECLARE total_pagado DECIMAL(10,2);
    DECLARE v_tasa_actual DECIMAL(10,2);
    DECLARE moneda_deuda ENUM('BS', 'USD');
    
    -- Obtener monto total y moneda de la deuda
    SELECT monto_total, moneda INTO deuda_actual, moneda_deuda 
    FROM Deudas WHERE id_deuda = p_id_deuda;
    
    -- Obtener total pagado
    SELECT COALESCE(SUM(monto_pago), 0) INTO total_pagado 
    FROM Pagos WHERE id_deuda = p_id_deuda;
    
    -- Obtener la tasa actual del dólar
    SELECT tasa_bolivares INTO v_tasa_actual 
    FROM VistaTasaActual;
    
    -- Verificar que el pago no exceda la deuda
    IF (total_pagado + p_monto) > deuda_actual THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El pago excede el monto de la deuda';
    ELSE
        -- Registrar pago
        INSERT INTO Pagos (id_deuda, fecha_pago, monto_pago, moneda, tasa_dolar_dia, metodo_pago, observaciones)
        VALUES (p_id_deuda, CURDATE(), p_monto, p_moneda, v_tasa_actual, p_metodo, p_observaciones);
        
        -- Actualizar estado de deuda si está completamente pagada
        IF (total_pagado + p_monto) = deuda_actual THEN
            UPDATE Deudas SET estado = 'PAGADA' WHERE id_deuda = p_id_deuda;
        -- Marcar como vencida si la fecha de vencimiento pasó
        ELSEIF (SELECT fecha_vencimiento FROM Deudas WHERE id_deuda = p_id_deuda) < CURDATE() THEN
            UPDATE Deudas SET estado = 'VENCIDA' WHERE id_deuda = p_id_deuda;
        END IF;
    END IF;
END //
DELIMITER ;

-- Procedimiento para actualizar estado de deudas vencidas
DELIMITER //
CREATE PROCEDURE ActualizarDeudasVencidas()
BEGIN
    UPDATE Deudas 
    SET estado = 'VENCIDA' 
    WHERE estado = 'PENDIENTE' 
    AND fecha_vencimiento < CURDATE();
END //
DELIMITER ;

-- Procedimiento para obtener reporte de deudas por cliente
DELIMITER //
CREATE PROCEDURE ReporteDeudasCliente(IN p_id_cliente INT)
BEGIN
    SELECT 
        vdc.*,
        DATEDIFF(CURDATE(), vdc.fecha_vencimiento) as dias_vencimiento
    FROM VistaDeudasClientes vdc
    WHERE vdc.id_cliente = p_id_cliente
    ORDER BY vdc.fecha_vencimiento ASC;
END //
DELIMITER ;

-- Consultas útiles

-- Consulta para obtener la tasa actual
SELECT * FROM VistaTasaActual;

-- Consulta para historial de tasas
SELECT * FROM TasaDolar ORDER BY fecha_tasa DESC;

-- Consulta para deudas con conversión de moneda
SELECT 
    nombre_completo,
    descripcion,
    monto_total,
    moneda,
    monto_total_bs,
    monto_total_usd,
    deuda_pendiente,
    deuda_pendiente_bs
FROM VistaDeudasClientes;

-- Consulta para resumen general en ambas monedas
SELECT 
    COUNT(*) as total_deudas,
    SUM(total_deudado_bs) as total_deudado_bs,
    SUM(total_deudado_usd) as total_deudado_usd,
    SUM(deuda_pendiente_bs) as deuda_pendiente_total_bs
FROM VistaResumenDeudas;

-- Consulta para clientes con mayor deuda
SELECT 
    nombre_completo,
    alias,
    total_deudas,
    total_deudado_bs,
    deuda_pendiente_bs
FROM VistaResumenDeudas 
ORDER BY deuda_pendiente_bs DESC;

-- Consulta para deudas vencidas
SELECT 
    nombre_completo,
    alias,
    descripcion,
    fecha_vencimiento,
    dias_vencido,
    deuda_pendiente_bs
FROM VistaDeudasVencidas 
ORDER BY dias_vencido DESC;
