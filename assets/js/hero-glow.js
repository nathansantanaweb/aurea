/* ÁUREA — glow do hero (Canvas 2D): bloom dourado + bokeh.
   "Opaco -> glow" no load; respeita prefers-reduced-motion. */
(function(){
  var canvas = document.querySelector('.hero__glow');
  var hero   = document.querySelector('.hero');
  if(!canvas || !hero || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var w=0, h=0, dpr=1, parts=[], raf=null, start=0;
  var focal = {x:.62, y:.44};

  function rand(a,b){ return a + Math.random()*(b-a); }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr);
    canvas.style.width = w+'px'; canvas.style.height = h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function seed(){
    var n = reduce ? 0 : Math.round(Math.min(w,1500)/24);
    parts = [];
    for(var i=0;i<n;i++){
      parts.push({ x:rand(0,w), y:rand(0,h), r:rand(1.4,6), sp:rand(5,20),
                   dr:rand(-7,7), a:rand(.10,.5), tw:rand(.5,1.6), ph:rand(0,6.28) });
    }
  }

  function frame(t){
    if(!start) start = t;
    var el = (t-start)/1000;
    var intro = Math.min(el/1.8, 1);
    var ease  = 1 - Math.pow(1-intro, 3);
    ctx.clearRect(0,0,w,h);

    /* bloom dourado */
    var cx = w*focal.x, cy = h*focal.y, breathe = 1 + Math.sin(el*.7)*.04;
    var rad = Math.max(w,h) * (.16 + .5*ease) * breathe;
    var g = ctx.createRadialGradient(cx,cy, rad*.04, cx,cy, rad);
    g.addColorStop(0,  'rgba(243,216,150,'+(.40*ease)+')');
    g.addColorStop(.4, 'rgba(227,201,130,'+(.20*ease)+')');
    g.addColorStop(1,  'rgba(227,201,130,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    /* bokeh */
    for(var i=0;i<parts.length;i++){
      var p = parts[i];
      p.y -= p.sp/60; p.x += p.dr/60;
      if(p.y < -12){ p.y = h+12; p.x = rand(0,w); }
      if(p.x < -12) p.x = w+12; if(p.x > w+12) p.x = -12;
      var tw = .6 + .4*Math.sin(el*p.tw + p.ph);
      var alpha = p.a * tw * (.25 + .75*ease);
      var pr = p.r*3;
      var pg = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y,pr);
      pg.addColorStop(0, 'rgba(246,226,168,'+alpha+')');
      pg.addColorStop(1, 'rgba(246,226,168,0)');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,6.2832); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    if(!reduce) raf = requestAnimationFrame(frame);
  }

  function init(){
    resize(); seed();
    if(reduce){ start = performance.now()-2000; frame(performance.now()); return; }
    start = 0; if(raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  }

  var to;
  window.addEventListener('resize', function(){
    clearTimeout(to);
    to = setTimeout(function(){
      resize(); seed();
      if(reduce){ start = performance.now()-2000; frame(performance.now()); }
    }, 150);
  });

  init();
})();
