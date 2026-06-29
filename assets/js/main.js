/* ÁUREA — comportamento geral: header, menu, reveals, contadores,
   personalização por link e links de WhatsApp. */
(function(){
  "use strict";

  // Safety net: if the 3D module never ran (old browser w/o import maps, or a module error),
  // reveal the static fallback so the hero is never a blank dark rectangle.
  setTimeout(function () {
    var hero = document.getElementById('topo');
    if (hero && !hero.classList.contains('is-lit') && !document.querySelector('#hero3d canvas')) {
      hero.classList.add('is-lit');
    }
  }, 1200);

  /* Header condensa ao rolar */
  var cab = document.getElementById('cab');
  function onScroll(){ if(cab) cab.classList.toggle('cab--solid', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});

  /* Menu mobile */
  var nav = document.getElementById('nav');
  var tg  = document.getElementById('navToggle');
  if(nav && tg){
    tg.addEventListener('click', function(){
      var open = nav.classList.toggle('is-open');
      tg.setAttribute('aria-expanded', open ? 'true' : 'false');
      tg.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    nav.addEventListener('click', function(e){
      if(e.target.closest('a')){ nav.classList.remove('is-open'); tg.setAttribute('aria-expanded','false'); }
    });
  }

  /* Reveals on-scroll */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, {threshold:.16}) : null;
  document.querySelectorAll('.reveal').forEach(function(el){ io ? io.observe(el) : el.classList.add('is-in'); });

  /* Contadores */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suf = el.getAttribute('data-suffix') || '';
    var dur = 1500, t0 = null;
    function step(t){
      if(!t0) t0 = t;
      var k = Math.min((t-t0)/dur, 1), e = 1 - Math.pow(1-k, 3);
      el.textContent = Math.round(target*e).toLocaleString('pt-BR') + suf;
      if(k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var confianca = document.querySelector('.confianca');
  if(confianca){
    var counted = false;
    var doCount = function(){ if(counted) return; counted = true; document.querySelectorAll('[data-count]').forEach(animateCount); };
    if('IntersectionObserver' in window){
      var cio = new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting) doCount(); }); }, {threshold:.3});
      cio.observe(confianca);
    } else { doCount(); }
  }

  /* Personalização por link  ?nome= &cidade= &whats=  + WhatsApp */
  function clean(s){ return (s || '').replace(/[<>]/g,'').trim().slice(0,80); }
  var q = new URLSearchParams(location.search);
  var nome   = clean(q.get('nome'));
  var cidade = clean(q.get('cidade'));
  var whats  = (q.get('whats') || '').replace(/\D/g,'').slice(0,15);

  var WHATS = whats || '5592999999999';
  var NOME  = nome  || 'Áurea';

  if(nome){
    document.querySelectorAll('[data-brand]').forEach(function(el){ el.textContent = NOME; });
    document.title = NOME + ' — Harmonização Facial & Estética Avançada';
  }
  if(cidade){
    document.querySelectorAll('[data-cidade]').forEach(function(el){ el.textContent = cidade; });
  }

  var msg = encodeURIComponent('Olá! Vim pelo site da ' + NOME + ' e gostaria de agendar uma avaliação.');
  var href = 'https://wa.me/' + WHATS + '?text=' + msg;
  document.querySelectorAll('[data-wa]').forEach(function(el){
    el.setAttribute('href', href);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  /* Instagram  ?ig=  */
  var ig = clean(q.get('ig')).replace(/[^a-zA-Z0-9._]/g,'').slice(0,30);
  var IG = ig || 'aurea.estetica';
  var igHref = 'https://instagram.com/' + IG;
  document.querySelectorAll('[data-ig]').forEach(function(el){
    el.setAttribute('href', igHref);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
    if(el.classList.contains('insta__handle')) el.textContent = '@' + IG;
  });

  /* Parallax sutil do hero (texto) — respeita prefers-reduced-motion */
  var heroInner = document.querySelector('.hero__inner');
  var reduceMo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(heroInner && !reduceMo){
    window.addEventListener('scroll', function(){
      var y = window.scrollY;
      if(y <= window.innerHeight){
        heroInner.style.transform = 'translateY(' + (y*0.22).toFixed(1) + 'px)';
        heroInner.style.opacity   = Math.max(0, 1 - y/(window.innerHeight*0.72)).toFixed(2);
      }
    }, {passive:true});
  }
})();
