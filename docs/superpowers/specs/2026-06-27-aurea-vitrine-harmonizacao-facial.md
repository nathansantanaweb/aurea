# Áurea — Vitrine de Harmonização Facial (Design Spec)

- **Data:** 2026-06-27
- **Tipo:** Demo "vitrine de luxo" (carro-chefe pro disparo) — nicho **estética/beleza premium**, foco **harmonização facial / injetáveis**
- **Pasta:** `demos/aurea/`
- **Status:** aprovado no brainstorming; aguardando revisão do spec → plano → build

---

## 1. Objetivo

Uma vitrine fictícia **deslumbrante** de uma clínica de harmonização facial, usada como **prova de capacidade** no disparo via WhatsApp. A função é emocional: o lead bate o olho e pensa *"eu quero ISSO pra minha clínica"*. É o sucessor da Lumina (odonto), agora num nicho maior e mais Instagram-native.

**Não** é o site de um cliente real — é o demo genérico. Cada link de disparo se rebatiza sozinho (ver §7).

## 2. Público & posicionamento

- **Quem compra (o lead):** harmonizadores faciais, biomédicos esteta, dentistas HOF, dermatologistas, donos de clínica de estética premium.
- **Posicionamento da marca fictícia:** beleza natural, resultado de especialista, experiência de luxo.
- **Tagline:** *"O glow que parece seu."*
- **Tom:** sofisticado, feminino, acolhedor, confiante — nunca apelativo nem "promessa milagrosa".

## 3. Identidade visual — Nude & Ouro

**Tokens de cor** (`assets/css/tokens.css`):

| Token | Hex | Uso |
|---|---|---|
| `--champagne` | `#F6EFE7` | fundo base |
| `--osso` | `#FBF7F1` | fundo alternado / cards claros |
| `--nude` | `#E6D2C5` | blocos de destaque, faixas |
| `--nude-fundo` | `#D8BCA8` | sombreamento nude |
| `--ouro` | `#C8A24C` | detalhes, rótulos, CTA |
| `--ouro-claro` | `#E3C982` | brilho / gradiente do glow |
| `--ouro-escuro` | `#A07C34` | hover, contornos finos |
| `--cafe` | `#2B221C` | texto principal |
| `--cafe-suave` | `#6E6157` | texto secundário |
| `--linha` | `rgba(43,34,28,.12)` | bordas/divisores |

**Tipografia:**
- **Display (h1/h2, números grandes):** *Cormorant Garamond* — vendorizada local em `assets/fonts/` (woff2, licença OFL). Fallback: `Georgia, 'Times New Roman', serif`.
- **Texto/UI:** stack de sistema — `-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.
- **Rótulos/kicker:** sans em maiúsculas, `letter-spacing` largo, na cor `--ouro`.

**Princípios:** muito respiro (espaço em branco), cantos suaves, sombras leves e quentes, fios dourados finos como detalhe, fotografia de pele radiante/glow.

## 4. Estrutura de seções

1. **Header** — logo "Áurea" (serif + fio dourado), menu âncora, botão **Agendar avaliação** (WhatsApp). Sticky, condensa ao rolar; hambúrguer no mobile.
2. **Hero — "o wow"** — foto de pele real que **acende** (opaco → glow) ao carregar + bokeh dourado (Canvas). Kicker, `h1` aspiracional, lede curta, CTA primário (WhatsApp) + secundário (âncora "Procedimentos"). Ver §5.
3. **Faixa de confiança** — 3–4 dados em serif/mono: *Especialista · +N procedimentos · Nota 5,0 · Registro do conselho [placeholder]*.
4. **Procedimentos** — grid de cards premium com foto glow: Harmonização facial · Toxina botulínica · Preenchimento labial · Bioestimulador de colágeno · Skinbooster · Olheiras/região periorbital. Cada card: foto, título, 1 linha, hover com leve elevação + sublinhado dourado.
5. **Resultados (Antes & Depois)** — comparador deslizante (slider arrastável) com 2 fotos reais + **disclaimer de conformidade** (§8). Texto enquadrando "resultados ilustrativos".
6. **A especialista** — retrato **[placeholder pós-contrato]** + bio curta + ficha (formação/registro **[placeholder]**). Segue [[dados-pessoais-pos-contrato]].
7. **Ambiente & experiência** — 2–3 fotos da clínica + copy sensorial ("como é viver a Áurea").
8. **Depoimentos** — 3 cards com estrelas douradas + nome (fictício).
9. **Como funciona** — 4 passos: Avaliação → Plano personalizado → Procedimento → Acompanhamento.
10. **FAQ** — sanfona: "Dói?", "Quanto tempo dura?", "Fica natural?", "Quando vejo resultado?", "Posso voltar à rotina?".
11. **CTA final + Contato** — bloco nude/ouro, botão WhatsApp grande, endereço, horários, mapa estilizado (SVG offline).
12. **Rodapé** — navegação, **disclaimer de conformidade**, `noindex`.
13. **WhatsApp flutuante** — sempre visível.

## 5. O efeito "glow" (assinatura)

- **Hero (no load):** sobre uma foto de pele/rosto, um **bloom de luz dourada** varre e a imagem vai de levemente dessaturada/opaca → radiante; partículas de **bokeh dourado** sobem suaves (Canvas 2D). Duração ~2s, depois loop sutil de bokeh.
- **Fio condutor (no scroll):** uma luz ambiente dourada **cresce sutilmente** página abaixo (gradientes radiais por seção, revelados via `IntersectionObserver`). É a evolução do *escuro→luz* da Lumina, agora *opaco→glow*.
- **Acessibilidade:** respeitar `prefers-reduced-motion` — sem varredura/partículas, entrega o estado final (pele radiante) direto.
- **Tech:** Canvas 2D + CSS. **Sem Three.js / sem 3D** neste marco (fica como evolução futura).

## 6. Comportamento & interações

- Scroll suave nas âncoras; header condensa.
- Cards: hover com elevação + sublinhado dourado.
- Contadores animados na faixa de confiança / números grandes.
- Antes&Depois: slider arrastável (mouse + touch), sem travar o scroll do mobile.
- FAQ: sanfona acessível (teclado).
- Reveals on-scroll (fade/slide leves) com `IntersectionObserver`.
- **0 erro de console; 0 requisição externa.**

## 7. Personalização por link

Querystring opcional: `?nome=<clínica>&cidade=<cidade>&whats=<55+DDD+número>`.
- Rebatiza logo/título, cidade e **todos** os links de WhatsApp (`window.WHATS`).
- **Fallback** pros valores padrão da Áurea quando ausente.
- Sanitizado contra XSS (remover `<>`), igual ao padrão dos demos anteriores.

## 8. Conformidade (conselhos)

Harmonização facial tem regras (CFM/CFO/CRBM) sobre **antes/depois** e **promessa de resultado**:
- Rodapé com **disclaimer**: caráter informativo; imagens ilustrativas; resultados variam por pessoa; procedimentos por profissional habilitado — registro **[a preencher]**.
- Sem "garantia", "milagre", preços de procedimento ou promessa de resultado.
- `noindex` na prévia (vira `index` só quando virar site oficial).
- Antes&Depois com legenda de conformidade.

> No **demo fictício** isso é livre/ilustrativo; o objetivo é já nascer no formato que o **site vendido** precisa pra ficar compliant.

## 9. Stack & arquitetura

```
demos/aurea/
  index.html
  assets/
    css/  tokens.css · styles.css
    js/   main.js · hero-glow.js · scroll-glow.js · beforeafter.js · faq.js · personalize.js · whatsapp.js
    fonts/ cormorant-*.woff2 (vendorizada, OFL)
    img/   hero, procedimentos (6), ambiente (3), antes/depois (2), especialista (placeholder)
  docs/superpowers/specs/2026-06-27-aurea-vitrine-harmonizacao-facial.md
  README.md
```
- **Vanilla** JS modular (sem framework), CSS próprio, **offline, zero CDN** (tudo local).
- Imagens: **stock Pexels (licença livre)** baixadas local (higgsfield está no plano free). Pele/glow é fácil de achar em stock.

## 10. Conteúdo fictício (base)

- **Marca:** Áurea — Harmonização Facial & Estética Avançada
- **Cidade padrão:** Manaus/AM (fallback); WhatsApp fallback genérico.
- **Especialista:** *[placeholder]* (foto + nome + registro entram pós-contrato).
- Copy de exemplo escrita no tom do §2 (sem promessas).

## 11. Critérios de pronto (success criteria)

- [ ] Fiel ao Nude & Ouro; hero "acende" no load e respeita `prefers-reduced-motion`.
- [ ] Glow crescente no scroll, elegante (não cansativo).
- [ ] **100% offline** — verificável (0 requisição externa no Network).
- [ ] Responsivo: hambúrguer no mobile, **sem overflow** horizontal, slider Antes&Depois ok no touch.
- [ ] **Console 0/0** (0 erro, 0 warning relevante).
- [ ] Personalização por link funciona em **todos** os CTAs (header, hero, contato, flutuante).
- [ ] Antes&Depois com disclaimer; rodapé com disclaimer; `noindex` presente.
- [ ] Placeholders pós-contrato visíveis e marcados (especialista, registro).

## 12. Fora de escopo (YAGNI)

- 3D / Three.js (evolução futura, se Nathan quiser).
- Back-end, agendamento real (só WhatsApp), pagamento.
- Blog/artigos, múltiplos idiomas.
- Segundo estilo/tema claro alternativo.

---

## 13. Refinamento v2 — 2026-06-27 (premium + legibilidade + seções do nicho)

Pesquisa do nicho (NT Clinic, Clinic Perfect Face, Espaço Facial + guias med spa 2026: Marceline, BloomDigital, Kōvly) cruzada com o demo atual. Decisões aprovadas no brainstorming:

**A. Legibilidade** (queixa: "textos difíceis de ler")
- `--cafe-suave` escurecido `#6E6157` → `#574C42` (contraste ~4.7 → ~6.5:1).
- Tamanhos +1–2px e mais entrelinha em: intros de seção, descrições de card, passos, bio, lede do hero, disclaimers, ficha, FAQ.

**B. Premium** (refinado, não "mais enfeite")
- Numeração editorial automática nas seções (`01 · `, via CSS counter no kicker dentro de `.sec`).
- Fios dourados finos / divisores; mais respiro vertical (padding de seção maior).
- Grão de filme global sutil (SVG fractalNoise, opacidade ~.035, `pointer-events:none`).
- Micro-interações: brilho dourado varrendo no hover dos botões (CSS), parallax leve no hero (JS, respeita `prefers-reduced-motion`), acento dourado no hover dos cards.

**C. Seções novas** (gap do nicho) — todas com **placeholder premium** "entra pós-contrato" (higgsfield free sem saldo: 0.41 crédito; imagens reais entram depois, igual à foto da especialista [[dados-pessoais-pos-contrato]]):
1. **Selos & marcas** — faixa fina após credenciais: produtos/padrões certificados, associação, registro **[placeholder]**. Sem inventar marca.
2. **Mini-galeria antes/depois** — dentro de Resultados, abaixo do slider: 3 pares **ilustrativos** (crops/filtros das fotos reais) + tags "ilustrativo" sob o disclaimer existente. Conformidade §8.
3. **Ambiente & Experiência** — após a especialista (era o §7 planejado): grid editorial de tiles placeholder + copy sensorial.
4. **Instagram / galeria social** — após depoimentos: grade de tiles quadrados placeholder + `@handle` e CTA "Seguir". Handle personalizável por `?ig=`.

**Imagens:** placeholders premium agora; swap por foto real / geração higgsfield on-brand quando houver saldo. Sem novos assets neste marco.

---

Regras relacionadas: [[dados-pessoais-pos-contrato]] · [[regra-exclusao-cliente]] · estrutura do negócio em [[estrutura-venda-de-sites]].
