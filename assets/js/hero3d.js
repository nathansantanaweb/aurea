import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COLOR = { marble:0xF0E6D2, gold:0xC8A24C, goldLight:0xE3C982, fill:0xBFD0FF };

export function makeBustMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: COLOR.marble, roughness: 0.42, metalness: 0.0,
    clearcoat: 0.5, clearcoatRoughness: 0.5, sheen: 0.5, sheenColor: 0xfff4dc,
    envMapIntensity: 0.7,
  });
}

function makePlaceholderBust() {
  // forma simbólica (substituída pelo .glb real na Task 7)
  const mat = makeBustMaterial();
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 64, 48), mat);
  head.scale.set(0.92, 1.12, 0.96); head.position.y = 0.66;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.30, 0.45, 48), mat);
  neck.position.y = 0.12;
  const bustBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.78, 0.7, 48, 1, true), mat);
  bustBase.position.y = -0.45;
  g.add(head, neck, bustBase);
  g.userData.isPlaceholder = true;
  return g;
}

function buildScene(mount) {
  const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, mount.clientWidth/mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0.15, 4.0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key  = new THREE.DirectionalLight(COLOR.goldLight, 3.0); key.position.set(2.6, 2.2, 2.2);
  const rim  = new THREE.DirectionalLight(COLOR.gold, 2.8);      rim.position.set(-3.0, 1.2, -1.6);
  const fill = new THREE.DirectionalLight(COLOR.fill, 0.35);     fill.position.set(-1.6,-0.6, 2.6);
  const amb  = new THREE.AmbientLight(0x4a3d33, 0.45);
  scene.add(key, rim, fill, amb);

  const rig = new THREE.Group(); scene.add(rig);
  const group = new THREE.Group(); rig.add(group);
  const bust = makePlaceholderBust(); group.add(bust);

  return { renderer, scene, camera, group, rig, key, rim, pmrem };
}

function makeBokeh(count = 90) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 7;
    pos[i*3+1] = (Math.random() - 0.5) * 5;
    pos[i*3+2] = (Math.random() - 0.5) * 3 - 1.0;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: COLOR.goldLight, size: 0.07, sizeAttenuation: true,
    transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData.baseY = pos.slice();
  return pts;
}

let ctx = null;

function setBust(mesh) {
  if (!ctx) return;
  ctx.group.clear();
  ctx.group.add(mesh);
}

function updateRig() {
  if (!ctx || !ctx.rig) return;
  if (innerWidth > 880) {
    ctx.rig.position.x = 1.1;
    ctx.rig.position.y = 0;
    ctx.group.scale.setScalar(1.0);
  } else {
    ctx.rig.position.x = 0;
    ctx.rig.position.y = -1.3;
    ctx.group.scale.setScalar(0.75);
  }
}

function onResize() {
  if (!ctx) return;
  const m = ctx.renderer.domElement.parentElement;
  if (!m) return;
  ctx.camera.aspect = m.clientWidth / m.clientHeight;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ctx.renderer.setSize(m.clientWidth, m.clientHeight);
  updateRig();
  ctx.renderer.render(ctx.scene, ctx.camera);
}

function startScene(mount, { reduced }) {
  ctx = buildScene(mount);
  ctx.setBust = setBust;
  window.__aureaHero3D = ctx;
  updateRig();
  window.addEventListener('resize', onResize, { passive:true });

  // Carregar busto real (CC0); placeholder permanece até o glb chegar
  const loader = new GLTFLoader();
  loader.load('assets/models/busto.glb', (gltf) => {
    const root = gltf.scene;
    const mat = makeBustMaterial();
    root.traverse(o => { if (o.isMesh) { o.material = mat; o.castShadow = false; } });
    // enquadrar: centralizar bbox e escalar pra ~2.2 de altura
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.2 / (size.y || 1);
    root.scale.setScalar(s);
    root.position.sub(center.multiplyScalar(s));
    root.position.y += 0.1;
    setBust(root);
    if (!ctx._raf) ctx.renderer.render(ctx.scene, ctx.camera);
  }, undefined, (err) => { console.warn('glb load falhou, mantendo placeholder', err); });

  const hero = document.getElementById('topo');
  // acende
  requestAnimationFrame(() => hero && hero.classList.add('is-lit'));

  const bokeh = makeBokeh(); ctx.scene.add(bokeh); ctx.bokeh = bokeh;
  const targets = [ [ctx.key, 3.0], [ctx.rim, 2.8] ];
  targets.forEach(([l]) => (l.intensity = 0));
  const litStart = performance.now();

  if (reduced) {
    ctx.key.intensity = 3.0; ctx.rim.intensity = 2.8;
    ctx.renderer.render(ctx.scene, ctx.camera); return;
  }

  ctx.tilt = { x: 0, y: 0 };
  const MAXT = 0.18; // rad
  window.addEventListener('pointermove', (e) => {
    ctx.tilt.x = ((e.clientY / innerHeight) - 0.5) * MAXT;
    ctx.tilt.y = ((e.clientX / innerWidth)  - 0.5) * MAXT;
  }, { passive: true });
  // giroscópio (iOS exige permissão por gesto; se negar, fica sem parallax — sem erro)
  function enableGyro() {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      ctx.tilt.y = THREE.MathUtils.clamp(e.gamma / 90, -1, 1) * MAXT;
      ctx.tilt.x = THREE.MathUtils.clamp((e.beta - 45) / 90, -1, 1) * MAXT;
    }, { passive: true });
  }
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') {
    window.addEventListener('click', function ask() {
      DOE.requestPermission().then(s => s === 'granted' && enableGyro()).catch(()=>{});
    }, { once: true });
  } else if (DOE) { enableGyro(); }
  const SPIN = 0.18; // rad/s (~10°/s)
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const k = Math.min((now - litStart) / 1800, 1);      // 0→1 em 1.8s
    const ease = k * (2 - k);                             // easeOutQuad
    targets.forEach(([l, max]) => (l.intensity = max * ease));
    bokeh.material.opacity = 0.55 * ease;
    const by = bokeh.geometry.getAttribute('position');
    for (let i = 0; i < by.count; i++) {
      const y = bokeh.userData.baseY[i*3+1] + Math.sin(now*0.0003 + i) * 0.15;
      by.setY(i, y);
    }
    by.needsUpdate = true;
    ctx.group.rotation.x += (ctx.tilt.x - ctx.group.rotation.x) * 0.05;
    const baseY = ctx.group.rotation.y + SPIN * dt;
    ctx.group.rotation.y = baseY; // spin domina o eixo Y
    ctx.camera.position.x += ((ctx.tilt.y * 1.2) - ctx.camera.position.x) * 0.05;
    ctx.camera.lookAt(0, 0.1, 0);
    ctx.renderer.render(ctx.scene, ctx.camera);
    ctx._raf = requestAnimationFrame(loop);
  }
  ctx._raf = requestAnimationFrame(loop);

  function pause(){ if (ctx._raf){ cancelAnimationFrame(ctx._raf); ctx._raf = null; } }
  function resume(){ if (!ctx._raf && !document.hidden && ctx._visible){ last = performance.now(); ctx._raf = requestAnimationFrame(loop); } }
  ctx.pause = pause; ctx.resume = resume; ctx._visible = true;

  const io = new IntersectionObserver((es) => {
    ctx._visible = es[0].isIntersecting;
    ctx._visible ? resume() : pause();
  }, { threshold: 0.01 });
  io.observe(mount);

  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
}

function hasWebGL() {
  try { const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

function init() {
  const mount = document.getElementById('hero3d');
  if (!mount) return;
  const nogl = new URLSearchParams(location.search).get('nogl') === '1';
  if (nogl || !hasWebGL()) {        // fallback <img> permanece visível (sem body.webgl-ok)
    const hero = document.getElementById('topo');
    requestAnimationFrame(() => hero && hero.classList.add('is-lit')); // revela a fallback-img (remove veil)
    return;
  }
  document.body.classList.add('webgl-ok');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // lazy: inicia após o primeiro paint
  requestAnimationFrame(() => requestAnimationFrame(() => startScene(mount, { reduced })));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
