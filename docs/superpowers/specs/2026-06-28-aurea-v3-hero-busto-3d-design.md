# Áurea v3 — Hero "Busto Áureo" (3D) — Design Spec

- **Data:** 2026-06-28
- **Tipo:** Evolução do demo Áurea (carro-chefe estética/beleza premium) — upgrade do **HERO** para **3D (Three.js)**
- **Pasta:** `demos/aurea/`
- **Base:** evolui `2026-06-27-aurea-vitrine-harmonizacao-facial.md` (v1 + refino v2). Substitui o hero fotográfico+Canvas pelo hero 3D; o resto do site permanece.
- **Status:** aprovado no brainstorming; aguardando revisão do spec → plano → build

---

## 1. Objetivo

Transformar o hero da Áurea numa **vitrine 3D deslumbrante**: um **busto feminino clássico em mármore + ouro**, girando devagar e "acendendo" em luz dourada. É o salto de *wow* que o spec original deixou reservado (§12, "3D/Three.js — evolução futura"), sucessor da vitrine 3D da Lumina (odonto), agora no nicho maior e mais Instagram-native.

Função **emocional**: o lead abre o link e pensa *"quero ISSO pra minha clínica"*. Continua sendo o **demo genérico pro disparo** (não é cliente real) — cada link se rebatiza por querystring (§10).

## 2. Decisões aprovadas (brainstorming 2026-06-28)

| Tema | Decisão |
|---|---|
| Salto | Hero **3D em Three.js**, vendorizado local (offline) |
| Centerpiece | **Busto feminino clássico** (greco-romano/neoclássico, tipo Vênus) — sacada de marca: **Áurea ↔ proporção áurea** |
| Material | **Mármore + ouro** (mármore claro; o ouro vem da **luz**, não de textura) |
| Fundo | **Escuro espresso** dissolvendo em **champagne** nos ~15% finais (drama no topo, emenda lisa com o corpo claro do site) |
| Movimento | **Auto-rotação lenta (turntable) + parallax sutil** (cursor no desktop, giroscópio no mobile); ouro cintilando |
| Posição | **Hero vira o palco do busto** (full-bleed, headline sobreposta). A foto de pele real migra pros procedimentos/resultados |

## 3. Experiência (jornada do lead)

1. Abre o link → tela **escura**.
2. **A luz dourada floresce** (bloom varre) e revela o busto de mármore — opaco → radiante, ~2s. (Evolução direta do "acende no load" do hero atual.)
3. O busto **gira devagar**; o ouro lambe as bordas e **bokeh dourado flutua em profundidade** (3D).
4. **Headline** "O glow que *parece seu.*" + CTAs sobrepostos (igual hoje).
5. Mexe o dedo/cursor → o busto **inclina de leve** acompanhando (parallax).
6. Rola a página → o hero escuro **dissolve no champagne** e entrega na seção Procedimentos sem emenda.

## 4. Direção visual do hero

- **Backdrop:** gradiente vertical `--cafe (#2B221C)` no topo → `--champagne (#F6EFE7)` na base (~últimos 15%). Halo dourado radial atrás do busto.
- **Busto (mármore):** claro, na família `--osso/--champagne`, com realce dourado `--ouro (#C8A24C)` / `--ouro-claro (#E3C982)` vindo da luz.
- **Luz:** *key light* dourada orbitando + *rim light* dourado na borda + ambiente quente sutil + *fill* frio suave (dá volume ao mármore). É isso que cria "mármore + ouro".
- **Bokeh dourado 3D:** partículas leves em profundidade (substitui o Canvas 2D do `hero-glow.js`).
- **Tipografia/overlay:** mantém **Cormorant Garamond** (vendorizada, OFL); headline em tom claro (`--osso`) com itálico dourado, kicker dourado em maiúsculas, CTAs `--ouro` + ghost. Texto fica do lado, sobre a região escura — legível.

## 5. Material mármore + ouro (técnica)

O busto **não** recebe ouro pintado (evita máscaras/textura). Ele é **mármore PBR** (claro, leve translucidez/sheen) e o **ouro vem da iluminação**: luz-chave dourada + rim dourado + reflexo de ambiente quente. Resultado = exatamente o mockup aprovado, sem depender da textura do modelo (por isso a fonte do `.glb` pode variar sem mudar o look — §8).

## 6. Movimento & interação

- **Auto-rotação** lenta e contínua (turntable, ~6–10°/s), sentido único.
- **Parallax:** inclinação suave (lerp) em direção ao ponteiro (desktop) e ao **giroscópio** (mobile). iOS exige permissão de `deviceorientation` — se não for concedida, **degrada sem parallax** (sem erro, sem pedir de forma intrusiva).
- **Cintilar do ouro:** efeito natural da luz-chave orbitando (não é animação extra).
- **Sem arrastar pra girar** (fora de escopo — §14).
- **`prefers-reduced-motion`:** sem rotação/parallax/bokeh — entrega o **estado final estático** (busto iluminado), igual à regra do hero atual.

## 7. Arquitetura & arquivos (`demos/aurea/`)

```
assets/
  vendor/three/     Three.js vendorizado local (core + GLTFLoader) — ZERO CDN
  models/busto.glb  busto decimado (leve pra mobile)
  img/hero-busto-fallback.jpg   render estático pré-gerado (fallback)
  js/hero3d.js      cena, luzes douradas, rotação, parallax, bokeh, "acender" no load,
                    feature-detect WebGL, pausa off-screen/aba oculta, reduced-motion
  css/styles.css    + estilos do novo hero (backdrop escuro→champagne, overlay)
index.html          hero reescrito: container 3D + headline overlay + <img> fallback atrás
```

- **Aposenta** `hero-glow.js` (o bokeh 2D é superado pelo 3D).
- A antiga `assets/img/hero.jpg` (pele) **migra** pros procedimentos/resultados (onde pele real importa).
- Three.js carregado **depois do primeiro paint** (lazy), pra não travar o carregamento.

## 8. Fonte do modelo 3D (risco principal + plano B)

- **Plano A:** scan **CC0/CC-BY** de busto clássico feminino (acervo tipo *Scan the World* / museu) → **decimar** (alvo ~30–60k tris) → exportar `.glb` local → descartar a textura do scan (usamos material próprio, §5). Se **CC-BY**, crédito discreto no rodapé/README.
- **Plano B:** gerar via **higgsfield** (se houver saldo) ou usar um busto estilizado mais simples.
- **O look (mármore + ouro + luz) independe da fonte**, então a qualidade visual está garantida mesmo trocando o modelo.

## 9. Performance, fallback & acessibilidade (padrão Áurea — inegociável)

- **100% offline**, **console 0/0**, **0 requisição externa** (three, glb, fontes, fallback — tudo local).
- **Sem WebGL** / **`prefers-reduced-motion`** / aparelho fraco → **imagem estática** do busto (a mesma joia, parada) — **nunca** tela quebrada.
- **Mobile:** `devicePixelRatio` limitado (≤ ~2), bokeh reduzido, **pausa o render quando o hero sai da tela** (`IntersectionObserver`) e quando a **aba está oculta** (`visibilitychange`).
- **LCP:** a imagem fallback é o candidato a LCP (3D inicializa depois). Sem travar o primeiro paint.
- **Sem overflow horizontal**; foco/teclado dos CTAs intactos.

## 10. Personalização por link (mantida)

`?nome=<clínica>&cidade=<cidade>&whats=<55+DDD+nº>&ig=<handle>` rebatiza logo, headline, cidade, todos os WhatsApp (`window.WHATS`) e o Instagram — tudo **DOM**, então o 3D não interfere. Fallback pros valores padrão da Áurea. Sanitização anti-XSS (remover `<>`), igual aos demos anteriores.

## 11. Conformidade

Hero não faz promessa de resultado; disclaimers das demais seções e o `noindex` permanecem. Se o modelo for **CC-BY**, crédito de licença discreto no rodapé/README.

## 12. Stack

Vanilla JS + **Three.js vendorizado local**, CSS próprio, **offline, zero CDN**. Orçamento de peso: three (~150KB gz), `busto.glb` decimado (alvo ~1–3MB), fallback `.jpg`. Lazy-load do three.

## 13. Critérios de pronto (success criteria)

- [ ] Hero com **busto mármore + ouro** sobre fundo **escuro → champagne**.
- [ ] **Acende no load** (bloom dourado, ~2s) e respeita `prefers-reduced-motion`.
- [ ] **Auto-rotação + parallax** (cursor; giroscópio no mobile, degradando se negado).
- [ ] **100% offline** — 0 requisição externa no Network.
- [ ] **Console 0/0**.
- [ ] **Fallback estático perfeito** sem WebGL / reduced-motion (a mesma imagem do busto).
- [ ] **Mobile fluido** (alvo ≥30fps), `dpr` limitado, pausa off-screen/aba oculta, **sem overflow horizontal**.
- [ ] 3D **não trava o primeiro paint** (lazy; fallback é LCP).
- [ ] **Personalização** (`?nome/cidade/whats/ig`) funcionando em todos os CTAs.
- [ ] Crédito de licença do modelo (se CC-BY) no rodapé/README.

## 14. Fora de escopo (YAGNI deste marco)

- Arrastar pra girar.
- Gilding por textura/máscara (ouro vem da luz).
- HDR/environment pesado.
- Mexer no **conteúdo** das outras seções.
- **Conserto do antes/depois** (hoje usa a mesma foto dos dois lados) — **tarefa separada**, não entra neste marco.

## 15. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Achar bom modelo 3D livre | Plano B (gerar/estilizado); look independe da fonte (§8) |
| Peso/perf no mobile | Decimar, `dpr` cap, lazy-load, pausa off-screen |
| *Uncanny*/clichê "estátua grega" | Estilizado + ouro/glow/rotação eleva; mármore (não pele realista) |
| Permissão de giroscópio (iOS) | Degrada sem parallax, sem erro |
| LCP/carregamento | Fallback img como LCP + three lazy pós-paint |

---

Regras relacionadas: dados da especialista ainda placeholder → [[dados-pessoais-pos-contrato]]; estrutura do negócio → [[estrutura-venda-de-sites]]; spec base → `2026-06-27-aurea-vitrine-harmonizacao-facial.md`.
