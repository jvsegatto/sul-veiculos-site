/*
 * Ficha de veículo dinâmica — /veiculo/:id (rewrite pra /veiculo/index.html,
 * ver vercel.json). Lê o id na URL, busca o carro em window.VEICULOS_DESTAQUE
 * (populado por js/veiculos-data.js a partir do Supabase) e monta a página.
 *
 * Os 2 veículos com ficha escrita à mão (golf, tcross) continuam nas próprias
 * páginas estáticas em veiculos/<slug>/ — esta página aqui é só pros veículos
 * que vêm do painel admin (têm path "/veiculo/<uuid>").
 */
(function () {
  'use strict';

  function getVehicleId() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('id')) return params.get('id');
    var segments = window.location.pathname.split('/').filter(Boolean);
    var last = segments[segments.length - 1];
    return (last && last !== 'veiculo' && last !== 'index.html') ? last : '';
  }

  var SPEC_ICONS = {
    ano: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>',
    km: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 15a8 8 0 1 1 16 0" /><path d="M12 15 16 10" /><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" /></svg>',
    categoria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12.59 2.59 20 10l-9 9-8-8V3h8z" /><circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" /></svg>',
    motor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>',
    cambio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9" /><circle cx="12" cy="3.5" r="1.8" /><path d="M6 21h12" /><path d="M9 21c0-5 1-7 3-7s3 2 3 7" /></svg>',
    combustivel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Z" /></svg>',
  };
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>';

  function tituloSemMarca(v) {
    if (v.marca && v.nome.indexOf(v.marca) === 0) return v.nome.slice(v.marca.length).trim();
    return v.nome;
  }

  function specPill(key, label, value) {
    if (!value) return '';
    return (
      '<div class="spec-pill">' +
        '<span class="spec-pill-head">' + (SPEC_ICONS[key] || '') + '<span>' + label + '</span></span>' +
        '<strong>' + value + '</strong>' +
      '</div>'
    );
  }

  function renderNotFound() {
    document.querySelectorAll('[data-vehicle-root]').forEach(function (el) { el.hidden = true; });
    var nf = document.querySelector('[data-vehicle-notfound]');
    if (nf) nf.hidden = false;
  }

  function renderFeatures(v) {
    var section = document.getElementById('featuresSection');
    var grid = document.getElementById('featuresGrid');
    if (!v.optionals || !v.optionals.length) {
      if (section) section.hidden = true;
      return;
    }
    grid.innerHTML = v.optionals.map(function (opt) {
      return '<div class="feature-item">' + CHECK_SVG + '<span>' + opt + '</span></div>';
    }).join('');
  }

  function renderSimilar(v) {
    var section = document.getElementById('similarSection');
    var wrap = document.getElementById('similarVehicles');
    var outros = (window.VEICULOS_DESTAQUE || []).filter(function (o) { return o.id !== v.id; });
    var mesmaCategoria = outros.filter(function (o) { return o.categoria === v.categoria; });
    var similares = (mesmaCategoria.length ? mesmaCategoria : outros).slice(0, 3);
    if (!similares.length) { section.hidden = true; return; }

    var fmt = window.SitePageInit || {};
    var brl = fmt.formatBRL || function (n) { return 'R$ ' + n.toLocaleString('pt-BR'); };
    var km = fmt.formatKM || function (n) { return n.toLocaleString('pt-BR') + ' km'; };

    wrap.innerHTML = similares.map(function (o) {
      var specs = (o.ano ? '<span>' + o.ano + '</span>' : '') + '<span>' + km(o.km) + '</span>';
      return (
        '<article class="vehicle-card">' +
          '<a class="vehicle-media" href="' + o.path + '">' +
            '<img src="' + o.foto + '" alt="' + o.nome + '" loading="lazy" />' +
          '</a>' +
          '<div class="vehicle-card-body">' +
            '<div class="vehicle-card-heading">' +
              '<div class="vehicle-eyebrow">' + o.marca + ' · ' + o.categoria + '</div>' +
              '<a class="vehicle-card-title" href="' + o.path + '"><h3>' + tituloSemMarca(o) + '</h3></a>' +
            '</div>' +
            '<div class="vehicle-specs">' + specs + '</div>' +
            '<div class="vehicle-price">' + brl(o.preco) + '</div>' +
            '<div class="vehicle-card-actions">' +
              '<a class="btn btn-primary btn-block" href="' + o.path + '">Ver detalhes</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  function renderVehicle(v) {
    document.querySelectorAll('[data-vehicle-root]').forEach(function (el) { el.hidden = false; });

    var tituloCompleto = (v.marca ? v.marca + ' ' : '') + tituloSemMarca(v);
    document.title = tituloCompleto + ' | Sul Veículos';
    var descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', tituloCompleto + ', ' + (v.ano || '') + ', ' + v.km.toLocaleString('pt-BR') + ' km. Confira na Sul Veículos, Primavera do Leste, MT.');

    var marcaEl = document.querySelector('[data-vehicle-marca]');
    if (marcaEl) marcaEl.textContent = v.marca;
    var nomeEl = document.querySelector('[data-vehicle-nome]');
    if (nomeEl) nomeEl.textContent = tituloSemMarca(v);
    var precoEl = document.querySelector('[data-vehicle-preco]');
    if (precoEl) precoEl.textContent = 'R$ ' + v.preco.toLocaleString('pt-BR');

    document.getElementById('specGrid').innerHTML =
      specPill('ano', 'Ano', v.ano) +
      specPill('km', 'Km', v.km ? v.km.toLocaleString('pt-BR') + ' km' : '') +
      specPill('categoria', 'Categoria', v.categoria) +
      specPill('motor', 'Motor', v.motor) +
      specPill('cambio', 'Transmissão', v.cambio) +
      specPill('combustivel', 'Combustível', v.combustivel);

    var message = 'Olá! Tenho interesse no ' + tituloCompleto + ' (R$ ' + v.preco.toLocaleString('pt-BR') + ') que vi no site da Sul Veículos. Ainda está disponível?';
    var waUrl = 'https://wa.me/5566992123356?text=' + encodeURIComponent(message);
    var waCta = document.getElementById('whatsappCta');
    if (waCta) waCta.href = waUrl;
    var waFloat = document.getElementById('whatsappFloat');
    if (waFloat) waFloat.href = waUrl;

    var financeModal = document.getElementById('financeSim');
    if (financeModal) financeModal.setAttribute('data-vehicle-label', tituloCompleto + ' (R$ ' + v.preco.toLocaleString('pt-BR') + ')');

    var fotos = (v.fotos && v.fotos.length) ? v.fotos : (v.foto ? [v.foto] : []);
    var main = document.getElementById('galleryMain');
    if (main && fotos.length) {
      main.src = fotos[0];
      main.alt = tituloCompleto;
    }
    document.getElementById('galleryThumbs').innerHTML = fotos.map(function (src, i) {
      return (
        '<button class="vehicle-gallery-thumb' + (i === 0 ? ' is-active' : '') + '" data-full="' + src + '" data-alt="' + tituloCompleto + '">' +
          '<img src="' + src + '" alt="" loading="lazy" />' +
        '</button>'
      );
    }).join('');

    renderFeatures(v);
    renderSimilar(v);

    var init = window.SitePageInit || {};
    if (init.initVehicleGallery) init.initVehicleGallery();
    if (init.initFeatureChips) init.initFeatureChips();
    if (init.initFinanceSim) init.initFinanceSim();
  }

  function initVehiclePage() {
    if (typeof window.VEICULOS_READY === 'undefined') return;

    window.VEICULOS_READY.then(function (veiculos) {
      var id = getVehicleId();
      var v = (veiculos || []).filter(function (item) { return item.id === id; })[0];
      if (!v) { renderNotFound(); return; }
      renderVehicle(v);
    });
  }

  document.addEventListener('DOMContentLoaded', initVehiclePage);
})();
