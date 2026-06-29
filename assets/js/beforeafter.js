/* ÁUREA — comparador antes/depois (arrasta em qualquer lugar) */
(function(){
  var ba = document.getElementById('ba');
  if(!ba) return;
  var range = ba.querySelector('.ba__range');

  function set(v){
    v = Math.max(0, Math.min(100, v));
    ba.style.setProperty('--pos', v + '%');
    if(range) range.value = v;
  }
  function fromX(clientX){
    var r = ba.getBoundingClientRect();
    set(((clientX - r.left) / r.width) * 100);
  }

  if(range) range.addEventListener('input', function(){ set(parseFloat(range.value)); });

  var dragging = false;
  ba.addEventListener('pointerdown', function(e){
    dragging = true;
    try{ ba.setPointerCapture(e.pointerId); }catch(_){}
    fromX(e.clientX);
  });
  ba.addEventListener('pointermove', function(e){ if(dragging) fromX(e.clientX); });
  ba.addEventListener('pointerup',   function(){ dragging = false; });
  ba.addEventListener('pointercancel', function(){ dragging = false; });
})();
