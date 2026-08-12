/* ==========================================================================
   SACI - Control de Deudas Bodega Engine & SPA Logic
   ========================================================================== */

(function () {
  'use strict';

  // Key names for localStorage
  const STORAGE_KEYS = {
    CLIENTES: 'saci_clientes_v1',
    TASAS: 'saci_tasas_v1',
    DEUDAS: 'saci_deudas_v1',
    PAGOS: 'saci_pagos_v1',
    THEME: 'theme',
    CURRENCY: 'currency'
  };

  // Seed Data Initializers
  const INITIAL_TASAS = [
    { id_tasa: 1, fecha_tasa: '2026-08-12', tasa_bolivares: 36.50, fuente: 'BCV', observaciones: 'Tasa oficial del día' },
    { id_tasa: 2, fecha_tasa: '2026-08-11', tasa_bolivares: 36.45, fuente: 'BCV', observaciones: '' },
    { id_tasa: 3, fecha_tasa: '2026-08-10', tasa_bolivares: 36.40, fuente: 'BCV', observaciones: '' },
    { id_tasa: 4, fecha_tasa: '2026-08-09', tasa_bolivares: 36.35, fuente: 'BCV', observaciones: '' }
  ];

  const INITIAL_CLIENTES = [
    { id_cliente: 1, nombre: 'Juan', apellido: 'Pérez', alias: 'Juancho', fecha_registro: '2026-01-01', estado: 'ACTIVO' },
    { id_cliente: 2, nombre: 'María', apellido: 'García', alias: 'Marí', fecha_registro: '2026-01-05', estado: 'ACTIVO' },
    { id_cliente: 3, nombre: 'Carlos', apellido: 'López', alias: 'Carlitos', fecha_registro: '2026-01-10', estado: 'ACTIVO' },
    { id_cliente: 4, nombre: 'Ana', apellido: 'Martínez', alias: 'Anita', fecha_registro: '2026-01-15', estado: 'ACTIVO' }
  ];

  const INITIAL_DEUDAS = [
    { id_deuda: 1, id_cliente: 1, descripcion: 'Compra de abarrotes y charcutería', monto_total: 150.75, moneda: 'BS', tasa_dolar_dia: 36.50, fecha_deuda: '2026-08-01', fecha_vencimiento: '2026-08-15', estado: 'PARCIAL', observaciones: '' },
    { id_deuda: 2, id_cliente: 1, descripcion: 'Compra de bebidas - USD', monto_total: 50.00, moneda: 'USD', tasa_dolar_dia: 36.50, fecha_deuda: '2026-08-05', fecha_vencimiento: '2026-08-20', estado: 'PENDIENTE', observaciones: '' },
    { id_deuda: 3, id_cliente: 2, descripcion: 'Compra de víveres - USD', monto_total: 100.00, moneda: 'USD', tasa_dolar_dia: 36.45, fecha_deuda: '2026-08-08', fecha_vencimiento: '2026-08-22', estado: 'PENDIENTE', observaciones: '' },
    { id_deuda: 4, id_cliente: 3, descripcion: 'Compra varios bodega', monto_total: 120.30, moneda: 'BS', tasa_dolar_dia: 36.50, fecha_deuda: '2026-08-10', fecha_vencimiento: '2026-08-25', estado: 'PENDIENTE', observaciones: '' }
  ];

  const INITIAL_PAGOS = [
    { id_pago: 1, id_deuda: 1, fecha_pago: '2026-08-05', monto_pago: 50.00, moneda: 'BS', tasa_dolar_dia: 36.50, metodo_pago: 'PAGO-MOVIL', observaciones: 'Abono inicial' }
  ];

  // State Management
  let state = {
    clientes: [],
    tasas: [],
    deudas: [],
    pagos: []
  };

  // Helper Utilities
  function loadState() {
    state.clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES)) || INITIAL_CLIENTES;
    state.tasas = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASAS)) || INITIAL_TASAS;
    state.deudas = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEUDAS)) || INITIAL_DEUDAS;
    state.pagos = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAGOS)) || INITIAL_PAGOS;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(state.clientes));
    localStorage.setItem(STORAGE_KEYS.TASAS, JSON.stringify(state.tasas));
    localStorage.setItem(STORAGE_KEYS.DEUDAS, JSON.stringify(state.deudas));
    localStorage.setItem(STORAGE_KEYS.PAGOS, JSON.stringify(state.pagos));
  }

  function getTasaActual() {
    if (!state.tasas || state.tasas.length === 0) return { tasa_bolivares: 36.50, fecha_tasa: '', fuente: 'BCV' };
    const sorted = [...state.tasas].sort((a, b) => new Date(b.fecha_tasa) - new Date(a.fecha_tasa));
    return sorted[0];
  }

  function formatBs(val) {
    return 'Bs ' + Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatUSD(val) {
    return '$ ' + Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  // Calculation Engine
  function computeDeudaTotals(deuda) {
    const tasa = getTasaActual().tasa_bolivares || 36.50;
    const tasaRow = deuda.tasa_dolar_dia || tasa;
    const isUsd = deuda.moneda === 'USD';
    const mt = Number(deuda.monto_total || 0);

    const totalBs = isUsd ? mt * tasaRow : mt;
    const totalUsd = isUsd ? mt : (tasaRow > 0 ? mt / tasaRow : 0);

    // Calculate sum of payments
    const pagosDeuda = state.pagos.filter(p => Number(p.id_deuda) === Number(deuda.id_deuda));
    let totalPagadoBs = 0;
    let totalPagadoUsd = 0;

    pagosDeuda.forEach(p => {
      const pMonto = Number(p.monto_pago || 0);
      const pTasa = p.tasa_dolar_dia || tasaRow;
      if (p.moneda === 'USD') {
        totalPagadoUsd += pMonto;
        totalPagadoBs += pMonto * pTasa;
      } else {
        totalPagadoBs += pMonto;
        totalPagadoUsd += (pTasa > 0 ? pMonto / pTasa : 0);
      }
    });

    let pendBs = Math.max(0, totalBs - totalPagadoBs);
    let pendUsd = Math.max(0, totalUsd - totalPagadoUsd);

    if (deuda.estado === 'PAGADA' || pendBs < 0.01) {
      pendBs = 0;
      pendUsd = 0;
    }

    return { totalBs, totalUsd, totalPagadoBs, totalPagadoUsd, pendBs, pendUsd };
  }

  // UI Renderers
  function renderThemeAndCurrency() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.textContent = document.body.classList.contains('dark') ? '☀️ Claro' : '🌙 Oscuro';
    }

    const savedCur = localStorage.getItem(STORAGE_KEYS.CURRENCY);
    if (savedCur === 'USD') {
      document.body.classList.add('currency-usd');
    }
    const curBtn = document.getElementById('currency-toggle');
    if (curBtn) {
      curBtn.textContent = document.body.classList.contains('currency-usd') ? '$' : 'Bs';
    }
  }

  function renderHome() {
    const tasa = getTasaActual();
    document.getElementById('tasa-actual-val').textContent = formatBs(tasa.tasa_bolivares);
    document.getElementById('tasa-actual-fecha').textContent = tasa.fecha_tasa || 'Hoy';
    document.getElementById('tasa-actual-fuente').textContent = tasa.fuente || 'BCV';
    document.getElementById('tasa-actual-obs').textContent = tasa.observaciones || 'Ninguna';

    // Summary stats
    let totalDeudasCount = state.deudas.length;
    let totalEmitidoBs = 0;
    let totalEmitidoUsd = 0;
    let totalPendBs = 0;
    let totalPendUsd = 0;

    state.deudas.forEach(d => {
      const calc = computeDeudaTotals(d);
      totalEmitidoBs += calc.totalBs;
      totalEmitidoUsd += calc.totalUsd;
      totalPendBs += calc.pendBs;
      totalPendUsd += calc.pendUsd;
    });

    document.getElementById('stat-total-deudas').textContent = totalDeudasCount;
    document.getElementById('stat-monto-total').innerHTML = `<span class="bs">${formatBs(totalEmitidoBs)}</span><span class="usd">${formatUSD(totalEmitidoUsd)}</span>`;
    document.getElementById('stat-total-pendiente').innerHTML = `<span class="bs">${formatBs(totalPendBs)}</span><span class="usd">${formatUSD(totalPendUsd)}</span>`;

    // History of rates
    const tbody = document.getElementById('tbody-historial-tasas');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sortedTasas = [...state.tasas].sort((a, b) => new Date(b.fecha_tasa) - new Date(a.fecha_tasa));

    if (sortedTasas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-muted">No hay tasas registradas</td></tr>`;
      return;
    }

    sortedTasas.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.fecha_tasa}</td>
        <td><strong>${formatBs(t.tasa_bolivares)}</strong></td>
        <td>${t.fuente || 'BCV'}</td>
        <td>${t.observaciones || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderResumen() {
    const tbody = document.getElementById('tbody-resumen');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filterText = (document.getElementById('filter-resumen')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('sort-resumen')?.value || 'pend_desc';

    // Group debts by client
    const clientMap = {};
    state.clientes.forEach(c => {
      clientMap[c.id_cliente] = {
        id_cliente: c.id_cliente,
        nombre_completo: `${c.nombre} ${c.apellido}`,
        alias: c.alias || '-',
        total_deudas: 0,
        monto_total_bs: 0,
        monto_total_usd: 0,
        deuda_pendiente_bs: 0,
        deuda_pendiente_usd: 0
      };
    });

    state.deudas.forEach(d => {
      if (clientMap[d.id_cliente]) {
        const calc = computeDeudaTotals(d);
        clientMap[d.id_cliente].total_deudas += 1;
        clientMap[d.id_cliente].monto_total_bs += calc.totalBs;
        clientMap[d.id_cliente].monto_total_usd += calc.totalUsd;
        clientMap[d.id_cliente].deuda_pendiente_bs += calc.pendBs;
        clientMap[d.id_cliente].deuda_pendiente_usd += calc.pendUsd;
      }
    });

    let list = Object.values(clientMap).filter(item => {
      if (!filterText) return true;
      return item.nombre_completo.toLowerCase().includes(filterText) || item.alias.toLowerCase().includes(filterText);
    });

    // Sorting
    list.sort((a, b) => {
      if (sortVal === 'pend_desc') return b.deuda_pendiente_bs - a.deuda_pendiente_bs;
      if (sortVal === 'pend_asc') return a.deuda_pendiente_bs - b.deuda_pendiente_bs;
      if (sortVal === 'name_asc') return a.nombre_completo.localeCompare(b.nombre_completo);
      if (sortVal === 'name_desc') return b.nombre_completo.localeCompare(a.nombre_completo);
      return 0;
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No hay datos coincidentes</td></tr>`;
      return;
    }

    list.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.id_cliente}</td>
        <td><strong>${item.nombre_completo}</strong></td>
        <td>${item.alias}</td>
        <td>${item.total_deudas}</td>
        <td><span class="amount"><span class="bs">${formatBs(item.monto_total_bs)}</span><span class="usd">${formatUSD(item.monto_total_usd)}</span></span></td>
        <td><span class="amount"><span class="bs">${formatBs(item.deuda_pendiente_bs)}</span><span class="usd">${formatUSD(item.deuda_pendiente_usd)}</span></span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderDeudas() {
    const tbody = document.getElementById('tbody-deudas');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filterText = (document.getElementById('filter-deudas')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('sort-deudas')?.value || 'pend_desc';

    let list = state.deudas.map(d => {
      const cliente = state.clientes.find(c => Number(c.id_cliente) === Number(d.id_cliente)) || { nombre: 'Desconocido', apellido: '', alias: '-' };
      const calc = computeDeudaTotals(d);

      let estadoCalculado = d.estado;
      if (calc.pendBs <= 0.01) {
        estadoCalculado = 'PAGADA';
      } else if (calc.totalPagadoBs > 0) {
        estadoCalculado = 'PARCIAL';
      }

      return {
        ...d,
        nombre_completo: `${cliente.nombre} ${cliente.apellido}`,
        alias: cliente.alias || '-',
        calc,
        estadoCalculado
      };
    });

    // Filter
    list = list.filter(item => {
      if (!filterText) return true;
      return item.nombre_completo.toLowerCase().includes(filterText) ||
             item.alias.toLowerCase().includes(filterText) ||
             item.descripcion.toLowerCase().includes(filterText);
    });

    // Sorting
    list.sort((a, b) => {
      if (sortVal === 'pend_desc') return b.calc.pendBs - a.calc.pendBs;
      if (sortVal === 'pend_asc') return a.calc.pendBs - b.calc.pendBs;
      if (sortVal === 'name_asc') return a.nombre_completo.localeCompare(b.nombre_completo);
      if (sortVal === 'name_desc') return b.nombre_completo.localeCompare(a.nombre_completo);
      if (sortVal === 'date_desc') return new Date(b.fecha_deuda) - new Date(a.fecha_deuda);
      if (sortVal === 'date_asc') return new Date(a.fecha_deuda) - new Date(b.fecha_deuda);
      return 0;
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-muted">No se encontraron deudas</td></tr>`;
      return;
    }

    list.forEach(item => {
      const tr = document.createElement('tr');
      const badgeClass = `badge-${item.estadoCalculado.toLowerCase()}`;

      tr.innerHTML = `
        <td><strong>${item.nombre_completo}</strong></td>
        <td>${item.alias}</td>
        <td>${item.descripcion}</td>
        <td>${item.fecha_deuda}</td>
        <td><span class="amount"><span class="bs">${formatBs(item.calc.totalBs)}</span><span class="usd">${formatUSD(item.calc.totalUsd)}</span></span></td>
        <td><span class="amount"><span class="bs">${formatBs(item.calc.totalPagadoBs)}</span><span class="usd">${formatUSD(item.calc.totalPagadoUsd)}</span></span></td>
        <td><span class="amount"><span class="bs">${formatBs(item.calc.pendBs)}</span><span class="usd">${formatUSD(item.calc.pendUsd)}</span></span></td>
        <td><button type="button" class="btn btn-outline btn-sm btn-historial" data-id-cliente="${item.id_cliente}">Historial</button></td>
        <td><span class="badge ${badgeClass}">${item.estadoCalculado}</span></td>
      `;
      tbody.appendChild(tr);
    });

    // Attach event listeners for Historial side panel
    document.querySelectorAll('.btn-historial').forEach(btn => {
      btn.addEventListener('click', function () {
        const idCliente = this.getAttribute('data-id-cliente');
        openHistorialPanel(idCliente);
      });
    });
  }

  function openHistorialPanel(idCliente) {
    const cliente = state.clientes.find(c => Number(c.id_cliente) === Number(idCliente));
    const title = document.getElementById('historial-panel-title');
    const content = document.getElementById('historial-content');
    const panel = document.getElementById('historial-panel');

    if (!panel || !content) return;

    const nombreCliente = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente';
    if (title) title.textContent = `Historial: ${nombreCliente}`;

    const deudasCliente = state.deudas.filter(d => Number(d.id_cliente) === Number(idCliente));

    if (deudasCliente.length === 0) {
      content.innerHTML = `<p class="text-muted">Este cliente no posee deudas registradas.</p>`;
    } else {
      let html = `<div style="display:flex; flex-direction:column; gap:16px;">`;
      deudasCliente.forEach(d => {
        const calc = computeDeudaTotals(d);
        const pagosDeuda = state.pagos.filter(p => Number(p.id_deuda) === Number(d.id_deuda));

        html += `
          <div class="card-box" style="padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong>${d.descripcion}</strong>
              <span class="badge badge-${calc.pendBs <= 0.01 ? 'pagada' : (calc.totalPagadoBs > 0 ? 'parcial' : 'pendiente')}">${calc.pendBs <= 0.01 ? 'PAGADA' : 'PENDIENTE'}</span>
            </div>
            <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">Fecha: ${d.fecha_deuda} | Moneda: ${d.moneda}</div>
            <div style="font-size:14px; margin-bottom:8px;">
              <div>Total: <span class="amount"><span class="bs">${formatBs(calc.totalBs)}</span><span class="usd">${formatUSD(calc.totalUsd)}</span></span></div>
              <div>Pendiente: <span class="amount"><span class="bs">${formatBs(calc.pendBs)}</span><span class="usd">${formatUSD(calc.pendUsd)}</span></span></div>
            </div>
        `;

        if (pagosDeuda.length > 0) {
          html += `<div style="font-size:13px; font-weight:600; margin-top:8px; border-top:1px solid var(--border-color); padding-top:6px;">Pagos realizados:</div><ul style="font-size:12px; padding-left:16px; margin-top:4px;">`;
          pagosDeuda.forEach(p => {
            html += `<li>${p.fecha_pago} - ${p.moneda === 'USD' ? formatUSD(p.monto_pago) : formatBs(p.monto_pago)} (${p.metodo_pago})</li>`;
          });
          html += `</ul>`;
        } else {
          html += `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Sin pagos abonados.</div>`;
        }

        html += `</div>`;
      });
      html += `</div>`;
      content.innerHTML = html;
    }

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
  }

  function closeHistorialPanel() {
    const panel = document.getElementById('historial-panel');
    if (panel) {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    }
  }

  function renderClientes() {
    const tbody = document.getElementById('tbody-clientes');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (state.clientes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-muted">No hay clientes registrados</td></tr>`;
      return;
    }

    state.clientes.forEach(c => {
      const tr = document.createElement('tr');
      const isActivo = c.estado === 'ACTIVO';
      const badgeClass = isActivo ? 'badge-activo' : 'badge-inactivo';

      tr.innerHTML = `
        <td>${c.id_cliente}</td>
        <td><strong>${c.nombre} ${c.apellido}</strong></td>
        <td>${c.alias || '-'}</td>
        <td>${c.fecha_registro || '-'}</td>
        <td><span class="badge ${badgeClass}">${c.estado}</span></td>
        <td>
          <button type="button" class="btn btn-outline btn-sm btn-toggle-cliente" data-id="${c.id_cliente}">
            ${isActivo ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-toggle-cliente').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = Number(this.getAttribute('data-id'));
        const cliente = state.clientes.find(c => Number(c.id_cliente) === id);
        if (cliente) {
          cliente.estado = cliente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
          saveState();
          renderClientes();
          renderResumen();
          showToast(`Estado de cliente actualizado a ${cliente.estado}`, 'info');
        }
      });
    });
  }

  // Setup Autocomplete Controls
  function setupAutocompleteCliente() {
    const input = document.getElementById('cliente-search');
    const hiddenInput = document.getElementById('id_cliente_selected');
    const suggestBox = document.getElementById('cliente-suggest');
    const badgeBox = document.getElementById('cliente-selected-info');

    if (!input || !suggestBox) return;

    input.addEventListener('input', function () {
      const query = this.value.toLowerCase().trim();
      if (!query) {
        suggestBox.classList.remove('open');
        return;
      }

      const matches = state.clientes.filter(c => c.estado === 'ACTIVO' && (`${c.nombre} ${c.apellido}`.toLowerCase().includes(query) || (c.alias && c.alias.toLowerCase().includes(query))));

      if (matches.length === 0) {
        suggestBox.innerHTML = `<div class="autocomplete-item"><span class="alias">No se encontraron clientes activos</span></div>`;
      } else {
        suggestBox.innerHTML = matches.map(c => `
          <div class="autocomplete-item" data-id="${c.id_cliente}" data-name="${c.nombre} ${c.apellido}">
            <strong>${c.nombre} ${c.apellido}</strong> ${c.alias ? `<span class="alias">(${c.alias})</span>` : ''}
          </div>
        `).join('');
      }

      suggestBox.classList.add('open');
    });

    suggestBox.addEventListener('click', function (e) {
      const item = e.target.closest('.autocomplete-item');
      if (item && item.getAttribute('data-id')) {
        const id = item.getAttribute('data-id');
        const name = item.getAttribute('data-name');
        if (hiddenInput) hiddenInput.value = id;
        input.value = name;
        if (badgeBox) {
          badgeBox.textContent = `Cliente seleccionado: ${name}`;
          badgeBox.style.display = 'block';
        }
        suggestBox.classList.remove('open');
      }
    });

    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !suggestBox.contains(e.target)) {
        suggestBox.classList.remove('open');
      }
    });
  }

  function setupAutocompleteDeuda() {
    const input = document.getElementById('deuda-search');
    const hiddenId = document.getElementById('id_deuda_selected');
    const hiddenMulti = document.getElementById('ids_deudas_multi');
    const suggestBox = document.getElementById('deuda-suggest');
    const badgeBox = document.getElementById('deuda-selected-info');

    if (!input || !suggestBox) return;

    input.addEventListener('input', function () {
      const query = this.value.toLowerCase().trim();
      if (!query) {
        suggestBox.classList.remove('open');
        return;
      }

      // Filter debts with pending balance
      const deudasPendientes = state.deudas.filter(d => {
        const calc = computeDeudaTotals(d);
        return calc.pendBs > 0.01;
      }).map(d => {
        const c = state.clientes.find(cl => Number(cl.id_cliente) === Number(d.id_cliente)) || { nombre: 'Desconocido', apellido: '' };
        const calc = computeDeudaTotals(d);
        return {
          ...d,
          nombre_completo: `${c.nombre} ${c.apellido}`,
          calc
        };
      });

      const matches = deudasPendientes.filter(d =>
        d.nombre_completo.toLowerCase().includes(query) ||
        d.descripcion.toLowerCase().includes(query)
      );

      if (matches.length === 0) {
        suggestBox.innerHTML = `<div class="autocomplete-item"><span class="alias">No hay deudas pendientes coincidentes</span></div>`;
      } else {
        suggestBox.innerHTML = matches.map(d => `
          <div class="autocomplete-item" data-id="${d.id_deuda}" data-desc="${d.nombre_completo} - ${d.descripcion}">
            <strong>${d.nombre_completo}</strong>: ${d.descripcion}
            <div><small class="alias">Pendiente: ${formatBs(d.calc.pendBs)} / ${formatUSD(d.calc.pendUsd)}</small></div>
          </div>
        `).join('');
      }

      suggestBox.classList.add('open');
    });

    suggestBox.addEventListener('click', function (e) {
      const item = e.target.closest('.autocomplete-item');
      if (item && item.getAttribute('data-id')) {
        const id = item.getAttribute('data-id');
        const desc = item.getAttribute('data-desc');
        if (hiddenId) hiddenId.value = id;
        if (hiddenMulti) hiddenMulti.value = id;
        input.value = desc;
        if (badgeBox) {
          badgeBox.textContent = `Deuda seleccionada: ${desc}`;
          badgeBox.style.display = 'block';
        }
        suggestBox.classList.remove('open');
      }
    });
  }

  // Event Handlers
  function attachEventHandlers() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', function () {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
      renderThemeAndCurrency();
    });

    // Currency toggle
    document.getElementById('currency-toggle')?.addEventListener('click', function () {
      const isUsd = document.body.classList.toggle('currency-usd');
      localStorage.setItem(STORAGE_KEYS.CURRENCY, isUsd ? 'USD' : 'BS');
      renderThemeAndCurrency();
    });

    // Form Tasa
    document.getElementById('form-tasa')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const fecha = document.getElementById('tasa-fecha').value;
      const monto = parseFloat(document.getElementById('tasa-monto').value);
      const fuente = document.getElementById('tasa-fuente').value.trim() || 'BCV';
      const obs = document.getElementById('tasa-obs').value.trim();

      if (fecha && monto > 0) {
        state.tasas = state.tasas.filter(t => t.fecha_tasa !== fecha);
        state.tasas.push({
          id_tasa: Date.now(),
          fecha_tasa: fecha,
          tasa_bolivares: monto,
          fuente: fuente,
          observaciones: obs
        });
        saveState();
        renderHome();
        renderResumen();
        renderDeudas();
        showToast('Tasa del día guardada correctamente', 'success');
      }
    });

    // Form Nueva Deuda
    document.getElementById('form-nueva-deuda')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const idCliente = parseInt(document.getElementById('id_cliente_selected').value);
      const desc = document.getElementById('deuda-desc').value.trim();
      const monto = parseFloat(document.getElementById('deuda-monto').value);
      const moneda = document.getElementById('deuda-moneda').value;
      const fecha = document.getElementById('deuda-fecha').value;
      const venc = document.getElementById('deuda-vencimiento').value;
      const obs = document.getElementById('deuda-obs').value.trim();

      if (!idCliente) {
        showToast('Por favor selecciona un cliente válido de la lista', 'danger');
        return;
      }

      const tasaActual = getTasaActual().tasa_bolivares || 36.50;

      const nuevaDeuda = {
        id_deuda: Date.now(),
        id_cliente: idCliente,
        descripcion: desc,
        monto_total: monto,
        moneda: moneda,
        tasa_dolar_dia: tasaActual,
        fecha_deuda: fecha,
        fecha_vencimiento: venc || null,
        estado: 'PENDIENTE',
        observaciones: obs
      };

      state.deudas.push(nuevaDeuda);
      saveState();
      this.reset();
      document.getElementById('cliente-selected-info').style.display = 'none';
      showToast('Nueva deuda registrada exitosamente', 'success');
      navigateTo('page-deudas');
    });

    // Payment Dual/Simple toggle
    document.getElementById('pago-metodo')?.addEventListener('change', function () {
      const isDual = this.value === 'BS/$';
      document.getElementById('container-monto-simple').style.display = isDual ? 'none' : 'block';
      document.getElementById('container-monto-dual').style.display = isDual ? 'block' : 'none';
    });

    // Form Pago
    document.getElementById('form-pago')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const idDeuda = parseInt(document.getElementById('id_deuda_selected').value);
      const metodo = document.getElementById('pago-metodo').value;
      const obs = document.getElementById('pago-obs').value.trim();
      const tasaActual = getTasaActual().tasa_bolivares || 36.50;

      if (!idDeuda) {
        showToast('Por favor selecciona una deuda pendiente', 'danger');
        return;
      }

      let montoPago = 0;
      let monedaPago = 'BS';

      if (metodo === 'BS/$') {
        const montoBs = parseFloat(document.getElementById('pago-monto-bs').value) || 0;
        const montoUsd = parseFloat(document.getElementById('pago-monto-usd').value) || 0;
        montoPago = montoBs + (montoUsd * tasaActual);
        monedaPago = 'BS';
      } else {
        montoPago = parseFloat(document.getElementById('pago-monto').value) || 0;
        monedaPago = document.getElementById('pago-moneda').value;
      }

      if (montoPago <= 0) {
        showToast('Ingresa un monto de pago válido', 'danger');
        return;
      }

      state.pagos.push({
        id_pago: Date.now(),
        id_deuda: idDeuda,
        fecha_pago: new Date().toISOString().split('T')[0],
        monto_pago: montoPago,
        moneda: monedaPago,
        tasa_dolar_dia: tasaActual,
        metodo_pago: metodo,
        observaciones: obs
      });

      // Update debt status if fully paid
      const deuda = state.deudas.find(d => Number(d.id_deuda) === idDeuda);
      if (deuda) {
        const calc = computeDeudaTotals(deuda);
        if (calc.pendBs <= 0.01) {
          deuda.estado = 'PAGADA';
        } else {
          deuda.estado = 'PARCIAL';
        }
      }

      saveState();
      this.reset();
      document.getElementById('deuda-selected-info').style.display = 'none';
      showToast('Pago registrado correctamente', 'success');
      navigateTo('page-deudas');
    });

    // Form Cliente
    document.getElementById('form-cliente')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const nombre = document.getElementById('cliente-nombre').value.trim();
      const apellido = document.getElementById('cliente-apellido').value.trim();
      const alias = document.getElementById('cliente-alias').value.trim();

      if (nombre && apellido) {
        state.clientes.push({
          id_cliente: Date.now(),
          nombre,
          apellido,
          alias: alias || null,
          fecha_registro: new Date().toISOString().split('T')[0],
          estado: 'ACTIVO'
        });
        saveState();
        this.reset();
        renderClientes();
        renderResumen();
        showToast('Cliente registrado exitosamente', 'success');
      }
    });

    // Data Export / Import / Reset
    document.getElementById('btn-export-json')?.addEventListener('click', function () {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `SACI_Respaldo_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Respaldo descargado exitosamente', 'info');
    });

    document.getElementById('btn-import-json')?.addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (evt) {
        try {
          const imported = JSON.parse(evt.target.result);
          if (imported.clientes && imported.deudas) {
            state = imported;
            saveState();
            renderHome();
            renderResumen();
            renderDeudas();
            renderClientes();
            showToast('Datos importados con éxito', 'success');
          } else {
            showToast('Formato de archivo inválido', 'danger');
          }
        } catch (err) {
          showToast('Error al leer el archivo JSON', 'danger');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('btn-reset-demo')?.addEventListener('click', function () {
      if (confirm('¿Estás seguro de restablecer los datos iniciales de demostración?')) {
        localStorage.removeItem(STORAGE_KEYS.CLIENTES);
        localStorage.removeItem(STORAGE_KEYS.TASAS);
        localStorage.removeItem(STORAGE_KEYS.DEUDAS);
        localStorage.removeItem(STORAGE_KEYS.PAGOS);
        loadState();
        renderHome();
        renderResumen();
        renderDeudas();
        renderClientes();
        showToast('Datos de demo restablecidos', 'info');
      }
    });

    // Close panel
    document.getElementById('close-panel-btn')?.addEventListener('click', closeHistorialPanel);

    // Filters and Sorting listeners
    ['filter-resumen', 'sort-resumen'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderResumen);
      document.getElementById(id)?.addEventListener('change', renderResumen);
    });

    ['filter-deudas', 'sort-deudas'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', renderDeudas);
      document.getElementById(id)?.addEventListener('change', renderDeudas);
    });
  }

  // Router Navigation
  function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetSection = document.getElementById(pageId);
    if (targetSection) targetSection.classList.add('active');

    const navLink = document.querySelector(`.nav-link[data-target="${pageId}"]`);
    if (navLink) navLink.classList.add('active');

    if (pageId === 'page-home') renderHome();
    if (pageId === 'page-resumen') renderResumen();
    if (pageId === 'page-deudas') renderDeudas();
    if (pageId === 'page-clientes') renderClientes();

    window.scrollTo(0, 0);
  }

  function setupRouting() {
    document.querySelectorAll('.nav-link, #brand-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('data-target') || 'page-home';
        const hash = this.getAttribute('href');
        if (hash) history.pushState(null, '', hash);
        navigateTo(targetId);
      });
    });

    window.addEventListener('popstate', function () {
      const hash = window.location.hash.replace('#', '') || 'home';
      const targetMap = {
        'home': 'page-home',
        'resumen': 'page-resumen',
        'deudas': 'page-deudas',
        'nueva-deuda': 'page-nueva-deuda',
        'pagos': 'page-pagos',
        'clientes': 'page-clientes'
      };
      navigateTo(targetMap[hash] || 'page-home');
    });

    // Default Date values in forms
    const todayStr = new Date().toISOString().split('T')[0];
    const tasaFechaInput = document.getElementById('tasa-fecha');
    if (tasaFechaInput) tasaFechaInput.value = todayStr;

    const deudaFechaInput = document.getElementById('deuda-fecha');
    if (deudaFechaInput) deudaFechaInput.value = todayStr;
  }

  // Initialization
  document.addEventListener('DOMContentLoaded', function () {
    loadState();
    renderThemeAndCurrency();
    setupRouting();
    setupAutocompleteCliente();
    setupAutocompleteDeuda();
    attachEventHandlers();

    // Initial page load trigger
    const initialHash = window.location.hash.replace('#', '') || 'home';
    const targetMap = {
      'home': 'page-home',
      'resumen': 'page-resumen',
      'deudas': 'page-deudas',
      'nueva-deuda': 'page-nueva-deuda',
      'pagos': 'page-pagos',
      'clientes': 'page-clientes'
    };
    navigateTo(targetMap[initialHash] || 'page-home');
  });

})();
