(function () {
  'use strict';

  function formatBRL(value) {
    return 'R$ ' + value.toLocaleString('pt-BR');
  }

  function formatKM(value) {
    return value.toLocaleString('pt-BR') + ' km';
  }

  function tituloSemMarca(v) {
    if (v.marca && v.nome.indexOf(v.marca) === 0) return v.nome.slice(v.marca.length).trim();
    return v.nome;
  }

  // ---------- Cards de veículos ----------
  function renderVeiculos() {
    var grid = document.getElementById('vehicle-grid');
    if (!grid || typeof VEICULOS_DESTAQUE === 'undefined') return;

    var html = VEICULOS_DESTAQUE.map(function (v) {
      var href = 'veiculos/' + v.slug + '/';
      var specs = (v.ano ? '<span>' + v.ano + '</span>' : '') +
        '<span>' + formatKM(v.km) + '</span>';
      var pos = v.fotoPos ? ' style="object-position:' + v.fotoPos + '"' : '';
      return (
        '<article class="vehicle-card reveal">' +
          '<a class="vehicle-media" href="' + href + '">' +
            '<img src="' + v.foto + '" alt="' + v.nome + '" loading="lazy"' + pos + ' />' +
          '</a>' +
          '<div class="vehicle-card-body">' +
            '<div class="vehicle-card-heading">' +
              '<div class="vehicle-eyebrow">' + v.marca + ' · ' + v.categoria + '</div>' +
              '<a class="vehicle-card-title" href="' + href + '"><h3>' + tituloSemMarca(v) + '</h3></a>' +
            '</div>' +
            '<div class="vehicle-specs">' + specs + '</div>' +
            '<div class="vehicle-price">' + formatBRL(v.preco) + '</div>' +
            '<div class="vehicle-card-actions">' +
              '<a class="btn btn-primary btn-block" href="' + href + '">Ver detalhes</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');

    grid.innerHTML = html;
  }

  // ---------- Destaques: carrossel no mobile (setas + bolinhas) ----------
  function initVehicleCarousel() {
    var grid = document.getElementById('vehicle-grid');
    var dots = document.getElementById('vehicleCarouselDots');
    var prevBtn = document.getElementById('vehicleCarouselPrev');
    var nextBtn = document.getElementById('vehicleCarouselNext');
    if (!grid || !dots || typeof VEICULOS_DESTAQUE === 'undefined') return;

    var count = VEICULOS_DESTAQUE.length;
    if (!count) return;

    dots.innerHTML = VEICULOS_DESTAQUE.map(function (_, i) {
      return '<button type="button" class="carousel-dot' + (i === 0 ? ' is-active' : '') + '" data-index="' + i + '" aria-label="Ir para o veículo ' + (i + 1) + '"></button>';
    }).join('');
    var dotEls = Array.prototype.slice.call(dots.querySelectorAll('.carousel-dot'));

    function setActive(index) {
      dotEls.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }

    function goTo(index) {
      index = Math.max(0, Math.min(count - 1, index));
      var card = grid.children[index];
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    function currentIndex() {
      var cards = Array.prototype.slice.call(grid.children);
      var scrollLeft = grid.scrollLeft;
      var closest = 0, closestDist = Infinity;
      cards.forEach(function (card, i) {
        var dist = Math.abs(card.offsetLeft - scrollLeft);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    var scrollTicking = false;
    grid.addEventListener('scroll', function () {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        setActive(currentIndex());
        scrollTicking = false;
      });
    }, { passive: true });

    dotEls.forEach(function (d) {
      d.addEventListener('click', function () { goTo(Number(d.getAttribute('data-index'))); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(currentIndex() - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(currentIndex() + 1); });
  }

  // ---------- Galeria da página de veículo (miniaturas + lightbox compartilham a navegação) ----------
  function initVehicleGallery() {
    var main = document.getElementById('galleryMain');
    var thumbs = Array.prototype.slice.call(document.querySelectorAll('.vehicle-gallery-thumb'));
    var prevBtn = document.getElementById('galleryPrev');
    var nextBtn = document.getElementById('galleryNext');
    var counter = document.getElementById('galleryCounter');
    var expandBtn = document.getElementById('galleryExpand');
    var lightbox = document.getElementById('vehicleLightbox');
    var lightboxImg = document.getElementById('vehicleLightboxImg');
    var lightboxClose = document.getElementById('vehicleLightboxClose');
    var lightboxPrev = document.getElementById('lightboxPrev');
    var lightboxNext = document.getElementById('lightboxNext');
    if (!main || !thumbs.length) return;

    var current = thumbs.findIndex(function (b) { return b.classList.contains('is-active'); });
    if (current < 0) current = 0;

    function activate(index) {
      current = (index + thumbs.length) % thumbs.length;
      var btn = thumbs[current];
      var full = btn.getAttribute('data-full');
      var alt = btn.getAttribute('data-alt');
      var pos = btn.getAttribute('data-position');
      main.src = full;
      if (alt) main.alt = alt;
      main.style.objectPosition = pos || 'center center';
      thumbs.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      if (counter) counter.textContent = (current + 1) + ' / ' + thumbs.length;
      if (lightboxImg && lightbox && lightbox.classList.contains('is-open')) {
        lightboxImg.src = full;
        lightboxImg.alt = alt || '';
      }
    }

    thumbs.forEach(function (btn, i) {
      btn.addEventListener('click', function () { activate(i); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { activate(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { activate(current + 1); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', function () { activate(current - 1); });
    if (lightboxNext) lightboxNext.addEventListener('click', function () { activate(current + 1); });

    if (counter) counter.textContent = (current + 1) + ' / ' + thumbs.length;

    if (lightbox && lightboxImg && lightboxClose) {
      var openLightbox = function () {
        lightboxImg.src = main.currentSrc || main.src;
        lightboxImg.alt = main.alt || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
      };
      var closeLightbox = function () {
        lightbox.classList.remove('is-open');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('lightbox-open');
      };

      main.addEventListener('click', openLightbox);
      if (expandBtn) expandBtn.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(); });
      lightboxClose.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
      document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowRight') activate(current + 1);
        else if (e.key === 'ArrowLeft') activate(current - 1);
      });
    }
  }

  // ---------- Equipamentos e opcionais (chips com "ver todos") ----------
  function initFeatureChips() {
    var grid = document.getElementById('featuresGrid');
    var count = document.getElementById('featuresCount');
    if (!grid || !count) return;
    var total = grid.children.length;
    count.textContent = total + (total === 1 ? ' item' : ' itens');
  }

  // ---------- Carros similares (mesma categoria do veículo atual) ----------
  function initSimilarVehicles() {
    var section = document.getElementById('similarSection');
    var wrap = document.getElementById('similarVehicles');
    if (!section || !wrap || typeof VEICULOS_DESTAQUE === 'undefined') return;

    var slug = document.body.getAttribute('data-vehicle-slug');
    var atual = VEICULOS_DESTAQUE.filter(function (v) { return v.slug === slug; })[0];
    if (!atual) { section.remove(); return; }

    // Prioriza a mesma categoria; se não houver nenhuma (estoque ainda pequeno
    // ou pouco variado), cai pra "outros veículos" em vez de sumir a seção.
    var outros = VEICULOS_DESTAQUE.filter(function (v) { return v.slug !== slug; });
    var mesmaCategoria = outros.filter(function (v) { return v.categoria === atual.categoria; });
    var similares = (mesmaCategoria.length ? mesmaCategoria : outros).slice(0, 3);
    if (!similares.length) { section.remove(); return; }

    wrap.innerHTML = similares.map(function (v) {
      var href = '../' + v.slug + '/';
      var specs = (v.ano ? '<span>' + v.ano + '</span>' : '') +
        '<span>' + formatKM(v.km) + '</span>';
      var pos = v.fotoPos ? ' style="object-position:' + v.fotoPos + '"' : '';
      return (
        '<article class="vehicle-card">' +
          '<a class="vehicle-media" href="' + href + '">' +
            '<img src="../../' + v.foto + '" alt="' + v.nome + '" loading="lazy"' + pos + ' />' +
          '</a>' +
          '<div class="vehicle-card-body">' +
            '<div class="vehicle-card-heading">' +
              '<div class="vehicle-eyebrow">' + v.marca + ' · ' + v.categoria + '</div>' +
              '<a class="vehicle-card-title" href="' + href + '"><h3>' + tituloSemMarca(v) + '</h3></a>' +
            '</div>' +
            '<div class="vehicle-specs">' + specs + '</div>' +
            '<div class="vehicle-price">' + formatBRL(v.preco) + '</div>' +
            '<div class="vehicle-card-actions">' +
              '<a class="btn btn-primary btn-block" href="' + href + '">Ver detalhes</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  // ---------- Simulador de financiamento ----------
  function initFinanceSim() {
    var modal = document.getElementById('financeSim');
    var heroBtn = document.getElementById('financeSimBtn');
    var closeBtn = document.getElementById('financeModalClose');
    var backdrop = document.getElementById('financeModalBackdrop');
    var form = document.getElementById('financeSimForm');
    if (!modal || !form) return;

    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
    }
    if (heroBtn) heroBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    modal.querySelectorAll('.finance-toggle').forEach(function (group) {
      group.querySelectorAll('.finance-toggle-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('.finance-toggle-btn').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          if (group.getAttribute('data-toggle') === 'doc') updateDocField();
        });
      });
    });
    modal.querySelectorAll('.finance-chips').forEach(function (group) {
      group.querySelectorAll('.finance-chip').forEach(function (btn) {
        btn.addEventListener('click', function () {
          group.querySelectorAll('.finance-chip').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
        });
      });
    });

    function activeValue(selector, fallback) {
      var btn = modal.querySelector(selector + ' .is-active');
      return btn ? btn.getAttribute('data-value') : fallback;
    }

    var docLabel = document.getElementById('fsDocLabel');
    var docInput = document.getElementById('fsDocumento');
    function updateDocField() {
      var tipo = activeValue('[data-toggle="doc"]', 'CPF');
      if (docLabel) docLabel.textContent = tipo;
      if (docInput) {
        docInput.value = '';
        docInput.placeholder = tipo === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00';
      }
    }

    function digitsOnly(v) { return v.replace(/\D/g, ''); }
    function maskCurrency(el) {
      el.addEventListener('input', function () {
        var d = digitsOnly(el.value);
        el.value = d ? Number(d).toLocaleString('pt-BR') : '';
      });
    }
    function maskPhone(el) {
      el.addEventListener('input', function () {
        var d = digitsOnly(el.value).slice(0, 11);
        var out = d;
        if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
        if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
        el.value = out;
      });
    }
    function maskDate(el) {
      el.addEventListener('input', function () {
        var d = digitsOnly(el.value).slice(0, 8);
        var out = d;
        if (d.length > 2) out = d.slice(0, 2) + '/' + d.slice(2);
        if (d.length > 4) out = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
        el.value = out;
      });
    }
    function maskDoc(el) {
      el.addEventListener('input', function () {
        var tipo = activeValue('[data-toggle="doc"]', 'CPF');
        var d = digitsOnly(el.value);
        var out;
        if (tipo === 'CNPJ') {
          d = d.slice(0, 14);
          out = d.slice(0, 2);
          if (d.length > 2) out += '.' + d.slice(2, 5);
          if (d.length > 5) out += '.' + d.slice(5, 8);
          if (d.length > 8) out += '/' + d.slice(8, 12);
          if (d.length > 12) out += '-' + d.slice(12, 14);
        } else {
          d = d.slice(0, 11);
          out = d.slice(0, 3);
          if (d.length > 3) out += '.' + d.slice(3, 6);
          if (d.length > 6) out += '.' + d.slice(6, 9);
          if (d.length > 9) out += '-' + d.slice(9, 11);
        }
        el.value = out;
      });
    }

    var fsEntrada = document.getElementById('fsEntrada');
    var fsParcela = document.getElementById('fsParcela');
    var fsTelefone = document.getElementById('fsTelefone');
    var fsNascimento = document.getElementById('fsNascimento');
    if (fsEntrada) maskCurrency(fsEntrada);
    if (fsParcela) maskCurrency(fsParcela);
    if (fsTelefone) maskPhone(fsTelefone);
    if (fsNascimento) maskDate(fsNascimento);
    if (docInput) maskDoc(docInput);

    updateDocField();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var nome = document.getElementById('fsNome').value.trim();
      var telefone = fsTelefone ? fsTelefone.value.trim() : '';
      var entrada = fsEntrada ? fsEntrada.value.trim() : '';
      var parcelaValor = fsParcela ? fsParcela.value.trim() : '';
      var nascimento = fsNascimento ? fsNascimento.value.trim() : '';
      var cnh = activeValue('[data-toggle="cnh"]', 'Sim');
      var parcelas = activeValue('[data-toggle="parcelas"]', '12x');
      var tipoDoc = activeValue('[data-toggle="doc"]', 'CPF');
      var documento = docInput ? docInput.value.trim() : '';
      var veiculo = modal.getAttribute('data-vehicle-label') || '';
      var numero = modal.getAttribute('data-wa-number') || '';

      var linhas = [
        'Olá! Gostaria de simular um financiamento para o ' + veiculo + '.',
        '',
        'Entrada: ' + (entrada ? 'R$ ' + entrada : 'Não informado'),
        'Possui CNH: ' + cnh,
        'Parcelas desejadas: ' + parcelas,
        'Valor da parcela desejada: ' + (parcelaValor ? 'R$ ' + parcelaValor : 'Não informado'),
        'Nome: ' + nome,
        'Telefone: ' + telefone,
        'Data de nascimento: ' + (nascimento || 'Não informado'),
        tipoDoc + ': ' + (documento || 'Não informado')
      ];

      var url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(linhas.join('\n'));
      window.open(url, '_blank', 'noopener');
      closeModal();
    });
  }

  // ---------- Galeria "Nossa história": fotos se separando ao rolar (mobile) ----------
  function initGalleryStack() {
    if (!window.matchMedia('(max-width: 640px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var pin = document.getElementById('showcaseGalleryPin');
    var gallery = document.querySelector('.showcase-gallery');
    var photos = Array.prototype.slice.call(document.querySelectorAll('.showcase-gallery .gallery-photo'));
    var arrows = Array.prototype.slice.call(document.querySelectorAll('.showcase-gallery .gallery-arrow'));
    if (!pin || !gallery || photos.length < 2) return;

    var EXTRA = 420; // distância extra de scroll travado até soltar a página

    // Medidas naturais (sem transform) cacheadas à parte — ler
    // getBoundingClientRect() de um elemento já transformado a cada frame
    // realimenta o próprio cálculo e causa tremedeira.
    var metrics = [];
    function measure() {
      photos.forEach(function (photo) { photo.style.transform = 'none'; });
      var cumulative = 0;
      metrics = photos.map(function (photo) {
        var rect = photo.getBoundingClientRect();
        var m = { stackOffset: cumulative };
        cumulative += rect.height + 24;
        return m;
      });
      pin.style.height = (gallery.getBoundingClientRect().height + EXTRA) + 'px';
    }

    var ticking = false;

    function update() {
      ticking = false;
      var rect = pin.getBoundingClientRect();
      var scrolled = -rect.top;
      var progress = clamp(scrolled / EXTRA, 0, 1);

      // Cada foto se solta em sua própria fatia do progresso, em sequência.
      var p1 = clamp(progress / 0.55, 0, 1);
      var p2 = clamp((progress - 0.45) / 0.55, 0, 1);
      var progresses = [1, p1, p2];

      photos.forEach(function (photo, i) {
        if (i === 0) return;
        var pr = progresses[i];
        var offset = -metrics[i].stackOffset * (1 - pr);
        var rotate = (i % 2 === 0 ? 1 : -1) * 5 * (1 - pr);

        photo.style.transform = 'translateY(' + offset + 'px) rotate(' + rotate + 'deg)';
        photo.style.zIndex = String(10 + i);

        // A seta só faz sentido depois que a foto que ela aponta já
        // assentou no lugar — tentar seguir a foto com o mesmo offset
        // ficava fora de sincronia, já que a posição base da seta no
        // grid não se move junto com o transform da foto.
        var arrow = arrows[i - 1];
        if (arrow) {
          arrow.style.opacity = String(pr);
          arrow.style.transform = 'scale(' + (0.6 + 0.4 * pr) + ')';
        }
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function onResize() {
      measure();
      update();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    measure();
    update();
  }

  // ---------- Lightbox da galeria "Nossa história" ----------
  function initHistoryLightbox() {
    var lightbox = document.getElementById('historyLightbox');
    var lightboxImg = document.getElementById('historyLightboxImg');
    var closeBtn = document.getElementById('historyLightboxClose');
    var photos = document.querySelectorAll('.gallery-photo');
    if (!lightbox || !lightboxImg || !photos.length) return;

    function open(img) {
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }

    function close() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
    }

    photos.forEach(function (photo) {
      var img = photo.querySelector('img');
      if (!img) return;
      photo.addEventListener('click', function () { open(img); });
      photo.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(img);
        }
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  // ---------- Header sticky ----------
  function initHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Menu mobile ----------
  function initMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('mobile-nav');
    var backdrop = document.getElementById('mobile-nav-backdrop');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (backdrop) backdrop.classList.remove('is-open');
    }

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (backdrop) backdrop.classList.toggle('is-open', open);
    });

    if (backdrop) backdrop.addEventListener('click', close);

    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
  }

  // ---------- Reveal on scroll ----------
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { observer.observe(el); });

    // Rede de segurança: garante que o conteúdo nunca fique preso em opacity:0
    // caso o IntersectionObserver não dispare (webviews/navegadores atípicos).
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2500);
  }

  // ---------- Contadores da hero ----------
  function initCounters() {
    var stats = document.querySelectorAll('.stat-value[data-count-to]');
    if (!stats.length) return;

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duration = 1400;
    var stagger = 150;

    stats.forEach(function (el, index) {
      var target = parseInt(el.getAttribute('data-count-to'), 10);
      if (prefersReduced) {
        el.textContent = target.toLocaleString('pt-BR');
        return;
      }
      var delay = 500 + index * stagger;
      var start = null;
      function tick(timestamp) {
        if (start === null) start = timestamp;
        var elapsed = timestamp - start - delay;
        if (elapsed < 0) { requestAnimationFrame(tick); return; }
        var t = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString('pt-BR');
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ---------- Ano no rodapé ----------
  function initFooterYear() {
    var el = document.getElementById('ano-atual');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ---------- Trajetória em fotos (Sobre) ----------
  // Imagem sticky que revela via clip-path enquanto rola, com fotos
  // antigas passando em parallax por cima.
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function initHeroScroll() {
    var section = document.querySelector('[data-hero-scroll]');
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var image = section.querySelector('[data-hero-scroll-image]');
    var yearTag = section.querySelector('[data-hero-scroll-year]');
    var imagesEl = section.querySelector('.hero-scroll-images');
    var parallaxItems = Array.prototype.slice.call(section.querySelectorAll('[data-parallax]')).map(function (el) {
      return { el: el, start: Number(el.dataset.start), end: Number(el.dataset.end) };
    });

    function sectionHeight() {
      return parseFloat(getComputedStyle(section).getPropertyValue('--hero-scroll-h')) || 1400;
    }

    // A altura da seção precisa acompanhar a altura real das fotos em
    // parallax — um valor fixo desalinha em telas mais largas/estreitas.
    // Reserva também um respiro do tamanho da última foto: o fade dela só
    // termina depois que ela rola a própria altura pra fora da tela.
    function syncSectionHeight() {
      if (!imagesEl) return;
      var lastItem = parallaxItems[parallaxItems.length - 1];
      var fadeBuffer = lastItem ? lastItem.el.getBoundingClientRect().height : 0;
      section.style.setProperty('--hero-scroll-h', (imagesEl.getBoundingClientRect().height + fadeBuffer) + 'px');
    }

    var ticking = false;

    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var scrolled = -rect.top;
      var h = sectionHeight();

      var revealProgress = clamp(scrolled / h, 0, 1);
      var clip1 = 10 - revealProgress * 10;
      var clip2 = 90 + revealProgress * 10;
      var isMobile = window.matchMedia('(max-width: 640px)').matches;
      var clipX1 = isMobile ? 0 : clip1;
      var clipX2 = isMobile ? 100 : clip2;

      if (image) {
        image.style.clipPath = 'polygon(' + clipX1 + '% ' + clip1 + '%, ' + clipX2 + '% ' + clip1 + '%, ' + clipX2 + '% ' + clip2 + '%, ' + clipX1 + '% ' + clip2 + '%)';
        image.style.backgroundSize = (170 - revealProgress * 70) + '%';

        var fadeProgress = clamp((scrolled - h) / 400, 0, 1);
        image.style.opacity = String(1 - fadeProgress);

        if (yearTag) {
          yearTag.style.top = 'calc(' + clip1 + '% + 12px)';
          yearTag.style.right = 'calc(' + clipX1 + '% + 12px)';
          yearTag.style.opacity = String(1 - fadeProgress);
        }
      }

      var vh = window.innerHeight;
      parallaxItems.forEach(function (item) {
        var itemRect = item.el.getBoundingClientRect();
        var enterProgress = clamp((vh - itemRect.top) / vh, 0, 1);
        var y = item.start + (item.end - item.start) * enterProgress;

        var opacity = 1;
        var scale = 1;
        if (itemRect.top < 0) {
          var leaveProgress = clamp(-itemRect.top / itemRect.height, 0, 1);
          opacity = 1 - leaveProgress;
          scale = 1 - leaveProgress * 0.15;
        }

        item.el.style.transform = 'translateY(' + y + 'px) scale(' + scale + ')';
        item.el.style.opacity = String(opacity);
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function onResize() {
      syncSectionHeight();
      onScroll();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    syncSectionHeight();
    update();
  }

  // ---------- Linha do tempo: trilho com gradiente animado ao rolar ----------
  function initTimelineTrack() {
    var section = document.getElementById('linha-do-tempo');
    var list = document.querySelector('.timeline-list');
    var fill = document.getElementById('timelineTrackFill');
    var dots = document.querySelectorAll('.timeline-dot');
    if (!section || !list || !fill) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var listHeight = list.offsetHeight;
    var ticking = false;

    // Progresso medido na seção inteira (título + itens), igual ao
    // containerRef do componente original; a barra em si só cresce até a
    // altura da lista de itens (ref), não da seção toda.
    function update() {
      ticking = false;
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var startY = vh * 0.1;
      var endY = vh * 0.5;
      var denom = rect.height - (endY - startY);
      var progress = denom > 0 ? (startY - rect.top) / denom : (rect.top <= startY ? 1 : 0);
      progress = clamp(progress, 0, 1);

      fill.style.height = (progress * listHeight) + 'px';
      fill.style.opacity = String(clamp(progress / 0.1, 0, 1));

      dots.forEach(function (dot) {
        var dotTop = dot.getBoundingClientRect().top;
        dot.classList.toggle('is-active', dotTop < endY);
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function onResize() {
      listHeight = list.offsetHeight;
      onScroll();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderVeiculos();
    initVehicleCarousel();
    initHeader();
    initMobileNav();
    initReveal();
    initCounters();
    initFooterYear();
    initVehicleGallery();
    initFeatureChips();
    initSimilarVehicles();
    initFinanceSim();
    initHistoryLightbox();
    initGalleryStack();
    initHeroScroll();
    initTimelineTrack();
  });
})();
