(function () {
  'use strict';

  function initEstoque() {
    var grid = document.getElementById('stockGrid');
    if (!grid || typeof VEICULOS_DESTAQUE === 'undefined') return;

    var DATA = VEICULOS_DESTAQUE.slice();
    if (!DATA.length) return;

    var $ = function (sel) { return document.querySelector(sel); };
    var brl = function (n) { return 'R$ ' + n.toLocaleString('pt-BR'); };
    var plural = function (n) { return n + (n === 1 ? ' veículo' : ' veículos'); };

    function anoInicial(ano) {
      if (!ano) return null;
      var match = String(ano).match(/\d{4}/);
      return match ? parseInt(match[0], 10) : null;
    }
    DATA.forEach(function (v) { v._ano = anoInicial(v.ano); });

    var els = {
      search: document.getElementById('stockSearch'),
      sort: document.getElementById('stockSort'),
      count: document.getElementById('stockCount'),
      apply: document.getElementById('stockApply'),
      clear: document.getElementById('stockClear'),
      empty: document.getElementById('stockEmpty'),
      filters: document.getElementById('stockFilters'),
      activeChips: document.getElementById('stockActiveChips'),
      layout: document.getElementById('stockLayout'),
      filterToggle: document.getElementById('stockFilterToggle'),
      filterClose: document.getElementById('stockFilterCloseBtn'),
      backdrop: document.getElementById('stockBackdrop')
    };

    // ---- limites ----
    var precos = DATA.map(function (v) { return v.preco; }).filter(Boolean);
    var PMIN = Math.min.apply(null, precos), PMAX = Math.max.apply(null, precos);
    // Faixa de anos: baseline fixa dos últimos 15 anos (mesma lógica das
    // listas fixas de marca/câmbio/combustível), sempre expandida pra cobrir qualquer
    // veículo real fora dessa faixa, pra nunca esconder um carro no estado sem filtro.
    var anoAtual = new Date().getFullYear();
    var anos = DATA.map(function (v) { return v._ano; }).filter(Boolean);
    var YMIN = Math.min(anoAtual - 15, anos.length ? Math.min.apply(null, anos) : anoAtual);
    var YMAX = Math.max(anoAtual + 1, anos.length ? Math.max.apply(null, anos) : anoAtual);
    var KMAX = Math.max.apply(null, DATA.map(function (v) { return v.km || 0; }));

    function countBy(key) {
      var m = {};
      DATA.forEach(function (v) { var val = v[key]; if (val) m[val] = (m[val] || 0) + 1; });
      return m;
    }
    var byTipo = countBy('categoria'), byMarca = countBy('marca'), byCambio = countBy('cambio'), byCombustivel = countBy('combustivel');

    // Listas fixas (sempre exibidas no filtro, independente do estoque atual)
    var TIPOS_FIXOS = ['Hatch', 'Sedã', 'SUV', 'Picape', 'Utilitário', 'Moto'];
    var MARCAS_FIXAS = ['Volkswagen', 'Chevrolet', 'Fiat', 'Ford', 'Toyota', 'Honda', 'Hyundai', 'Renault', 'Nissan', 'Jeep', 'Peugeot', 'Citroën', 'Mitsubishi', 'Kia'];
    var CAMBIO_FIXO = ['Manual', 'Automático', 'Automatizado'];
    var COMBUSTIVEL_FIXO = ['Flex', 'Gasolina', 'Diesel', 'Híbrido', 'Elétrico'];

    // ---- estado: F = filtro ativo | D = rascunho da sidebar ----
    function blankSide() {
      return { tipo: new Set(), marca: new Set(), cambio: new Set(), combustivel: new Set(), precoMax: PMAX, anoMin: YMIN, anoMax: YMAX, kmMax: KMAX };
    }
    function cloneSide(s) {
      return { tipo: new Set(s.tipo), marca: new Set(s.marca), cambio: new Set(s.cambio), combustivel: new Set(s.combustivel), precoMax: s.precoMax, anoMin: s.anoMin, anoMax: s.anoMax, kmMax: s.kmMax };
    }
    var F = { q: '', side: blankSide(), sort: 'relevancia' };
    var D = cloneSide(F.side);

    function matches(v, q, side) {
      if (q) {
        var termo = q.toLowerCase().trim();
        var alvo = (v.nome + ' ' + v.marca + ' ' + v.categoria).toLowerCase();
        if (alvo.indexOf(termo) === -1) return false;
      }
      if (side.tipo.size && !side.tipo.has(v.categoria)) return false;
      if (side.marca.size && !side.marca.has(v.marca)) return false;
      if (side.cambio.size && !side.cambio.has(v.cambio)) return false;
      if (side.combustivel.size && !side.combustivel.has(v.combustivel)) return false;
      if (v.preco && v.preco > side.precoMax) return false;
      if (v._ano && (v._ano < side.anoMin || v._ano > side.anoMax)) return false;
      if (v.km && v.km > side.kmMax) return false;
      return true;
    }

    // ---- sidebar (accordion, rascunho) ----
    var chevSvg = '<svg class="stock-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
    function group(title, inner) {
      return '<div class="stock-fgroup" data-open="false">' +
        '<button type="button" class="stock-fgroup-head"><span>' + title + '</span>' + chevSvg + '</button>' +
        '<div class="stock-fgroup-body"><div class="stock-fgroup-inner">' + inner + '</div></div>' +
        '</div>';
    }
    function checks(key, keys, counts) {
      return keys.map(function (k) {
        return '<label class="stock-check"><input type="checkbox" data-f="' + key + '" value="' + k + '"><span class="box"></span><span class="lbl">' + k + '</span><span class="cnt">' + (counts[k] || 0) + '</span></label>';
      }).join('');
    }
    function checksWithAll(key, keys, counts) {
      var all = '<label class="stock-check stock-check-all"><input type="checkbox" data-all="' + key + '" checked><span class="box"></span><span class="lbl">Todos</span><span class="cnt">' + DATA.length + '</span></label>';
      return all + checks(key, keys, counts);
    }

    // ---- Ano: estado dos campos De/Até ----
    function updateAnoInputs() {
      var deInput = $('#anoDe'), ateInput = $('#anoAte');
      if (deInput) deInput.value = D.anoMin;
      if (ateInput) ateInput.value = D.anoMax;
    }

    if (els.filters) {
      var precoHtml = PMAX > PMIN
        ? '<input type="range" class="stock-range" id="rPreco" min="' + PMIN + '" max="' + PMAX + '" step="1000" value="' + PMAX + '"><div class="stock-rval">Até <span id="rPrecoVal">' + brl(PMAX) + '</span></div>'
        : '<div class="stock-rval">' + brl(PMAX) + '</div>';

      var anoHtml =
        '<div class="stock-year-inputs">' +
          '<div class="stock-year-field"><label for="anoDe">De</label><input type="number" class="stock-year-input" id="anoDe" inputmode="numeric" placeholder="' + YMIN + '" value="' + YMIN + '"></div>' +
          '<span class="stock-year-dash">—</span>' +
          '<div class="stock-year-field"><label for="anoAte">Até</label><input type="number" class="stock-year-input" id="anoAte" inputmode="numeric" placeholder="' + YMAX + '" value="' + YMAX + '"></div>' +
        '</div>';

      var kmHtml = KMAX > 0
        ? '<input type="range" class="stock-range" id="rKm" min="0" max="' + KMAX + '" step="5000" value="' + KMAX + '"><div class="stock-rval">Até <span id="rKmVal">' + KMAX.toLocaleString('pt-BR') + ' km</span></div>'
        : '<div class="stock-rval">Sem informação</div>';

      els.filters.innerHTML =
        group('Tipo', checksWithAll('tipo', TIPOS_FIXOS, byTipo)) +
        group('Marca', checksWithAll('marca', MARCAS_FIXAS, byMarca)) +
        group('Preço', precoHtml) +
        group('Ano', anoHtml) +
        group('Quilometragem', kmHtml) +
        group('Câmbio', checks('cambio', CAMBIO_FIXO, byCambio)) +
        group('Combustível', checks('combustivel', COMBUSTIVEL_FIXO, byCombustivel));

      els.filters.querySelectorAll('.stock-fgroup-head').forEach(function (h) {
        h.addEventListener('click', function () {
          var g = h.parentElement;
          var opening = g.getAttribute('data-open') !== 'true';
          g.setAttribute('data-open', opening ? 'true' : 'false');
          if (opening) {
            setTimeout(function () {
              g.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 260);
          }
        });
      });
      els.filters.querySelectorAll('input[type=checkbox][data-f]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var key = cb.getAttribute('data-f');
          var set = D[key];
          if (cb.checked) set.add(cb.value); else set.delete(cb.value);
          var allCb = els.filters.querySelector('input[data-all="' + key + '"]');
          if (allCb) allCb.checked = set.size === 0;
          refreshApply();
        });
      });
      els.filters.querySelectorAll('input[type=checkbox][data-all]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          var key = cb.getAttribute('data-all');
          D[key].clear();
          els.filters.querySelectorAll('input[data-f="' + key + '"]').forEach(function (opt) { opt.checked = false; });
          cb.checked = true;
          refreshApply();
        });
      });

      var rPreco = $('#rPreco'), rKm = $('#rKm');
      if (rPreco) rPreco.addEventListener('input', function () {
        D.precoMax = Number(rPreco.value);
        $('#rPrecoVal').textContent = D.precoMax >= PMAX ? 'sem limite' : brl(D.precoMax);
        refreshApply();
      });
      if (rKm) rKm.addEventListener('input', function () {
        D.kmMax = Number(rKm.value);
        $('#rKmVal').textContent = D.kmMax >= KMAX ? 'sem limite' : D.kmMax.toLocaleString('pt-BR') + ' km';
        refreshApply();
      });

      // ---- Ano: campos digitáveis (De/Até) ----
      var anoDe = $('#anoDe'), anoAte = $('#anoAte');
      function applyAnoInputs() {
        var de = Number(anoDe.value) || YMIN;
        var ate = Number(anoAte.value) || YMAX;
        D.anoMin = Math.min(de, ate);
        D.anoMax = Math.max(de, ate);
        updateAnoInputs();
        refreshApply();
      }
      if (anoDe) anoDe.addEventListener('change', applyAnoInputs);
      if (anoAte) anoAte.addEventListener('change', applyAnoInputs);
    }

    function syncControls() {
      if (els.filters) {
        els.filters.querySelectorAll('input[type=checkbox][data-f]').forEach(function (cb) {
          cb.checked = D[cb.getAttribute('data-f')].has(cb.value);
        });
        els.filters.querySelectorAll('input[type=checkbox][data-all]').forEach(function (cb) {
          cb.checked = D[cb.getAttribute('data-all')].size === 0;
        });
      }
      var rPreco = $('#rPreco'), rKm = $('#rKm');
      if (rPreco) { rPreco.value = D.precoMax; $('#rPrecoVal').textContent = D.precoMax >= PMAX ? 'sem limite' : brl(D.precoMax); }
      if (rKm) { rKm.value = D.kmMax; $('#rKmVal').textContent = D.kmMax >= KMAX ? 'sem limite' : D.kmMax.toLocaleString('pt-BR') + ' km'; }
      updateAnoInputs();
      refreshApply();
    }

    function draftCount() {
      return DATA.filter(function (v) { return matches(v, F.q, D); }).length;
    }
    function refreshApply() {
      if (!els.apply) return;
      var n = draftCount();
      els.apply.textContent = n ? 'Ver ' + plural(n) : 'Nenhum veículo';
      els.apply.classList.toggle('is-zero', n === 0);
    }

    if (els.apply) els.apply.addEventListener('click', function () {
      F.side = cloneSide(D);
      apply(); closeDrawer();
      $('.stock-layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (els.clear) els.clear.addEventListener('click', function () {
      D = blankSide(); F.side = blankSide(); F.q = '';
      if (els.search) els.search.value = '';
      syncControls(); apply();
    });

    // ---- ordenação ----
    function sortList(list) {
      var mode = F.sort;
      var sorted = list.slice();
      if (mode === 'menor-preco') sorted.sort(function (a, b) { return a.preco - b.preco; });
      else if (mode === 'maior-preco') sorted.sort(function (a, b) { return b.preco - a.preco; });
      else if (mode === 'menor-km') sorted.sort(function (a, b) { return a.km - b.km; });
      else if (mode === 'ano-novo') sorted.sort(function (a, b) { return (b._ano || 0) - (a._ano || 0); });
      return sorted;
    }

    function tituloSemMarca(v) {
      if (v.marca && v.nome.indexOf(v.marca) === 0) return v.nome.slice(v.marca.length).trim();
      return v.nome;
    }

    function cardHTML(v) {
      var href = '../veiculos/' + v.slug + '/';
      var specs = (v.ano ? '<span>' + v.ano + '</span>' : '') +
        '<span>' + v.km.toLocaleString('pt-BR') + ' km</span>';
      var specs2 = (v.cambio ? '<span>' + v.cambio + '</span>' : '') +
        (v.combustivel ? '<span>' + v.combustivel + '</span>' : '');
      var pos = v.fotoPos ? ' style="object-position:' + v.fotoPos + '"' : '';
      return (
        '<article class="vehicle-card reveal is-visible">' +
          '<a class="vehicle-media" href="' + href + '">' +
            '<img src="../' + v.foto + '" alt="' + v.nome + '" loading="lazy"' + pos + ' />' +
          '</a>' +
          '<div class="vehicle-card-body">' +
            '<div class="vehicle-card-heading">' +
              '<div class="vehicle-eyebrow">' + v.marca + ' · ' + v.categoria + '</div>' +
              '<a class="vehicle-card-title" href="' + href + '"><h3>' + tituloSemMarca(v) + '</h3></a>' +
            '</div>' +
            '<div class="vehicle-specs">' + specs + '</div>' +
            (specs2 ? '<div class="vehicle-specs vehicle-specs-2">' + specs2 + '</div>' : '') +
            '<span class="vehicle-price-label">Valor à vista</span>' +
            '<div class="vehicle-price">' + brl(v.preco) + '</div>' +
            '<div class="vehicle-card-actions">' +
              '<a class="btn btn-primary btn-block" href="' + href + '">Ver detalhes</a>' +
            '</div>' +
            '<a class="vehicle-card-arrow" href="' + href + '" aria-label="Ver detalhes">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>' +
            '</a>' +
          '</div>' +
        '</article>'
      );
    }

    // ---- chips de filtro ativo ----
    function renderActiveChips() {
      if (!els.activeChips) return;
      var out = [], fns = [];
      function add(label, fn) {
        out.push('<button class="stock-active-chip" data-idx="' + out.length + '">' + label + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>');
        fns.push(fn);
      }
      F.side.tipo.forEach(function (v) { add(v, function () { F.side.tipo.delete(v); }); });
      F.side.marca.forEach(function (v) { add(v, function () { F.side.marca.delete(v); }); });
      F.side.cambio.forEach(function (v) { add(v, function () { F.side.cambio.delete(v); }); });
      F.side.combustivel.forEach(function (v) { add(v, function () { F.side.combustivel.delete(v); }); });
      if (F.side.precoMax < PMAX) add('Até ' + brl(F.side.precoMax), function () { F.side.precoMax = PMAX; });
      if (F.side.anoMin > YMIN || F.side.anoMax < YMAX) add(F.side.anoMin + '–' + F.side.anoMax, function () { F.side.anoMin = YMIN; F.side.anoMax = YMAX; });
      if (F.side.kmMax < KMAX) add('Até ' + F.side.kmMax.toLocaleString('pt-BR') + ' km', function () { F.side.kmMax = KMAX; });
      if (F.q) add('"' + F.q + '"', function () { F.q = ''; if (els.search) els.search.value = ''; });

      els.activeChips.innerHTML = out.join('') + (out.length ? '<button class="stock-active-chip-clear" id="stockClearAll">Limpar tudo</button>' : '');
      els.activeChips.querySelectorAll('.stock-active-chip').forEach(function (b, i) {
        b.addEventListener('click', function () {
          fns[i](); D = cloneSide(F.side); syncControls(); apply();
        });
      });
      var clearAll = document.getElementById('stockClearAll');
      if (clearAll) clearAll.addEventListener('click', function () {
        F.side = blankSide(); F.q = ''; if (els.search) els.search.value = '';
        D = blankSide(); syncControls(); apply();
      });
    }

    function apply() {
      var list = sortList(DATA.filter(function (v) { return matches(v, F.q, F.side); }));
      grid.innerHTML = list.map(cardHTML).join('');
      els.count.textContent = list.length;
      if (els.empty) els.empty.classList.toggle('is-visible', list.length === 0);
      renderActiveChips();
      refreshApply();
    }

    if (els.search) els.search.addEventListener('input', function (e) { F.q = e.target.value; apply(); });
    if (els.sort) els.sort.addEventListener('change', function (e) { F.sort = e.target.value; apply(); });

    // ---- drawer mobile ----
    function closeDrawer() {
      if (els.layout) els.layout.classList.remove('filters-open');
      document.body.style.overflow = '';
    }
    if (els.filterToggle) els.filterToggle.addEventListener('click', function () {
      var open = els.layout.classList.toggle('filters-open');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    if (els.filterClose) els.filterClose.addEventListener('click', closeDrawer);
    if (els.backdrop) els.backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && els.layout && els.layout.classList.contains('filters-open')) closeDrawer();
    });

    syncControls();
    apply();
  }

  document.addEventListener('DOMContentLoaded', initEstoque);
})();
