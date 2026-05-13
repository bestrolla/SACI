document.addEventListener('DOMContentLoaded',function(){
  var saved=localStorage.getItem('theme');
  if(saved==='dark'){document.body.classList.add('dark')}
  try{
    fetch('tema.php?get=1').then(function(r){return r.json();}).then(function(d){
      if(d && d.theme){
        if(d.theme==='dark'){document.body.classList.add('dark');}
        else{document.body.classList.remove('dark');}
        localStorage.setItem('theme',d.theme);
        setLabel();
        var logo=document.getElementById('brand-logo');
        if(logo){ if(d.theme==='dark'){logo.src='assets/img/logo2.jpg';} else {logo.src='assets/img/logo1.jpg';} }
      }
    }).catch(function(){});
  }catch(e){}
  var btn=document.getElementById('theme-toggle');
  var logo=document.getElementById('brand-logo');
  function setLabel(){
    if(!btn)return;
    if(document.body.classList.contains('dark')){btn.textContent='☀️ Claro';btn.title='Cambiar a tema claro'}
    else{btn.textContent='🌙 Oscuro';btn.title='Cambiar a tema oscuro'}
  }
  function setLogo(){
    if(!logo)return;
    if(document.body.classList.contains('dark')){logo.src='assets/img/logo2.jpg';}
    else{logo.src='assets/img/logo1.jpg';}
  }
  setLabel();
  setLogo();
  if(btn){
    btn.addEventListener('click',function(e){
      e.preventDefault();
      var isDark=document.body.classList.toggle('dark');
      localStorage.setItem('theme',isDark?'dark':'light');
      setLabel();
      try{fetch('tema.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'theme='+(isDark?'dark':'light')}).catch(function(){});}catch(e){}
      var logo=document.getElementById('brand-logo');
      if(logo){ if(isDark){logo.src='assets/img/logo2.jpg';} else {logo.src='assets/img/logo1.jpg';} }
    })
  }
  var cur=document.getElementById('currency-toggle');
  var savedCur=localStorage.getItem('currency');
  if(savedCur==='USD'){document.body.classList.add('currency-usd')}
  function setCur(){
    if(!cur)return;
    if(document.body.classList.contains('currency-usd')){cur.textContent='$';cur.title='Mostrar en dólares'}
    else{cur.textContent='Bs';cur.title='Mostrar en bolívares'}
  }
  setCur();
  if(cur){
    cur.addEventListener('click',function(e){
      e.preventDefault();
      var isUsd=document.body.classList.toggle('currency-usd');
      localStorage.setItem('currency',isUsd?'USD':'BS');
      setCur();
    })
  }
  var filters=document.querySelectorAll('.filter-input');
  filters.forEach(function(inp){
    var sel=inp.getAttribute('data-target');
    var table=sel?document.querySelector(sel):null;
    function apply(){
      if(!table)return;
      var q=(inp.value||'').toLowerCase();
      var rows=table.querySelectorAll('tr');
      for(var i=1;i<rows.length;i++){
        var txt=rows[i].textContent.toLowerCase();
        rows[i].style.display= q && txt.indexOf(q)===-1 ? 'none' : '';
      }
    }
    inp.addEventListener('input',apply);
  });
  var sorts=document.querySelectorAll('.sort-input');
  function numFromText(txt){
    var s=(txt||'').replace(/[^0-9.,-]/g,'').replace(/,/g,'');
    var n=parseFloat(s);return isNaN(n)?0:n;
  }
  function sortTable(table,mode){
    if(!table)return;
    var tbody=table.tBodies && table.tBodies[0];
    var rows;
    var useBody = !!tbody;
    if(useBody){
      var all=[].slice.call(tbody.querySelectorAll('tr'));
      var header=null;
      if(all.length && all[0].querySelector('th')){ header=all.shift(); }
      rows=all;
    }else{
      var all=[].slice.call(table.querySelectorAll('tr'));
      if(!all.length) return;
      var header=all.shift();
      rows=all;
    }
    var cmp=function(a,b){return 0};
    if(mode==='name_asc' || mode==='name_desc'){
      cmp=function(a,b){
        var ta,tb;
        if(table && table.id==='tbl-clientes'){
          ta=((a.cells[1]?a.cells[1].textContent:'')+' '+(a.cells[2]?a.cells[2].textContent:'')).trim().toLowerCase();
          tb=((b.cells[1]?b.cells[1].textContent:'')+' '+(b.cells[2]?b.cells[2].textContent:'')).trim().toLowerCase();
        }else{
          ta=(a.cells[0]?a.cells[0].textContent:'').trim().toLowerCase();
          tb=(b.cells[0]?b.cells[0].textContent:'').trim().toLowerCase();
        }
        return ta.localeCompare(tb);
      };
      if(mode==='name_desc'){var old=cmp;cmp=function(a,b){return -old(a,b)};}
    }else if(mode==='date_asc' || mode==='date_desc'){
      cmp=function(a,b){
        var ta=(a.cells[3]?a.cells[3].textContent:'').trim();
        var tb=(b.cells[3]?b.cells[3].textContent:'').trim();
        var da=new Date(ta.replace(/\//g,'-'));
        var db=new Date(tb.replace(/\//g,'-'));
        return da-db;
      };
      if(mode==='date_desc'){var old2=cmp;cmp=function(a,b){return -old2(a,b)};}
    }else{
      cmp=function(a,b){
        var ta=numFromText((a.querySelector('td .amount .bs')?a.querySelector('td .amount .bs').textContent:'0'));
        var tb=numFromText((b.querySelector('td .amount .bs')?b.querySelector('td .amount .bs').textContent:'0'));
        return ta-tb;
      };
      if(mode==='pend_desc'){var old3=cmp;cmp=function(a,b){return -old3(a,b)};}
    }
    rows.sort(cmp);
    var frag=document.createDocumentFragment();
    for(var r=0;r<rows.length;r++){frag.appendChild(rows[r]);}
    if(useBody){
      tbody.appendChild(frag);
    }else{
      table.appendChild(frag);
    }
  }
  sorts.forEach(function(sel){
    var target=sel.getAttribute('data-target');
    var table=target?document.querySelector(target):null;
    var tableId=target?target.replace(/^#/,''):'';
    sel.addEventListener('change',function(){
      sortTable(table,sel.value);
      try{fetch('orden.php',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'id='+encodeURIComponent(tableId)+'&order='+encodeURIComponent(sel.value)}).catch(function(){});}catch(e){}
    });
    try{
      fetch('orden.php?id='+encodeURIComponent(tableId)).then(function(r){return r.json();}).then(function(d){
        if(d && d.order){ sel.value=d.order; }
        sortTable(table,sel.value);
      }).catch(function(){ sortTable(table,sel.value); });
    }catch(e){ sortTable(table,sel.value); }
  });
  
  var panel=document.getElementById('historial-panel');
  var content=document.getElementById('historial-content');
  if(panel && content){
    var closeBtn=panel.querySelector('.close-btn');
    function close(){panel.classList.remove('open');panel.setAttribute('aria-hidden','true');content.innerHTML='';}
    if(closeBtn){closeBtn.addEventListener('click',function(e){e.preventDefault();close();});}
    function renderHistorial(rows){
      var html='';
      if(!rows || !rows.length){
        html='<p>No hay facturas para este cliente.</p>';
      }else{
        html+='<table border="1" cellpadding="6">\n';
        html+='<tr><th>Fecha</th><th>Descripción</th><th>Total</th></tr>';
        for(var i=0;i<rows.length;i++){
          var r=rows[i];
          var mon=(r.moneda||'BS');
          var t=parseFloat(r.tasa_dolar_dia||0)||0;
          var mt=parseFloat(r.monto_total||0)||0;
          var bsTot= mon==='USD' ? mt*t : mt;
          var usdTot= mon==='USD' ? mt : (t>0? (mt/t) : 0);
          html+='<tr>'+
            '<td>'+ (r.fecha_deuda||'') +'</td>'+
            '<td>'+ (r.descripcion||'') +'</td>'+
            '<td><span class="amount"><span class="bs">Bs '+ bsTot +'</span><span class="usd">$ '+ usdTot.toFixed(2) +'</span></span></td>'+
          '</tr>';
        }
        html+='</table>';
      }
      content.innerHTML=html;
      panel.classList.add('open');
      panel.setAttribute('aria-hidden','false');
    }
    function openHistorial(id){
      var url='deudas.php?historial=1&id_cliente='+encodeURIComponent(id);
      if(window.fetch){
        fetch(url).then(function(r){return r.json();}).then(function(rows){renderHistorial(rows);}).catch(function(){content.innerHTML='<p>Error cargando historial.</p>';panel.classList.add('open');panel.setAttribute('aria-hidden','false');});
      }else{
        var xhr=new XMLHttpRequest();
        xhr.open('GET',url,true);
        xhr.onreadystatechange=function(){
          if(xhr.readyState===4){
            if(xhr.status===200){
              try{var rows=JSON.parse(xhr.responseText);}catch(e){rows=[]}
              renderHistorial(rows);
            }else{
              content.innerHTML='<p>Error cargando historial.</p>';panel.classList.add('open');panel.setAttribute('aria-hidden','false');
            }
          }
        };
        xhr.send();
      }
    }
    document.addEventListener('click',function(e){
      var t=e.target;
      if(t && t.classList && t.classList.contains('btn-historial')){
        var id=t.getAttribute('data-id-cliente');
        if(!id){return;}
        openHistorial(id);
      }
    });
    document.addEventListener('click',function(e){
      if(!panel.classList.contains('open')) return;
      var t=e.target;
      var inside=(t && typeof t.closest==='function') ? t.closest('#historial-panel') : null;
      var trigger=(t && typeof t.closest==='function') ? t.closest('.btn-historial') : null;
      if(!inside && !trigger){close();}
    });
  }

  var deudaSearch=document.getElementById('deuda-search');
  var deudaList=document.getElementById('deuda-suggest');
  var deudaHidden=document.getElementById('id_deuda');
  var idsHidden=document.getElementById('ids_deudas');
  var deudaSelected=document.getElementById('deuda-selected');
  var deudaPickList=document.getElementById('deuda-pick-list');
  var deudaData=Array.isArray(window.__deudasPendientes)?window.__deudasPendientes:[];
  var selectedPenBs=null, selectedPenUsd=null;
  var selectedDebts=[];
  function updateSelected(){
    var totalBs=selectedDebts.reduce(function(acc,d){return acc + (d.bsTot||0);},0);
    var totalUsd=(tasaActual>0)? (totalBs/tasaActual) : 0;
    selectedPenBs=totalBs; selectedPenUsd=totalUsd;
    if(idsHidden){ idsHidden.value = selectedDebts.map(function(d){return d.id}).join(','); }
    if(deudaHidden){ deudaHidden.value = selectedDebts.length===1 ? selectedDebts[0].id : 0; }
    if(deudaSelected){ deudaSelected.innerHTML = selectedDebts.length ? ('Total pendiente: <span class="amount"><span class="bs">Bs '+ totalBs.toFixed(2) +'</span><span class="usd">$ '+ totalUsd.toFixed(2) +'</span></span>') : ''; }
    if(deudaPickList){ deudaPickList.innerHTML = selectedDebts.map(function(d){ return '<div class="pick-item" data-id="'+ d.id +'">'+ d.title +' — <span class="amount"><span class="bs">Bs '+ (d.bsTot||0).toFixed(2) +'</span><span class="usd">$ '+ (d.usdTot||0).toFixed(2) +'</span></span> <button type="button" class="rm-deuda" data-id="'+ d.id +'">Quitar</button></div>'; }).join(''); }
  }
  function addDebtById(id){
    var sel=deudaData.find(function(r){return String(r.id_deuda)===String(id)});
    if(!sel) return;
    if(selectedDebts.some(function(d){return String(d.id)===String(sel.id_deuda)})) return;
    var alias=(sel.alias||'');
    var name=(sel.nombre_completo||'');
    var desc=(sel.descripcion||'');
    var mon=(sel.moneda||'BS');
    var pen=parseFloat(sel.deuda_pendiente||0)||0; if(pen<0){pen=0;}
    var bsTot= mon==='USD' ? pen*(tasaActual||0) : pen;
    var usdTot= mon==='USD' ? pen : ((tasaActual||0)>0? (pen/(tasaActual||0)) : 0); if(bsTot<0){bsTot=0;} if(usdTot<0){usdTot=0;}
    var title=name + (alias ? ' ('+ alias +')' : '') + ' - ' + desc;
    selectedDebts.push({id:sel.id_deuda, mon:mon, pen:pen, bsTot:bsTot, usdTot:usdTot, title:title});
    updateSelected();
  }
  var montoInput=document.querySelector('input[name="monto"]');
  var monedaSel=document.querySelector('select[name="moneda"]');
  var metodoSel=document.querySelector('select[name="metodo"]');
  var dualBox=document.querySelector('.dual-amount');
  var montoBsInput=document.querySelector('input[name="monto_bs"]');
  var montoUsdInput=document.querySelector('input[name="monto_usd"]');
  var tasaActual=(typeof window.__tasaActual==='number')?window.__tasaActual:parseFloat(window.__tasaActual||'0')||0;
  function clampMonto(){
    if(!montoInput) return;
    var val=parseFloat(montoInput.value||'');
    if(isNaN(val)) return;
    var cap=(monedaSel && monedaSel.value==='USD') ? selectedPenUsd : selectedPenBs;
    if(typeof cap==='number' && !isNaN(cap) && val>cap){
      montoInput.value = (monedaSel && monedaSel.value==='USD') ? cap.toFixed(2) : cap.toFixed(2);
      var bsCap = (monedaSel && monedaSel.value==='USD') ? (cap * (tasaActual||0)) : cap;
      var usdCap = (monedaSel && monedaSel.value==='USD') ? cap : ((tasaActual||0)>0 ? (cap/(tasaActual||0)) : 0);
      if(montoBsInput){montoBsInput.value = bsCap ? bsCap.toFixed(2) : '';}
      if(montoUsdInput){montoUsdInput.value = usdCap ? usdCap.toFixed(2) : '';}
    }
  }
  function showDual(show){ if(dualBox){ dualBox.style.display = show? 'flex':'none'; } }
  function clampDual(editing){
    var usd = parseFloat(montoUsdInput && montoUsdInput.value || ''); if(isNaN(usd)) usd = 0;
    var bs = parseFloat(montoBsInput && montoBsInput.value || ''); if(isNaN(bs)) bs = 0;
    var penBs = typeof selectedPenBs==='number' ? selectedPenBs : 0;
    var usedBs = bs + usd * (tasaActual||0);
    if(usedBs > penBs){
      if(editing==='bs'){
        var maxBs = Math.max(0, penBs - (usd * (tasaActual||0)));
        if(montoBsInput){montoBsInput.value = (tasaActual? maxBs.toFixed(2) : String(maxBs));}
      }else if(editing==='usd'){
        var maxUsd = (tasaActual>0)? Math.max(0, (penBs - bs)/tasaActual) : 0;
        if(montoUsdInput){montoUsdInput.value = maxUsd ? maxUsd.toFixed(2) : '';}
      }
    }
  }
  function applyMetodoUI(){
    var isDual = metodoSel && metodoSel.value==='BS/$';
    showDual(!!isDual);
    if(montoInput){montoInput.style.display = isDual? 'none':'block'; montoInput.required = !isDual;}
    if(montoBsInput){montoBsInput.required = !!isDual;}
    if(montoUsdInput){montoUsdInput.required = !!isDual;}
  }
  if(metodoSel){
    applyMetodoUI();
    metodoSel.addEventListener('change',applyMetodoUI);
  }
  var pagosForm = (montoInput && metodoSel) ? montoInput.closest('form') : null;
  if(pagosForm){
    pagosForm.addEventListener('submit',function(e){
      var isDual = metodoSel && metodoSel.value==='BS/$';
      if(!isDual) return;
      var usd=parseFloat(montoUsdInput && montoUsdInput.value || '');
      var bs=parseFloat(montoBsInput && montoBsInput.value || '');
      if(!(usd>0) && !(bs>0)){ e.preventDefault(); return; }
      var penBs = typeof selectedPenBs==='number' ? selectedPenBs : 0;
      var usedBs = (bs||0) + (usd||0) * (tasaActual||0);
      if(usedBs > penBs){ e.preventDefault(); return; }
      if(montoInput){montoInput.value='';}
    });
  }
  if(montoBsInput){montoBsInput.addEventListener('input',function(){clampDual('bs');});}
  if(montoUsdInput){montoUsdInput.addEventListener('input',function(){clampDual('usd');});}
  function deudaRender(q){
    if(!deudaList)return;
    var query=(q||'').toLowerCase();
    var filtered=deudaData.filter(function(r){
      var txt=((r.nombre_completo||'')+' '+(r.descripcion||'')).toLowerCase();
      return query? txt.indexOf(query)>-1 : false;
    });
    var byClient={};
    for(var i=0;i<filtered.length;i++){
      var r=filtered[i];
      var key=(r.nombre_completo||'')+'|'+(r.alias||'');
      var mon=(r.moneda||'BS');
      var pen=parseFloat(r.deuda_pendiente||0)||0; if(pen<0.005){pen=0;}
      var penBs= mon==='USD' ? pen*(tasaActual||0) : pen;
      if(!byClient[key]){ byClient[key]={nombre:(r.nombre_completo||''), alias:(r.alias||''), totalBs:0, ids:[]}; }
      byClient[key].totalBs += penBs;
      byClient[key].ids.push(r.id_deuda);
    }
    var rows=Object.keys(byClient).map(function(k){ var g=byClient[k]; return {nombre:g.nombre, alias:g.alias, totalBs:g.totalBs, totalUsd:(tasaActual>0? g.totalBs/tasaActual : 0), ids:g.ids}; }).slice(0,10);
    var html='';
    if(!rows.length){html='<div class="autocomplete-empty">No hay coincidencias</div>'}
    else{
      for(var i=0;i<rows.length;i++){
        var g=rows[i];
        html+='<div class="autocomplete-item" data-ids="'+ g.ids.join(',') +'">'+
          '<div>'+ g.nombre + (g.alias ? ' ('+ g.alias +')' : '') +'</div>'+ 
          '<div class="amount"><span class="bs">Bs '+ g.totalBs.toFixed(2) +'</span><span class="usd">$ '+ g.totalUsd.toFixed(2) +'</span></div>'+ 
        '</div>';
      }
    }
    deudaList.innerHTML=html;
    if(query){deudaList.classList.add('open');}
    else{deudaList.classList.remove('open');}
  }
  if(deudaSearch && deudaList){
    deudaSearch.addEventListener('input',function(){
      deudaHidden && (deudaHidden.value='');
      if(deudaSelected){deudaSelected.innerHTML='';}
      deudaRender(deudaSearch.value);
    });
    deudaSearch.addEventListener('blur',function(){
      setTimeout(function(){ if(deudaList){deudaList.classList.remove('open');} }, 150);
    });
    deudaSearch.addEventListener('focus',function(){
      if(deudaSearch.value){deudaList.classList.add('open');}
    });
    document.addEventListener('click',function(e){
      var item=(e.target && typeof e.target.closest==='function') ? e.target.closest('.autocomplete-item') : null;
      if(item){
        var idsAttr=item.getAttribute('data-ids');
        if(idsAttr){
          var parts=idsAttr.split(',');
          for(var k=0;k<parts.length;k++){ if(parts[k]) addDebtById(parts[k]); }
          deudaList.classList.remove('open');
          return;
        }
        var id=item.getAttribute('data-id');
        if(id){ addDebtById(id); deudaList.classList.remove('open'); }
        return;
      }
      var rm=(e.target && typeof e.target.closest==='function') ? e.target.closest('.rm-deuda') : null;
      if(rm){
        var rid=rm.getAttribute('data-id');
        selectedDebts=selectedDebts.filter(function(d){return String(d.id)!==String(rid)});
        var totalBs=selectedDebts.reduce(function(acc,d){return acc + (d.bsTot||0);},0);
        var totalUsd=(tasaActual>0)? (totalBs/tasaActual) : 0;
        selectedPenBs=totalBs; selectedPenUsd=totalUsd;
        if(idsHidden){ idsHidden.value = selectedDebts.map(function(d){return d.id}).join(','); }
        if(deudaHidden){ deudaHidden.value = selectedDebts.length===1 ? selectedDebts[0].id : 0; }
        if(deudaSelected){ deudaSelected.innerHTML = selectedDebts.length ? ('Total pendiente: <span class="amount"><span class="bs">Bs '+ totalBs.toFixed(2) +'</span><span class="usd">$ '+ totalUsd.toFixed(2) +'</span></span>') : ''; }
        if(deudaPickList){ deudaPickList.innerHTML = selectedDebts.map(function(d){ return '<div class="pick-item" data-id="'+ d.id +'">'+ d.title +' — <span class="amount"><span class="bs">Bs '+ (d.bsTot||0).toFixed(2) +'</span><span class="usd">$ '+ (d.usdTot||0).toFixed(2) +'</span></span> <button type="button" class="rm-deuda" data-id="'+ d.id +'">Quitar</button></div>'; }).join(''); }
        return;
      }
      var t=e.target;
      if(deudaList && !deudaList.contains(t) && t!==deudaSearch){deudaList.classList.remove('open');}
    });
    deudaSearch.addEventListener('keydown',function(e){
      if(!deudaList.classList.contains('open'))return;
      var items=deudaList.querySelectorAll('.autocomplete-item');
      if(!items.length)return;
      var idx=-1;
      for(var i=0;i<items.length;i++){if(items[i].classList.contains('active')){idx=i;break;}}
      if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,items.length-1);} 
      else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0);} 
      else if(e.key==='Enter'){e.preventDefault();if(idx>-1){items[idx].click();}return;}
      else if(e.key==='Escape'){deudaList.classList.remove('open');return;}
      for(var j=0;j<items.length;j++){items[j].classList.toggle('active',j===idx);} 
    });
    if(montoInput){montoInput.addEventListener('input',clampMonto);}
    if(monedaSel){monedaSel.addEventListener('change',clampMonto);}
  }
  var clienteSearch=document.getElementById('cliente-search');
  var clienteList=document.getElementById('cliente-suggest');
  var clienteHidden=document.getElementById('id_cliente');
  var clienteSelected=document.getElementById('cliente-selected');
  var clienteData=Array.isArray(window.__clientesActivos)?window.__clientesActivos:[];
  function clienteRender(q){
    if(!clienteList)return;
    var query=(q||'').toLowerCase();
    var filtered=clienteData.filter(function(r){
      var txt=((r.nombre||'')+' '+(r.apellido||'')+' '+(r.alias||'')).toLowerCase();
      return query? txt.indexOf(query)>-1 : false;
    }).slice(0,10);
    var html='';
    if(!filtered.length){html='<div class="autocomplete-empty">No hay coincidencias</div>'}
    else{
      for(var i=0;i<filtered.length;i++){
        var r=filtered[i];
        var name=(r.nombre||'')+' '+(r.apellido||'');
        var alias=(r.alias||'');
        html+='<div class="autocomplete-item" data-id="'+ r.id_cliente +'">'+
          '<div>'+ name + (alias ? ' ('+ alias +')' : '') +'</div>'+
        '</div>';
      }
    }
    clienteList.innerHTML=html;
    if(query){clienteList.classList.add('open');}
    else{clienteList.classList.remove('open');}
  }
  if(clienteSearch && clienteList){
    clienteSearch.addEventListener('input',function(){
      clienteHidden && (clienteHidden.value='');
      if(clienteSelected){clienteSelected.innerHTML='';}
      clienteRender(clienteSearch.value);
    });
    clienteSearch.addEventListener('blur',function(){
      setTimeout(function(){ if(clienteList){clienteList.classList.remove('open');} }, 150);
    });
    clienteSearch.addEventListener('focus',function(){
      if(clienteSearch.value){clienteList.classList.add('open');}
    });
    document.addEventListener('click',function(e){
      var item=(e.target && typeof e.target.closest==='function') ? e.target.closest('.autocomplete-item') : null;
      if(item && clienteList && clienteList.contains(item)){
        var id=item.getAttribute('data-id');
        var sel=clienteData.find(function(r){return String(r.id_cliente)===String(id)});
        if(sel){
          var name=(sel.nombre||'')+' '+(sel.apellido||'');
          var alias=(sel.alias||'');
          if(clienteHidden){clienteHidden.value=sel.id_cliente;}
          if(clienteSearch){clienteSearch.value= name + (alias ? ' ('+ alias +')' : '');}
          if(clienteSelected){
            clienteSelected.innerHTML= name + (alias ? ' ('+ alias +')' : '');
          }
          clienteList.classList.remove('open');
        }
        return;
      }
      var t=e.target;
      if(clienteList && !clienteList.contains(t) && t!==clienteSearch){clienteList.classList.remove('open');}
    });
    clienteSearch.addEventListener('keydown',function(e){
      if(!clienteList.classList.contains('open'))return;
      var items=clienteList.querySelectorAll('.autocomplete-item');
      if(!items.length)return;
      var idx=-1;
      for(var i=0;i<items.length;i++){if(items[i].classList.contains('active')){idx=i;break;}}
      if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,items.length-1);} 
      else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0);} 
      else if(e.key==='Enter'){e.preventDefault();if(idx>-1){items[idx].click();}return;}
      else if(e.key==='Escape'){clienteList.classList.remove('open');return;}
      for(var j=0;j<items.length;j++){items[j].classList.toggle('active',j===idx);} 
    });
  }
})
