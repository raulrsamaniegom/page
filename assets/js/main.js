/* Raúl Samaniego | interacciones del sitio
   Script clásico (sin módulos) para que funcione abriendo el HTML desde disco. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var portraitMQ = window.matchMedia('(max-aspect-ratio: 1/1)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Video del hero ---------- */
  var video = $('#heroVideo');
  var poster = $('#heroPoster');
  var ctl = $('#heroCtl');
  var userPaused = false;
  var heroVisible = true;

  function pickSource() {
    if (!video) return;
    var p = portraitMQ.matches;
    var src = p ? video.dataset.portrait : video.dataset.landscape;
    poster.src = p ? video.dataset.posterPortrait : video.dataset.posterLandscape;
    if (video.getAttribute('src') === src) return;
    video.classList.remove('is-ready');
    video.setAttribute('src', src);
    video.load();
    if (!reduce.matches && !userPaused) tryPlay();
  }

  function tryPlay() {
    var pr = video.play();
    if (pr && pr.catch) pr.catch(function () { setCtl(false); });
  }

  function setCtl(playing) {
    ctl.hidden = false;
    ctl.querySelector('span').textContent = playing ? 'Pausar video' : 'Reproducir video';
    ctl.querySelector('svg').innerHTML = playing
      ? '<rect x="2" y="1.5" width="2.6" height="9" fill="currentColor"/><rect x="7.4" y="1.5" width="2.6" height="9" fill="currentColor"/>'
      : '<path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/>';
  }

  if (video) {
    video.muted = true;
    video.addEventListener('playing', function () { video.classList.add('is-ready'); setCtl(true); });
    video.addEventListener('pause', function () { setCtl(false); });
    ctl.addEventListener('click', function () {
      if (video.paused) { userPaused = false; video.classList.add('is-ready'); tryPlay(); }
      else { userPaused = true; video.pause(); }
    });
    if (reduce.matches) { userPaused = true; setCtl(false); }
    pickSource();
    if (portraitMQ.addEventListener) portraitMQ.addEventListener('change', pickSource);
    else if (portraitMQ.addListener) portraitMQ.addListener(pickSource);

    // Ahorra batería: el video se detiene fuera de pantalla
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        heroVisible = es[0].isIntersecting;
        if (!heroVisible && !video.paused) video.pause();
        else if (heroVisible && !userPaused && video.paused) tryPlay();
      }, { threshold: 0.05 }).observe($('#portada'));
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && heroVisible && !userPaused) tryPlay();
    });
  }

  /* ---------- Barra superior y CTA flotante ---------- */
  var bar = $('#bar');
  var fab = $('#fab');
  var hero = $('#portada');
  var contacto = $('#contacto');
  var lamina = $('#lamina');
  var navLinks = $$('.nav a[href^="#"]');
  var isHome = !!hero;
  var sections = isHome ? [
    { el: hero, id: 'portada', name: 'Portada' },
    { el: $('#metodo'), id: 'metodo', name: 'Método' },
    { el: $('#servicios'), id: 'servicios', name: 'Servicios' },
    { el: $('#premios'), id: 'premios', name: 'Premios' },
    { el: contacto, id: 'contacto', name: 'Contacto' }
  ] : [];
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;
    if (isHome) bar.classList.toggle('is-solid', y > vh * 0.6);

    var cTop = contacto ? contacto.getBoundingClientRect().top : Infinity;
    var start = isHome ? hero.offsetHeight * 0.85 : vh * 0.9;
    if (fab) fab.classList.toggle('is-on', y > start && cTop > vh * 0.6);

    if (isHome) {
      var cur = 0;
      sections.forEach(function (s, i) { if (s.el && s.el.getBoundingClientRect().top < vh * 0.45) cur = i; });
      navLinks.forEach(function (a) {
        a.setAttribute('aria-current', a.getAttribute('href') === '#' + sections[cur].id ? 'true' : 'false');
      });
      if (lamina) lamina.textContent = '0' + (cur + 1) + ' de 0' + sections.length + ', ' + sections[cur].name;
    }

    if (triada) updateTriada();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Menú móvil ---------- */
  var sheet = $('#sheet');
  var menuBtn = $('.bar .menu-btn');
  function openSheet(open) {
    sheet.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('nav a', sheet).focus(); else menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener('click', function () { openSheet(true); });
  $$('[data-close]', sheet).forEach(function (el) {
    el.addEventListener('click', function () { openSheet(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) openSheet(false);
  });

  /* ---------- La tríada: el símbolo se despiece con el scroll ---------- */
  var triada = $('#triada');
  var fig = $('#triadaFig');
  var caps = $$('.triada__caps li', triada);
  var prog = $$('.triada__prog li', triada);
  var staticTriada = reduce.matches;

  if (triada && staticTriada) triada.classList.add('is-static');

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

  function updateTriada() {
    if (staticTriada) return;
    var r = triada.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;

    // 0–.12 armado · .12–.28 se despiece · .28–.82 un módulo a la vez · .82–1 se vuelve a armar
    var e = p < 0.12 ? 0 : p < 0.28 ? ease((p - 0.12) / 0.16) : p < 0.82 ? 1 : 1 - ease((p - 0.82) / 0.14);
    fig.style.setProperty('--e', e.toFixed(3));

    var step = 0;
    if (p >= 0.28 && p < 0.46) step = 1;
    else if (p >= 0.46 && p < 0.64) step = 2;
    else if (p >= 0.64) step = 3;
    triada.setAttribute('data-step', p >= 0.82 ? '0' : String(step));

    // leyendas: 0 entrada · 1 marca · 2 público · 3 diseño · 4 cierre
    var cap = p >= 0.86 ? 4 : step;
    caps.forEach(function (li, i) { li.classList.toggle('is-on', i === cap); });
    prog.forEach(function (li, i) { li.classList.toggle('is-on', i < step || p >= 0.82); });
  }

  triada && reduce.addEventListener && reduce.addEventListener('change', function () {
    staticTriada = reduce.matches;
    triada.classList.toggle('is-static', staticTriada);
    if (staticTriada) fig.style.removeProperty('--e');
    onScroll();
  });


  /* ---------- Fases: la ruta se traza al aparecer ---------- */
  var tramos = $$('.ruta > li');
  if (tramos.length) {
    if (reduce.matches || !('IntersectionObserver' in window)) tramos.forEach(function (li) { li.classList.add('is-in'); });
    else {
      var rio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var li = e.target, i = tramos.indexOf(li);
          setTimeout(function () { li.classList.add('is-in'); }, window.innerWidth >= 960 ? i * 180 : 0);
          rio.unobserve(li);
        });
      }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
      tramos.forEach(function (li) { rio.observe(li); });
    }
  }

  /* ---------- Premios: pista deslizable por año ---------- */
  var pista = $('#pista');
  if (pista) {
    var slides = $$('.premio', pista);
    var anios = $$('.anios__b');
    var flechas = $$('.flecha');
    var actual = -1;

    function paso() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : pista.clientWidth; }
    function irA(i, suave) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      pista.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: suave === false || reduce.matches ? 'auto' : 'smooth' });
    }
    function marcar() {
      var i = Math.round(pista.scrollLeft / paso());
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (i === actual) return;
      actual = i;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      anios.forEach(function (b, k) { b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      var b = anios[i];
      if (b && b.parentNode.scrollWidth > b.parentNode.clientWidth) {
        b.parentNode.scrollTo({ left: b.offsetLeft - 24, behavior: 'smooth' });
      }
      if (flechas.length) { flechas[0].disabled = i === 0; flechas[1].disabled = i === slides.length - 1; }
    }
    var pt = false;
    pista.addEventListener('scroll', function () {
      if (!pt) { pt = true; requestAnimationFrame(function () { pt = false; marcar(); }); }
    }, { passive: true });
    window.addEventListener('resize', function () { actual = -1; marcar(); });

    anios.forEach(function (b, k) {
      b.addEventListener('click', function () { irA(k); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = Math.max(0, Math.min(anios.length - 1, k + d));
        anios[n].focus(); irA(n);
      });
    });
    flechas.forEach(function (f) {
      f.addEventListener('click', function () { irA(actual + Number(f.dataset.dir)); });
    });

    // Telón: del render a la foto de la premiación
    $$('.premio__toggle', pista).forEach(function (btn) {
      var fig = btn.closest('.premio__fig');
      var noche = $('.premio__noche', fig);
      btn.addEventListener('click', function () {
        var on = fig.getAttribute('data-view') !== 'noche';
        fig.setAttribute('data-view', on ? 'noche' : 'render');
        btn.setAttribute('aria-pressed', String(on));
        btn.querySelector('span').textContent = on ? 'Ver el proyecto' : 'Ver la premiación';
        noche.setAttribute('aria-hidden', String(!on));
      });
    });

    marcar();
  }


  /* ---------- Servicios: vista previa que sigue al cursor ---------- */
  var flot = $('.sv-float');
  if (flot && window.matchMedia('(hover: hover) and (min-width: 60rem)').matches) {
    var fImg = $('img', flot), fx = 0, fy = 0, tx = 0, ty = 0, fOn = false, raf = 0;
    function mover() {
      fx += (tx - fx) * 0.18; fy += (ty - fy) * 0.18;
      flot.style.transform = 'translate3d(' + (fx - flot.offsetWidth / 2) + 'px,' + (fy - flot.offsetHeight / 2) + 'px,0) scale(' + (fOn ? 1 : .85) + ')';
      raf = (fOn || Math.abs(tx - fx) > .5) ? requestAnimationFrame(mover) : 0;
    }
    $$('.sv-row').forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        fImg.src = row.dataset.preview; fOn = true; flot.classList.add('is-on');
        tx = e.clientX + 200; ty = e.clientY;
        if (!raf) { fx = tx; fy = ty; raf = requestAnimationFrame(mover); }
      });
      row.addEventListener('mousemove', function (e) { tx = e.clientX + 200; ty = e.clientY; });
      row.addEventListener('mouseleave', function () { fOn = false; flot.classList.remove('is-on'); });
    });
  }

  /* ---------- El botón flotante se retira cuando estorbaría a un control ---------- */
  var estorbos = $$('.trazo, .vid');
  if (fab && estorbos.length && 'IntersectionObserver' in window) {
    var vivos = new Set();
    var fio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) vivos.add(e.target); else vivos.delete(e.target); });
      fab.classList.toggle('is-tapado', vivos.size > 0);
    }, { rootMargin: '0px 0px -8% 0px' });
    estorbos.forEach(function (el) { fio.observe(el); });
  }

  /* ---------- Del trazo a la obra ---------- */
  $$('.trazo').forEach(function (tz) {
    var btns = $$('.trazo__ctl button', tz);
    var linea = $('.trazo__linea', tz);
    var fig = $('.trazo__fig', tz);
    var paso = 0, tocado = false, timers = [];
    function ir(k, manual) {
      k = Math.max(0, Math.min(2, k));
      if (manual) { tocado = true; timers.forEach(clearTimeout); }
      if (k === paso) return;
      linea.classList.remove('is-run', 'is-back'); void linea.offsetWidth;
      if (!reduce.matches) linea.classList.add(k > paso ? 'is-run' : 'is-back');
      paso = k;
      tz.setAttribute('data-paso', String(k));
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === k)); });
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { ir(i, true); }); });
    // deslizar sobre la imagen
    var x0 = null, y0 = null;
    fig.addEventListener('pointerdown', function (e) { x0 = e.clientX; y0 = e.clientY; });
    fig.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) ir(paso + (dx < 0 ? 1 : -1), true);
      else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) ir(paso === 2 ? 0 : paso + 1, true);
    });
    fig.addEventListener('pointercancel', function () { x0 = null; });
    // la primera vez que se ve, recorre las tres etapas sola
    if ('IntersectionObserver' in window && !reduce.matches) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting || tocado) return;
        io.disconnect();
        timers.push(setTimeout(function () { if (!tocado) ir(1); }, 1100));
        timers.push(setTimeout(function () { if (!tocado) ir(2); }, 3200));
      }, { threshold: 0.6 });
      io.observe(fig);
    }
  });

  /* ---------- Recorrido: progreso al deslizar ---------- */
  var riel = $('.recorrido .riel');
  if (riel) {
    var pasos = $$('.paso', riel), nEl = $('.recorrido__n b'), barEl = $('.recorrido__bar i'), rt = false;
    function prog() {
      rt = false;
      var step = pasos.length > 1 ? pasos[1].offsetLeft - pasos[0].offsetLeft : 1;
      var i = Math.max(0, Math.min(pasos.length - 1, Math.round(riel.scrollLeft / step)));
      nEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      barEl.style.transform = 'scaleX(' + ((i + 1) / pasos.length) + ')';
    }
    riel.addEventListener('scroll', function () { if (!rt) { rt = true; requestAnimationFrame(prog); } }, { passive: true });
    riel.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return; e.preventDefault();
      riel.scrollBy({ left: d * pasos[0].offsetWidth, behavior: reduce.matches ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Videos: se reproducen en silencio solo cuando se ven ---------- */
  var vids = $$('.vid video');
  if (vids.length && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute('src')) { v.src = v.dataset.src; }
          if (!reduce.matches) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { v.muted = true; vio.observe(v); });
  }

  /* ---------- Visor a pantalla completa (igual en todos los servicios) ---------- */
  var lbItems = $$('[data-lb], [data-lb-video]');
  if (lbItems.length) {
    var FL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    var FR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    var lb = document.createElement('div');
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Visor de imágenes');
    lb.innerHTML = '<div class="lb__top"><span class="lb__count"></span><button type="button" class="lb__close">Cerrar</button></div>' +
      '<div class="lb__stage"><div class="lb__track"></div>' +
      '<button type="button" class="lb__arrow lb__arrow--prev" data-d="-1" aria-label="Anterior">' + FL + '</button>' +
      '<button type="button" class="lb__arrow lb__arrow--next" data-d="1" aria-label="Siguiente">' + FR + '</button></div>' +
      '<p class="lb__cap"></p><div class="lb__thumbs" role="group" aria-label="Miniaturas"></div>';
    document.body.appendChild(lb);
    var track = $('.lb__track', lb), cap = $('.lb__cap', lb), cnt = $('.lb__count', lb), closeB = $('.lb__close', lb), thumbs = $('.lb__thumbs', lb);
    var prevB = $('.lb__arrow--prev', lb), nextB = $('.lb__arrow--next', lb);
    var grupo = [], idx = 0, origen = null, lt = false;

    function slideHTML(el) {
      if (el.dataset.lbVideo) return '<div class="lb__slide"><video controls playsinline preload="none" poster="' + el.dataset.lbPoster + '" data-src="' + el.dataset.lbVideo + '"></video></div>';
      return '<div class="lb__slide"><img alt="" data-src="' + el.dataset.lb + '" width="' + el.dataset.lbW + '" height="' + el.dataset.lbH + '"></div>';
    }
    function thumbHTML(el, i) {
      var im = el.querySelector('img'), v = el.querySelector('video');
      var src = im ? (im.currentSrc || im.src) : (v ? v.getAttribute('poster') : '');
      return '<button type="button" class="lb__th" data-i="' + i + '" aria-label="Ver ' + (i + 1) + '"><img alt="" src="' + src + '"></button>';
    }
    function cargar(i) {
      [i - 1, i, i + 1].forEach(function (k) {
        var sl = track.children[k]; if (!sl) return;
        var m = sl.firstChild;
        if (m.dataset.src && !m.getAttribute('src')) m.src = m.dataset.src;
      });
    }
    function ir(i, suave) {
      i = Math.max(0, Math.min(grupo.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: suave === false || reduce.matches ? 'auto' : 'smooth' });
    }
    function marcarLb(forzar) {
      lt = false;
      if (!lb.classList.contains('is-open') || !track.children.length) return;
      var i = Math.max(0, Math.min(grupo.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
      if (!track.children[i]) return;
      if (i === idx && !forzar) return;
      $$('video', track).forEach(function (v, k) { if (k !== i && !v.paused) v.pause(); });
      idx = i;
      var t = grupo[idx].dataset.lbCap || '';
      cap.textContent = t;
      cnt.textContent = (idx + 1) + ' de ' + grupo.length;
      var img = track.children[idx].querySelector('img'); if (img) img.alt = t;
      prevB.disabled = idx === 0; nextB.disabled = idx === grupo.length - 1;
      $$('.lb__th', thumbs).forEach(function (b, k) {
        var on = k === idx; b.classList.toggle('is-on', on); b.setAttribute('aria-current', on ? 'true' : 'false');
        if (on) thumbs.scrollTo({ left: b.offsetLeft - thumbs.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
      });
      cargar(idx);
    }
    function abrir(el) {
      var g = el.closest('[data-lb-group]');
      grupo = g ? $$('[data-lb], [data-lb-video]', g) : [el];
      idx = grupo.indexOf(el); origen = el;
      track.innerHTML = grupo.map(slideHTML).join('');
      thumbs.innerHTML = grupo.length > 1 ? grupo.map(thumbHTML).join('') : '';
      lb.classList.toggle('is-single', grupo.length < 2);
      lb.classList.add('is-open'); document.body.style.overflow = 'hidden';
      // iOS solo permite sonido si play() ocurre dentro del mismo toque
      var v0 = track.children[idx].querySelector('video');
      if (v0) { v0.src = v0.dataset.src; var pr = v0.play(); if (pr && pr.catch) pr.catch(function () {}); }
      var destino = idx;
      requestAnimationFrame(function () { track.scrollLeft = destino * track.clientWidth; marcarLb(true); });
      closeB.focus();
    }
    function cerrar() {
      $$('video', track).forEach(function (v) { v.pause(); });
      lb.classList.remove('is-open'); document.body.style.overflow = '';
      setTimeout(function () { track.innerHTML = ''; thumbs.innerHTML = ''; }, 320);
      if (origen) origen.focus({ preventScroll: true });
    }
    lbItems.forEach(function (el) { el.addEventListener('click', function () { abrir(el); }); });
    closeB.addEventListener('click', cerrar);
    prevB.addEventListener('click', function () { ir(idx - 1); });
    nextB.addEventListener('click', function () { ir(idx + 1); });
    thumbs.addEventListener('click', function (e) { var b = e.target.closest('.lb__th'); if (b) ir(Number(b.dataset.i)); });
    track.addEventListener('scroll', function () { if (!lt) { lt = true; requestAnimationFrame(function () { marcarLb(); }); } }, { passive: true });
    window.addEventListener('resize', function () { if (lb.classList.contains('is-open')) track.scrollLeft = idx * track.clientWidth; });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') cerrar();
      else if (e.key === 'ArrowRight') { e.preventDefault(); ir(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(idx - 1); }
    });
  }

  /* ---------- Copiar correo ---------- */
  var toast = $('#toast');
  var toastT;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  $$('[data-mail]').forEach(function (copyBtn) { copyBtn.addEventListener('click', function () {
    var mail = copyBtn.dataset.mail;
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = mail; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      say(ok ? 'Correo copiado' : 'Mantén presionado el correo para copiarlo');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(mail).then(function () { say('Correo copiado'); }, fallback);
    } else fallback();
  }); });

  onScroll();
})();
