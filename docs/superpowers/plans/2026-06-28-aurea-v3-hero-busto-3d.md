# Áurea v3 — Hero "Busto Áureo" (3D) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o hero da Áurea por uma vitrine 3D — um busto feminino clássico em mármore + ouro, girando devagar e acendendo em luz dourada — 100% offline, com fallback estático perfeito.

**Architecture:** Three.js vendorizado local (ES modules + importmap, zero CDN). Um módulo `hero3d.js` monta a cena dentro de um container no hero; o "mármore + ouro" vem da **iluminação** (luz-chave/rim douradas + ambiente procedural), não de textura. Build incremental: pipeline completa primeiro com um **busto placeholder procedural**, depois troca pelo `.glb` real, depois gera a imagem de fallback. Tudo degrada pra uma `<img>` estática quando não há WebGL ou `prefers-reduced-motion`.

**Tech Stack:** HTML/CSS vanilla, JavaScript ES modules, Three.js r0.160.0 (vendorizado: core + GLTFLoader + RoomEnvironment), `python -m http.server` para servir, Playwright (MCP) para verificação.

**Spec:** `demos/aurea/docs/superpowers/specs/2026-06-28-aurea-v3-hero-busto-3d-design.md`

## Global Constraints

Todo task herda implicitamente estas regras (valores copiados do spec):

- **100% offline** — `0` requisição externa (zero CDN). Three.js, `.glb`, fontes e fallback são **arquivos locais**.
- **Console `0/0`** — 0 erro, 0 warning relevante.
- **`prefers-reduced-motion: reduce`** → entrega o **estado final estático** (sem rotação/parallax/bokeh/acender).
- **Sem WebGL** (ou `?nogl=1`) → mostra a **imagem estática** (`hero-busto-fallback.jpg`) — nunca tela quebrada.
- **`devicePixelRatio` limitado a `2`** (`Math.min(dpr, 2)`).
- **Three.js pinado em `r0.160.0`**, vendorizado em `assets/vendor/three/`.
- **`.glb` SEM compressão Draco**; alvo `~1–3MB`, `~30–60k` triângulos.
- **Personalização** `?nome / ?cidade / ?whats / ?ig` continua funcionando (é DOM; o 3D não toca nela).
- **`<meta name="robots" content="noindex">`** mantido.
- **Paleta (tokens):** `--champagne #F6EFE7` · `--osso #FBF7F1` · `--nude #E6D2C5` · `--ouro #C8A24C` · `--ouro-claro #E3C982` · `--ouro-escuro #A07C34` · `--cafe #2B221C`.
- O 3D é **lazy** (inicia depois do primeiro paint); a `<img>` de fallback é o candidato a LCP.

---

## File Structure

```
demos/aurea/
  index.html                          MODIFY  hero <section> + importmap + <script type=module>
  assets/
    css/styles.css                    MODIFY  estilos do novo hero (backdrop, overlay, fallback)
    js/
      hero3d.js                       CREATE  módulo da cena 3D (orquestrador único)
      hero-glow.js                    DELETE  (bokeh 2D superado pelo 3D)
    vendor/three/
      three.module.js                 CREATE  core (r0.160.0)
      addons/loaders/GLTFLoader.js    CREATE  loader glb (r0.160.0)
      addons/environments/RoomEnvironment.js  CREATE  env procedural (r0.160.0)
    models/busto.glb                  CREATE  busto decimado, sem Draco
    img/hero-busto-fallback.jpg       CREATE  render estático do busto
```

`hero3d.js` é um arquivo único com responsabilidade clara (montar/gerir a cena do hero). É pequeno o bastante pra ler de uma vez; não há motivo pra fragmentar.

---

## How to Verify (loop padrão usado por todas as tarefas)

Não há test runner JS neste projeto — verificação é por **servidor local + Playwright**. Em cada tarefa, "Verificar" significa:

1. **Servir** (numa aba de terminal, a partir de `demos/aurea/`):
   ```bash
   cd "demos/aurea" && python -m http.server 8099
   ```
   (`file://` é bloqueado — sempre via http.)
2. **Abrir** `http://localhost:8099/?<params da tarefa>` no Playwright (MCP `browser_navigate`).
3. **Console:** `browser_console_messages` → **0 erro, 0 warning relevante**.
4. **Rede:** `browser_network_requests` → **nenhuma** requisição com host ≠ `localhost:8099` (prova do offline).
5. **DOM/visual:** `browser_snapshot` / `browser_take_screenshot` conforme a checagem da tarefa.

> Atalho de verificação visual: screenshots em **desktop (1440×900)** e **mobile (390×844)**.

---

## Task 1: Vendorizar Three.js + scaffold offline

**Files:**
- Create: `demos/aurea/assets/vendor/three/three.module.js`
- Create: `demos/aurea/assets/vendor/three/addons/loaders/GLTFLoader.js`
- Create: `demos/aurea/assets/vendor/three/addons/environments/RoomEnvironment.js`
- Create: `demos/aurea/assets/js/_smoke.html` (página de fumaça temporária — apagada no fim da tarefa)

**Interfaces:**
- Produces: módulo `three` resolvível via importmap `"three" → ./assets/vendor/three/three.module.js` e `"three/addons/" → ./assets/vendor/three/addons/`.

- [ ] **Step 1: Baixar os arquivos do Three.js r0.160.0 (uma vez) e salvar local**

Use npm para obter a versão pinada e copie só os 3 arquivos necessários:
```bash
cd "$(mktemp -d)" && npm pack three@0.160.0 && tar -xzf three-0.160.0.tgz
# copie para o projeto (ajuste o caminho do projeto):
DEST="/c/Users/SÉRGIO/OneDrive/Desktop/venda de sites/demos/aurea/assets/vendor/three"
mkdir -p "$DEST/addons/loaders" "$DEST/addons/environments"
cp package/build/three.module.js "$DEST/three.module.js"
cp package/examples/jsm/loaders/GLTFLoader.js "$DEST/addons/loaders/GLTFLoader.js"
cp package/examples/jsm/environments/RoomEnvironment.js "$DEST/addons/environments/RoomEnvironment.js"
```
(Se `npm` não estiver disponível, baixe os mesmos 3 arquivos de uma cópia local do pacote `three@0.160.0` — **não** referenciar CDN no runtime.)

- [ ] **Step 2: Ajustar imports internos dos addons para o caminho vendorizado**

Os addons importam `from 'three'` e de `../libs/...`. Garanta que resolvem via importmap: no `GLTFLoader.js` e `RoomEnvironment.js`, o topo deve importar de `'three'` (já é o caso no r0.160). **Não** edite o conteúdo além disso. Confirme com:
```bash
head -20 "$DEST/addons/loaders/GLTFLoader.js"
```
Esperado: `import { ... } from 'three';` (sem URL absoluta).

- [ ] **Step 3: Página de fumaça que importa three offline**

Crie `demos/aurea/assets/js/_smoke.html`:
```html
<!DOCTYPE html><html><head><meta charset="utf-8">
<script type="importmap">
{ "imports": {
  "three": "../vendor/three/three.module.js",
  "three/addons/": "../vendor/three/addons/"
}}
</script></head><body>
<script type="module">
  import * as THREE from 'three';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
  console.log('THREE', THREE.REVISION, !!GLTFLoader, !!RoomEnvironment);
</script></body></html>
```

- [ ] **Step 4: Verificar (loop padrão)**

Servir e abrir `http://localhost:8099/assets/js/_smoke.html`.
- Console deve conter exatamente: `THREE 160 true true`.
- Rede: só requisições a `localhost:8099` (three.module.js, GLTFLoader.js, RoomEnvironment.js). **Nenhum** host externo.

- [ ] **Step 5: Limpar e "commitar"**

Apague a página de fumaça (não faz parte do entregável):
```bash
rm "demos/aurea/assets/js/_smoke.html"
```
> Sem repositório git ainda (`demos/aurea` não é repo). "Commit" aqui = checkpoint manual. Se quiser versionar: `git init` em `demos/aurea` (combinar com o Nathan). Os próximos "commits" seguem essa mesma observação.

---

## Task 2: Markup + CSS do novo hero (estático, sem JS)

**Files:**
- Modify: `demos/aurea/index.html` (a `<section class="hero" id="topo">`, linhas ~33-49)
- Modify: `demos/aurea/assets/css/styles.css` (bloco do `.hero`)

**Interfaces:**
- Produces: `#hero3d` (container do canvas), `.hero__fallback` (img), `.hero__veil` (overlay do "acender"); classe `body.webgl-ok` esconde o fallback; classe `.is-lit` no hero apaga o véu.

- [ ] **Step 1: Substituir o markup do hero**

Em `index.html`, troque a `<section class="hero" id="topo">…</section>` inteira por:
```html
<section class="hero hero--3d" id="topo">
  <div class="hero__media">
    <div class="hero3d" id="hero3d" aria-hidden="true"></div>
    <img class="hero__fallback" src="assets/img/hero-busto-fallback.jpg"
         alt="Busto de mármore iluminado em tons dourados" decoding="async" fetchpriority="high">
    <div class="hero__veil" aria-hidden="true"></div>
  </div>
  <div class="wrap hero__inner">
    <p class="kicker">Harmonização Facial &amp; Estética Avançada</p>
    <h1 class="hero__title">O glow que <em>parece seu</em>.</h1>
    <p class="hero__lede">Realce sua beleza com naturalidade — protocolos personalizados, mãos de especialista e a sofisticação que o seu rosto merece.</p>
    <div class="hero__cta">
      <a class="btn btn--ouro" data-wa href="#">Agendar avaliação</a>
      <a class="btn btn--ghost" href="#procedimentos">Ver procedimentos</a>
    </div>
  </div>
  <span class="hero__scrolldown">role para descobrir</span>
</section>
```

- [ ] **Step 2: CSS do hero (backdrop escuro→champagne, overlay, fallback)**

Em `styles.css`, substitua as regras antigas do `.hero`/`.hero__media`/`.hero__img`/`.hero__scrim`/`.hero__glow` por:
```css
.hero--3d{
  position:relative; min-height:100svh; display:flex; align-items:center;
  overflow:hidden;
  background:linear-gradient(177deg,#241c16 0%,#3f342b 24%,#9c8369 58%,var(--champagne) 86%);
}
.hero__media{position:absolute; inset:0; z-index:0}
.hero3d{position:absolute; inset:0}
.hero3d canvas{display:block; width:100%!important; height:100%!important}
.hero__fallback{position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:60% 40%}
body.webgl-ok .hero__fallback{display:none}
.hero__veil{position:absolute; inset:0; background:#241c16; opacity:1; pointer-events:none;
  transition:opacity 1.6s ease}
.hero.is-lit .hero__veil{opacity:0}
.hero__inner{position:relative; z-index:2; color:var(--osso); max-width:620px}
.hero--3d .kicker{color:var(--ouro-claro)}
.hero--3d .hero__title{color:var(--osso)}
.hero--3d .hero__title em{color:var(--ouro-claro)}
.hero--3d .hero__lede{color:rgba(251,247,241,.86)}
.hero__scrolldown{position:absolute; left:50%; bottom:22px; transform:translateX(-50%);
  z-index:2; color:rgba(251,247,241,.7); font-size:12px; letter-spacing:.18em; text-transform:uppercase}
@media (prefers-reduced-motion: reduce){ .hero__veil{transition:none} }
```
> Mantenha os tokens/`.btn`/`.wrap`/`.kicker` existentes. O fallback aparece **por padrão**; só some quando o JS confirma WebGL (`body.webgl-ok`).

- [ ] **Step 3: Verificar layout sem JS (loop padrão)**

Crie um placeholder temporário pra `img` não quebrar: copie a foto atual como fallback provisório.
```bash
cp "demos/aurea/assets/img/hero.jpg" "demos/aurea/assets/img/hero-busto-fallback.jpg"
```
Abrir `http://localhost:8099/` (sem `webgl-ok` ainda):
- A `.hero__fallback` cobre o hero; headline/CTAs legíveis sobre o topo escuro.
- Screenshot desktop + mobile: **sem overflow horizontal**, texto sobre área escura.
- Console 0/0; rede só local.

- [ ] **Step 4: Checkpoint** (ver nota de git na Task 1).

---

## Task 3: Cena 3D com busto placeholder + iluminação mármore/ouro + auto-rotação

**Files:**
- Create: `demos/aurea/assets/js/hero3d.js`
- Modify: `demos/aurea/index.html` (importmap + `<script type="module">`, trocar a linha do `hero-glow.js`)

**Interfaces:**
- Consumes: `three`, `three/addons/...` (Task 1); `#hero3d`, `body.webgl-ok`, `.hero.is-lit` (Task 2).
- Produces: `init()` auto-executado on DOM ready; `window.__aureaHero3D` (handle p/ debug com `{renderer, scene, group, setBust(mesh)}`); função `makeBustMaterial()` reutilizada na Task 7.

- [ ] **Step 1: Adicionar importmap + módulo no index.html**

No `index.html`, troque a linha `<script src="assets/js/hero-glow.js" defer></script>` por:
```html
<script type="importmap">
{ "imports": {
  "three": "./assets/vendor/three/three.module.js",
  "three/addons/": "./assets/vendor/three/addons/"
}}
</script>
<script type="module" src="assets/js/hero3d.js"></script>
```
Mantenha `main.js` e `beforeafter.js` como estão.

- [ ] **Step 2: Escrever `hero3d.js` (cena + luzes + busto placeholder + rotação)**

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const COLOR = { marble:0xF2ECE2, gold:0xC8A24C, goldLight:0xE3C982, fill:0xBFD0FF };

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
  renderer.toneMappingExposure = 1.05;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, mount.clientWidth/mount.clientHeight, 0.1, 100);
  camera.position.set(0, 0.15, 4.0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const key  = new THREE.DirectionalLight(COLOR.goldLight, 2.6); key.position.set(2.6, 2.2, 2.2);
  const rim  = new THREE.DirectionalLight(COLOR.gold, 2.2);      rim.position.set(-3.0, 1.2, -1.6);
  const fill = new THREE.DirectionalLight(COLOR.fill, 0.35);     fill.position.set(-1.6,-0.6, 2.6);
  const amb  = new THREE.AmbientLight(0x4a3d33, 0.45);
  scene.add(key, rim, fill, amb);

  const group = new THREE.Group(); scene.add(group);
  const bust = makePlaceholderBust(); group.add(bust);

  return { renderer, scene, camera, group, key, rim, pmrem };
}

let ctx = null;

function setBust(mesh) {
  if (!ctx) return;
  ctx.group.clear();
  ctx.group.add(mesh);
}

function onResize() {
  if (!ctx) return;
  const m = ctx.renderer.domElement.parentElement;
  if (!m) return;
  ctx.camera.aspect = m.clientWidth / m.clientHeight;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(m.clientWidth, m.clientHeight);
  ctx.renderer.render(ctx.scene, ctx.camera);
}

function startScene(mount, { reduced }) {
  ctx = buildScene(mount);
  window.__aureaHero3D = { ...ctx, setBust };
  window.addEventListener('resize', onResize, { passive:true });

  const hero = document.getElementById('topo');
  // acende
  requestAnimationFrame(() => hero && hero.classList.add('is-lit'));

  if (reduced) { ctx.renderer.render(ctx.scene, ctx.camera); return; }

  const SPIN = 0.18; // rad/s (~10°/s)
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    ctx.group.rotation.y += SPIN * dt;
    ctx.renderer.render(ctx.scene, ctx.camera);
    ctx._raf = requestAnimationFrame(loop);
  }
  ctx._raf = requestAnimationFrame(loop);
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
  if (nogl || !hasWebGL()) return; // fallback <img> permanece visível (sem body.webgl-ok)
  document.body.classList.add('webgl-ok');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // lazy: inicia após o primeiro paint
  requestAnimationFrame(() => requestAnimationFrame(() => startScene(mount, { reduced })));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
```

- [ ] **Step 3: Apagar o `hero-glow.js`**
```bash
rm "demos/aurea/assets/js/hero-glow.js"
```

- [ ] **Step 4: Verificar (loop padrão)**

Abrir `http://localhost:8099/`:
- `body` ganha `.webgl-ok`; o canvas aparece e o busto placeholder **gira** devagar; mármore claro com **bordas/realces dourados** sobre o fundo escuro→champagne.
- Console 0/0; rede só local (inclui `three.module.js`, `GLTFLoader.js`, `RoomEnvironment.js`).
- Screenshot desktop: busto iluminado à direita, headline à esquerda.
- Abrir `http://localhost:8099/?nogl=1`: canvas **não** monta, a `<img>` fallback aparece, console 0/0.

- [ ] **Step 5: Checkpoint.**

---

## Task 4: "Acender" no load + bokeh dourado 3D

**Files:**
- Modify: `demos/aurea/assets/js/hero3d.js`

**Interfaces:**
- Consumes: `ctx` (Task 3).
- Produces: `makeBokeh()` (THREE.Points dourados); tween de intensidade das luzes no load.

- [ ] **Step 1: Adicionar `makeBokeh()` e o tween de acender**

Adicione a função e ajuste `startScene` para (a) começar com luzes em 0 e subir em ~1.8s, (b) animar o bokeh:
```js
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
```
Em `startScene`, **depois** de criar `ctx` e antes do loop, registre as luzes alvo, zere-as e crie o bokeh:
```js
  const bokeh = makeBokeh(); ctx.scene.add(bokeh); ctx.bokeh = bokeh;
  const targets = [ [ctx.key, 2.6], [ctx.rim, 2.2] ];
  targets.forEach(([l]) => (l.intensity = 0));
  const litStart = performance.now();
```
Substitua o corpo do `loop` por (inclui acender + bokeh à deriva):
```js
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
    ctx.group.rotation.y += SPIN * dt;
    ctx.renderer.render(ctx.scene, ctx.camera);
    ctx._raf = requestAnimationFrame(loop);
  }
```
No ramo `reduced`, defina luzes no alvo e bokeh invisível antes do `render` único:
```js
  if (reduced) {
    ctx.key.intensity = 2.6; ctx.rim.intensity = 2.2;
    ctx.renderer.render(ctx.scene, ctx.camera); return;
  }
```

- [ ] **Step 2: Verificar (loop padrão)**

Abrir `http://localhost:8099/`:
- Ao carregar: o `.hero__veil` **some** (fade ~1.6s) e o busto **acende** (luz sobe ~1.8s) com bokeh dourado surgindo.
- Console 0/0; rede só local.
- Abrir com `prefers-reduced-motion` emulado (Playwright): **sem** animação — busto já iluminado, parado, véu sem transição. Screenshot confirma estado final.

- [ ] **Step 3: Checkpoint.**

---

## Task 5: Parallax (cursor + giroscópio) + reduced-motion

**Files:**
- Modify: `demos/aurea/assets/js/hero3d.js`

**Interfaces:**
- Consumes: `ctx`, `loop` (Tasks 3-4).
- Produces: alvo de parallax `ctx.tilt = {x, y}` aplicado ao `group` por lerp.

- [ ] **Step 1: Adicionar handlers de parallax e aplicar no loop**

Em `startScene` (ramo animado), antes do loop:
```js
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
      window.removeEventListener('click', ask);
    }, { once: true });
  } else if (DOE) { enableGyro(); }
```
No `loop`, aplique o tilt por lerp **junto** com o spin:
```js
    ctx.group.rotation.x += (ctx.tilt.x - ctx.group.rotation.x) * 0.05;
    const baseY = ctx.group.rotation.y + SPIN * dt;
    ctx.group.rotation.y = baseY + (ctx.tilt.y - 0) * 0.0; // spin domina o eixo Y
    ctx.camera.position.x += ((ctx.tilt.y * 1.2) - ctx.camera.position.x) * 0.05;
    ctx.camera.lookAt(0, 0.1, 0);
```
> Substitua a linha antiga `ctx.group.rotation.y += SPIN * dt;` por esse bloco (o spin contínuo passa a ser o `baseY`).

- [ ] **Step 2: Verificar (loop padrão)**

Abrir `http://localhost:8099/` (desktop): mover o mouse → o busto **inclina suavemente** acompanhando; a auto-rotação continua. Console 0/0.
Reduced-motion: sem parallax (ramo `reduced` não registra handlers). Mobile (Playwright touch): sem erro mesmo sem giroscópio.

- [ ] **Step 3: Checkpoint.**

---

## Task 6: Performance & robustez (pausa off-screen / aba oculta) + auditoria offline

**Files:**
- Modify: `demos/aurea/assets/js/hero3d.js`

**Interfaces:**
- Consumes: `ctx`, `loop`.
- Produces: `pause()` / `resume()`; observers que pausam o rAF quando o hero sai da tela ou a aba fica oculta.

- [ ] **Step 1: Pausar/retomar o render loop**

Adicione, em `startScene` (ramo animado), após iniciar o loop:
```js
  function pause(){ if (ctx._raf){ cancelAnimationFrame(ctx._raf); ctx._raf = null; } }
  function resume(){ if (!ctx._raf && !document.hidden && ctx._visible){ last = performance.now(); ctx._raf = requestAnimationFrame(loop); } }
  ctx.pause = pause; ctx.resume = resume; ctx._visible = true;

  const io = new IntersectionObserver((es) => {
    ctx._visible = es[0].isIntersecting;
    ctx._visible ? resume() : pause();
  }, { threshold: 0.01 });
  io.observe(mount);

  document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
```

- [ ] **Step 2: Verificar (loop padrão) + auditoria das Global Constraints**

Abrir `http://localhost:8099/` e confirmar:
- Rolar até o rodapé → render **pausa** (sem custo fora da tela); voltar ao topo → **retoma**.
- `browser_network_requests`: **0** host externo (offline provado).
- Console **0/0** desktop e mobile.
- `?nogl=1` e reduced-motion: fallback/estático corretos, console 0/0.
- Mobile 390×844: **sem overflow horizontal**; interação fluida.

- [ ] **Step 3: Checkpoint.**

---

## Task 7: Trocar placeholder → busto `.glb` real (Plano A; Plano B se necessário)

**Files:**
- Create: `demos/aurea/assets/models/busto.glb`
- Modify: `demos/aurea/assets/js/hero3d.js` (carregar glb; remover `makePlaceholderBust` do fluxo)

**Interfaces:**
- Consumes: `makeBustMaterial()`, `setBust()`, `window.__aureaHero3D` (Task 3).
- Produces: `busto.glb` local, sem Draco; carregado e re-materializado com mármore+ouro.

- [ ] **Step 1: Obter o modelo (Plano A — CC0/CC-BY)**

Procurar um **busto feminino clássico** com licença livre (preferir **CC0**; CC-BY ok com crédito):
- *Scan the World* (MyMiniFactory) — bustos neoclássicos (ex.: Vênus/“dama”), muitos CC-BY.
- *Smithsonian Open Access* (3D, CC0).
Baixar `.obj`/`.stl`/`.glb`. **Anotar autor/licença** se CC-BY.

- [ ] **Step 2: Decimar e exportar `.glb` sem Draco (gltf-transform; Blender ausente)**

```bash
# Se a fonte for .obj/.stl, converter pra glb primeiro:
npx --yes obj2gltf -i ENTRADA.obj -o tmp.glb
# Decimar + limpar, SEM Draco (pro GLTFLoader não precisar de DRACOLoader):
npx --yes @gltf-transform/cli@4 simplify tmp.glb tmp2.glb --ratio 0.25 --error 0.001
npx --yes @gltf-transform/cli@4 prune  tmp2.glb "demos/aurea/assets/models/busto.glb"
npx --yes @gltf-transform/cli@4 inspect "demos/aurea/assets/models/busto.glb" | head -40
```
Alvo: ~30–60k triângulos, ~1–3MB. As texturas embutidas são irrelevantes (o material é sobrescrito no código, Step 3) — pode mantê-las ou removê-las pra aliviar peso.
> **Plano B / nota do coordenador:** se achar/converter o modelo exigir passos manuais (download via UI, login), o **coordenador fornece `busto.glb` direto**. Em último caso, gerar via higgsfield (se houver saldo) ou usar um busto estilizado simples. O `setBust()` aceita qualquer mesh e **o look (mármore+ouro) vem da luz**, então a troca não muda o visual da cena.

- [ ] **Step 3: Carregar o glb no `hero3d.js`**

Em `startScene`, **após** `buildScene`, troque o placeholder pelo modelo (mantendo o placeholder como fallback até o glb chegar):
```js
  const loader = new GLTFLoader();
  loader.load('assets/models/busto.glb', (gltf) => {
    const root = gltf.scene;
    const mat = makeBustMaterial();
    root.traverse(o => { if (o.isMesh){ o.material = mat; o.castShadow = false; } });
    // enquadrar: centralizar e escalar pra ~2.2 de altura
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.2 / (size.y || 1);
    root.scale.setScalar(s);
    root.position.sub(center.multiplyScalar(s));
    root.position.y += 0.1;
    setBust(root);
  }, undefined, (err) => { console.warn('glb load falhou, mantendo placeholder', err); });
```
> Mantém o `makePlaceholderBust()` no arquivo como rede de segurança (se o glb falhar, a cena não fica vazia). Aceitável: nenhum `console.error`; o `warn` só dispara em falha real de asset.

- [ ] **Step 4: Verificar (loop padrão)**

Abrir `http://localhost:8099/`:
- O **busto real** aparece (substitui o placeholder), centrado, girando, em mármore+ouro.
- Rede: `busto.glb` vem de `localhost` (local); **nenhum** host externo.
- Console 0/0 (sem `warn` de falha).
- Screenshot desktop + mobile.

- [ ] **Step 5: Crédito de licença (se CC-BY)** — adicionar linha discreta no rodapé do `index.html` e no `README.md` do demo. **Checkpoint.**

---

## Task 8: Gerar a imagem de fallback a partir do render real

**Files:**
- Create/Replace: `demos/aurea/assets/img/hero-busto-fallback.jpg`

**Interfaces:**
- Consumes: a cena renderizada (Task 7).

- [ ] **Step 1: Capturar um frame bonito do busto**

Servir, abrir `http://localhost:8099/` em **1440×900** (Playwright), aguardar o "acender" terminar (~2.5s), e **screenshot só do hero** (`#topo`). Escolher um ângulo cheio (esperar a rotação deixar o rosto ~frontal).

- [ ] **Step 2: Recortar/otimizar e salvar como `.jpg`**

Salvar a captura como `demos/aurea/assets/img/hero-busto-fallback.jpg` (qualidade ~82, largura ~1600). Garantir que **reproduz o enquadramento** do hero (busto à direita, fundo escuro→champagne) pra o fallback ser fiel.

- [ ] **Step 3: Verificar fallback fiel (loop padrão)**

Abrir `http://localhost:8099/?nogl=1` e com reduced-motion:
- A `<img>` mostra **o busto real** (não a foto de pele antiga), batendo com a versão 3D.
- Console 0/0; rede só local.
- Screenshot mobile + desktop do fallback.

- [ ] **Step 4: Checkpoint.**

---

## Task 9: Faxina final + migração da foto antiga + verificação completa

**Files:**
- Modify: `demos/aurea/index.html` (reaproveitar `hero.jpg` em Resultados/Ambiente, se fizer sentido)
- Verify: demo inteiro

**Interfaces:** —

- [ ] **Step 1: Reaproveitar a `hero.jpg` (pele) liberada**

A `assets/img/hero.jpg` saiu do hero. Onde a galeria de Resultados/Ambiente usa `skin-closeup.jpg` repetida, usar `hero.jpg` como uma das fotos pra **reduzir repetição** (sem mexer no layout). (Conserto completo do antes/depois segue fora de escopo.)

- [ ] **Step 2: Verificação completa (loop padrão, end-to-end)**

Rodar a checagem inteira:
- **Offline:** `browser_network_requests` → 0 host externo em toda a página.
- **Console:** 0/0 desktop e mobile.
- **Personalização:** abrir `http://localhost:8099/?nome=Clínica%20Bella&cidade=S%C3%A3o%20Paulo/SP&whats=5511999999999&ig=clinicabella` → logo/headline/cidade/WhatsApp/Instagram **rebatizados**; todos os CTAs `data-wa` apontam pro número novo. (Prova de que o 3D não quebrou o `main.js`.)
- **Fallback:** `?nogl=1` e reduced-motion → imagem estática do busto, perfeita.
- **Mobile 390×844:** sem overflow horizontal; hero ok; render pausa fora da tela.
- **Critérios de pronto do spec (§13):** marcar todos.

- [ ] **Step 3: Screenshots finais** (desktop + mobile, hero e full-page) para o Nathan aprovar.

- [ ] **Step 4: Checkpoint final.** (Se for publicar: combinar `git init` + repo no GitHub Pages conforme o método do projeto.)

---

## Self-Review

**1. Spec coverage:**
- §3 experiência → Tasks 3-5 (cena, acender, parallax). ✅
- §4 direção visual (backdrop escuro→champagne, overlay, tipografia) → Task 2 + 3. ✅
- §5 mármore+ouro via luz → Task 3 (`makeBustMaterial` + luzes). ✅
- §6 movimento (auto-rotação + parallax + reduced-motion) → Tasks 3-5. ✅
- §7 arquitetura/arquivos (vendor, modelo, hero3d, aposentar hero-glow, migrar hero.jpg) → Tasks 1,3,7,9. ✅
- §8 fonte do modelo + plano B → Task 7. ✅
- §9 performance/fallback/acessibilidade → Tasks 3 (WebGL detect, dpr, lazy), 6 (pausa), 4-5 (reduced-motion). ✅
- §10 personalização → Task 9 (verificação). ✅
- §11 conformidade (crédito licença, noindex) → Task 7 step 5 (noindex já no HTML, intocado). ✅
- §13 critérios → Task 9. ✅

**2. Placeholder scan:** sem "TBD/TODO"; todo step de código mostra código real; comandos com saída esperada. ✅

**3. Type consistency:** `makeBustMaterial()`, `makePlaceholderBust()`, `setBust(mesh)`, `startScene(mount,{reduced})`, `buildScene(mount)`, `init()`, `hasWebGL()`, `makeBokeh(count)`, `pause()/resume()`, `ctx.{renderer,scene,camera,group,key,rim,pmrem,bokeh,tilt,_raf,_visible}` — nomes consistentes entre as Tasks 3→7. ✅

Sem lacunas encontradas.
