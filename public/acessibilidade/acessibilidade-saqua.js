/*
 * Menu de acessibilidade da familia Saquarema (AquiTemODS, MeideSaqua,
 * ExploreSaqua, EmpregaSaqua). Copia do menu da Agenda Saquarema
 * (https://agenda-saquarema.netlify.app/): um botao so, no canto inferior
 * direito, abre o menu com tres ferramentas.
 *   - Libras: abre o VLibras, widget oficial do governo (vlibras.gov.br);
 *   - Ajustes de leitura: abre o Sienna 2.1.0 (licenca MIT, arquivo ao lado);
 *   - Ouvir esta pagina: leitura em voz alta (Web Speech API), no proprio menu.
 *
 * Arquivo unico, sem dependencias: injeta o proprio CSS e HTML. As cores vem
 * de atributos data-* do <script> que o carrega (todos opcionais):
 *   data-cor, data-cor-escura, data-suave, data-destaque, data-noite.
 * O Sienna (sienna-accessibility.umd.js) fica na mesma pasta deste arquivo.
 *
 * Os botoes proprios do VLibras e do Sienna ficam escondidos: este menu os
 * aciona. Tambem corrige o Sienna sem alterar o arquivo dele: a versao MIT nao
 * fecha com Esc, o "Fechar" nao responde ao Enter e os rotulos para leitor de
 * tela ficam em ingles.
 */
(function () {
  if (window.__acessibilidadeSaqua) return;
  window.__acessibilidadeSaqua = true;

  var script = document.currentScript;
  var dados = (script && script.dataset) || {};
  var pasta = script && script.src ? script.src.replace(/[^/]*$/, "") : "/acessibilidade/";

  // ---------------------------------------------------------------------------
  // Estilos
  // ---------------------------------------------------------------------------
  // Aceita so cor em hexadecimal (#RGB, #RRGGBB): o valor entra no CSS.
  function corValida(valor, padrao) { return /^#[0-9a-f]{3,8}$/i.test(valor || "") ? valor : padrao; }
  var CSS = [
    ":root {",
    "  --ac-cor: " + corValida(dados.cor, "#1D4E9E") + "; --ac-cor-escura: " + corValida(dados.corEscura, "#163C7A") + ";",
    "  --ac-suave: " + corValida(dados.suave, "#E3F0FA") + "; --ac-destaque: " + corValida(dados.destaque, "#F6B829") + ";",
    "  --ac-noite: " + corValida(dados.noite, "#14213D") + "; --ac-tinta: #1B2A47; --ac-tinta-2: #3A4763;",
    "  --ac-linha: #D6DFEB; --ac-linha-forte: #B4C2D6;",
    "}",
    ".acesso { position: fixed; z-index: 99990; right: 20px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font-family: inherit; line-height: 1.3; }",
    ".acesso *, .acesso *::before, .acesso *::after { box-sizing: border-box; }",
    ".acesso button, .acesso select { font-family: inherit; }",
    ".acesso[hidden], .acesso [hidden], html.acesso-oculto .acesso { display: none !important; }",
    ".acesso-botao { display: grid; place-items: center; width: 58px; height: 58px; padding: 0; border-radius: 50%; border: 3px solid #fff; background: var(--ac-cor); color: #fff; box-shadow: 0 0 0 3px var(--ac-destaque), 0 6px 18px rgb(20 33 61 / .25); cursor: pointer; }",
    ".acesso-botao:hover { background: var(--ac-cor-escura); }",
    ".acesso-botao:focus-visible { outline: 3px solid var(--ac-noite); outline-offset: 5px; border-radius: 50%; }",
    ".acesso-botao.ativo { background: var(--ac-destaque); color: var(--ac-noite); box-shadow: 0 0 0 3px var(--ac-noite), 0 6px 18px rgb(20 33 61 / .25); }",
    ".acesso-botao { transition: transform .5s cubic-bezier(.34, 1.56, .64, 1), opacity .3s ease, background-color .15s; }",
    ".acesso.recolhido .acesso-botao { transform: translateX(calc(100% - 8px)); opacity: .9; transition: transform .7s cubic-bezier(.65, 0, .35, 1), opacity .5s ease, background-color .15s; }",
    ".acesso.recolhido .acesso-botao:hover, .acesso.recolhido .acesso-botao:focus-visible { transform: none; opacity: 1; transition: transform .5s cubic-bezier(.34, 1.56, .64, 1), opacity .3s ease, background-color .15s; }",
    "@media (prefers-reduced-motion: reduce) { .acesso-botao, .acesso.recolhido .acesso-botao, .acesso.recolhido .acesso-botao:hover, .acesso.recolhido .acesso-botao:focus-visible { transition-duration: .6s, .4s, .15s !important; transition-timing-function: ease-in-out !important; } }",
    ".acesso-painel { display: grid; gap: 14px; width: min(340px, calc(100vw - 40px)); max-height: calc(100vh - 120px); overflow-y: auto; padding: 16px; border: 1px solid var(--ac-linha); border-radius: 12px; background: #fff; color: var(--ac-tinta); box-shadow: 0 12px 32px rgb(20 33 61 / .18); overscroll-behavior: contain; text-align: left; }",
    ".acesso-titulo { margin: 0; font-weight: 800; font-size: 1.25rem; line-height: 1.2; letter-spacing: -0.01em; color: var(--ac-noite); }",
    ".acesso-opcoes { display: grid; gap: 8px; }",
    ".acesso-opcao { display: grid; grid-template-columns: 40px minmax(0, 1fr); align-items: center; gap: 12px; width: 100%; padding: 10px 12px; border: 1px solid var(--ac-linha-forte); border-radius: 10px; background: #fff; color: var(--ac-noite); text-align: left; cursor: pointer; }",
    ".acesso-opcao .icone { width: 40px; height: 40px; padding: 9px; border-radius: 50%; background: var(--ac-suave); color: var(--ac-cor); }",
    ".acesso-opcao strong { display: block; font-weight: 700; font-size: 1rem; line-height: 1.25; }",
    ".acesso-opcao small { display: block; margin-top: 2px; font-size: .8125rem; line-height: 1.35; color: var(--ac-tinta-2); }",
    ".acesso-opcao:hover { border-color: var(--ac-cor); background: var(--ac-suave); }",
    ".acesso-opcao:hover .icone { background: #fff; }",
    ".acesso .icone { display: inline-flex; flex: none; }",
    ".acesso .icone svg { display: block; width: 100%; height: 100%; }",
    ".acesso button:focus-visible, .acesso select:focus-visible { outline: 3px solid var(--ac-noite); outline-offset: 2px; }",
    ".ouvir { display: grid; gap: 10px; padding-top: 14px; border-top: 1px solid var(--ac-linha); }",
    ".ouvir-titulo { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; font-size: 1rem; line-height: 1.2; color: var(--ac-noite); }",
    ".ouvir-titulo .icone { color: var(--ac-cor); }",
    ".ouvir-estado { margin: 0; font-size: .875rem; line-height: 1.4; color: var(--ac-tinta-2); }",
    ".ouvir-botoes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }",
    ".ouvir-acao { display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 8px 10px; border: 1px solid var(--ac-linha-forte); border-radius: 8px; background: #fff; color: var(--ac-noite); font-weight: 700; font-size: .9375rem; cursor: pointer; }",
    ".ouvir-acao:hover:not(:disabled) { border-color: var(--ac-cor); background: var(--ac-suave); }",
    ".ouvir-acao:disabled { opacity: .45; cursor: not-allowed; }",
    ".ouvir-velocidade { display: grid; gap: 4px; font-size: .875rem; font-weight: 700; color: var(--ac-tinta-2); }",
    ".ouvir-velocidade select { min-height: 40px; padding: 6px 10px; border: 1px solid var(--ac-linha-forte); border-radius: 8px; background: #fff; color: var(--ac-noite); font-weight: 500; font-size: .9375rem; }",
    "@media (max-width: 768px) { .acesso-botao { width: 52px; height: 52px; } }",
    ".acesso-aviso { position: fixed; z-index: 99991; left: 50%; bottom: 96px; transform: translateX(-50%); max-width: min(420px, calc(100vw - 32px)); padding: 12px 16px; border-radius: 10px; background: var(--ac-noite); color: #fff; font-size: .9375rem; box-shadow: 0 8px 24px rgb(0 0 0 / .25); }",
    /* VLibras e Sienna: os botoes proprios ficam escondidos; o menu os abre. */
    "html.acesso-oculto #vlibras-access-wrapper, html.acesso-oculto .asw-menu-btn { display: none !important; }",
    "#vlibras-access-wrapper, body .asw-menu-btn { display: none !important; }",
    "#vlibras-app-root[popover] { position: fixed; inset: 0 auto auto 0; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: transparent; overflow: visible; }",
    ".pelicula-libras[popover] { position: fixed; inset: auto; margin: 0; padding: 0; border: 0; background: transparent; overflow: visible; touch-action: none; cursor: default; }",
    /* Sienna: cores do menu trocadas pelas do site. */
    "body .asw-menu-header { background: var(--ac-cor) !important; }",
    "body .asw-menu-header svg { fill: var(--ac-cor) !important; }",
    "body .asw-card-title { color: var(--ac-cor) !important; }",
    "body .asw-plus:hover, body .asw-minus:hover { border-color: var(--ac-cor) !important; }",
    "body .asw-btn.asw-selected { border-color: var(--ac-cor) !important; background: var(--ac-suave) !important; }",
    "body .asw-btn.asw-selected svg, body .asw-btn.asw-selected span { fill: var(--ac-cor) !important; color: var(--ac-cor) !important; }",
    "body .asw-btn.asw-selected::after { background: var(--ac-cor) !important; }",
    "body .asw-menu-reset-footer-btn { background: var(--ac-cor) !important; }",
  ].join("\n");

  // ---------------------------------------------------------------------------
  // Icones (tracos no estilo Lucide, licenca ISC)
  // ---------------------------------------------------------------------------
  var ICONES = {
    acesso: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="6.8" r="1.5"/><path d="M7 9.6 12 11l5-1.4M12 11v3.4M9.4 18.2 12 14.4l2.6 3.8"/>',
    maos: '<path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
    ajustes: '<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"/>',
    ouvir: '<path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>',
    tocar: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5Z"/>',
    pausar: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    parar: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
  };
  // Icone decorativo (aria-hidden), no tamanho pedido.
  function icone(nome, tamanho) {
    return '<span class="icone" aria-hidden="true" style="width:' + tamanho + 'px;height:' + tamanho + 'px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONES[nome] + "</svg></span>";
  }

  // ---------------------------------------------------------------------------
  // Marcacao
  // ---------------------------------------------------------------------------
  var HTML =
    '<div class="acesso-painel" id="acesso-painel" role="group" aria-labelledby="acesso-titulo" hidden>' +
    '<p class="acesso-titulo" id="acesso-titulo">Acessibilidade</p>' +
    '<div class="acesso-opcoes">' +
    '<button type="button" class="acesso-opcao" id="acesso-libras" hidden>' + icone("maos", 40) +
    "<span><strong>Libras</strong><small>Tradução da página com o VLibras</small></span></button>" +
    '<button type="button" class="acesso-opcao" id="acesso-ajustes" hidden>' + icone("ajustes", 40) +
    "<span><strong>Ajustes de leitura</strong><small>Tamanho da fonte, contraste, links e animações</small></span></button>" +
    "</div>" +
    '<section class="ouvir" id="ouvir" aria-labelledby="ouvir-titulo" hidden>' +
    '<p class="ouvir-titulo" id="ouvir-titulo">' + icone("ouvir", 20) + " Ouvir esta página</p>" +
    '<p class="ouvir-estado" id="ouvir-estado" aria-live="polite">Lê em voz alta o conteúdo principal, sem menus nem rodapé.</p>' +
    '<div class="ouvir-botoes">' +
    '<button type="button" class="ouvir-acao" id="ouvir-ler">' + icone("tocar", 18) + " Ouvir</button>" +
    '<button type="button" class="ouvir-acao" id="ouvir-pausar" disabled>' + icone("pausar", 18) + " Pausar</button>" +
    '<button type="button" class="ouvir-acao" id="ouvir-continuar" disabled>' + icone("tocar", 18) + " Continuar</button>" +
    '<button type="button" class="ouvir-acao" id="ouvir-parar" disabled>' + icone("parar", 18) + " Parar</button>" +
    "</div>" +
    '<label class="ouvir-velocidade" for="ouvir-velocidade">Velocidade' +
    '<select id="ouvir-velocidade"><option value="0.75">0,75× (mais devagar)</option><option value="1" selected>1× (normal)</option><option value="1.25">1,25×</option><option value="1.5">1,5× (mais rápido)</option></select></label>' +
    "</section></div>" +
    '<button type="button" class="acesso-botao" id="acesso-botao" aria-expanded="false" aria-controls="acesso-painel" aria-label="Acessibilidade: Libras, ajustes de leitura e ouvir a página">' + icone("acesso", 30) + "</button>";

  var estilo = document.createElement("style");
  estilo.id = "acesso-estilo";
  estilo.textContent = CSS;
  document.head.appendChild(estilo);

  var caixa = document.createElement("div");
  caixa.className = "acesso";
  caixa.id = "acesso";
  caixa.hidden = true;
  caixa.innerHTML = HTML;
  document.body.appendChild(caixa);

  // Atalho: pega um elemento da pagina pelo id.
  var $ = function (id) { return document.getElementById(id); };
  var botao = $("acesso-botao");
  var painel = $("acesso-painel");
  var opcaoLibras = $("acesso-libras");
  var opcaoAjustes = $("acesso-ajustes");
  var secaoOuvir = $("ouvir");

  // Aviso curto flutuante (substitui o toast do site de origem).
  function avisar(mensagem) {
    var aviso = document.createElement("div");
    aviso.className = "acesso-aviso";
    aviso.setAttribute("role", "status");
    aviso.textContent = mensagem;
    document.body.appendChild(aviso);
    setTimeout(function () { aviso.remove(); }, 5000);
  }

  // Carrega um script externo (cada ferramenta e opcional: falha so a esconde).
  function carregar(src, aoCarregar, atributos) {
    var tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    Object.keys(atributos || {}).forEach(function (nome) { tag.setAttribute(nome, atributos[nome]); });
    if (aoCarregar) tag.onload = aoCarregar;
    document.body.appendChild(tag);
  }

  // ---------------------------------------------------------------------------
  // VLibras
  // ---------------------------------------------------------------------------
  function iniciarLibras() {
    if (!window.VLibras) return;
    new window.VLibras.Widget({ rootPath: "https://vlibras.gov.br/app", position: "R" });
    opcaoLibras.hidden = false;
    mostrarBotao();
  }

  // window.VLibrasWidget.open() e a funcao do proprio botao do VLibras.
  function abrirLibras() {
    var widget = window.VLibrasWidget;
    if (widget && widget.open) widget.open();
    avisarQueArrasta();
  }

  // Em tela de toque nao ha cursor de "mover": na primeira vez, um aviso
  // conta que o avatar sai da frente arrastando pela barra azul.
  function avisarQueArrasta() {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    try {
      if (localStorage.getItem("acesso-dica-libras")) return;
      localStorage.setItem("acesso-dica-libras", "1");
    } catch (erro) { /* sem armazenamento: o aviso aparece de novo da proxima vez */ }
    setTimeout(function () { avisar("Dica: arraste o avatar pela barra azul para tirá-lo da frente."); }, 1500);
  }

  // Janela aberta (<dialog> modal): o navegador a poe acima de tudo e trava o
  // que esta fora dela, inclusive o avatar do VLibras. Enquanto ela esta aberta:
  //   1. a raiz do avatar vira popover e sobe para a mesma camada;
  //   2. uma pelicula transparente, dentro da janela, cobre o painel do avatar
  //      e repassa os gestos ao VLibras (arrastar pelas barras; tocar nos botoes).
  function raizDoAvatar() { return document.getElementById("vlibras-app-root"); }
  function painelDoAvatar() {
    var raiz = raizDoAvatar();
    return raiz && raiz.shadowRoot && raiz.shadowRoot.getElementById("vlibras-app");
  }

  function dentro(elemento, x, y) {
    var retangulo = elemento.getBoundingClientRect();
    return retangulo.width > 0 && x >= retangulo.left && x <= retangulo.right && y >= retangulo.top && y <= retangulo.bottom;
  }

  function alcaDeArraste(painelAvatar, x, y) {
    return [].filter.call(painelAvatar.querySelectorAll(".touch-none"), function (alca) { return dentro(alca, x, y); })[0] || null;
  }

  // O botao do VLibras sob o dedo: o menor que contem o ponto.
  function botaoDoAvatar(painelAvatar, x, y) {
    var botoes = [].filter.call(painelAvatar.querySelectorAll("button, [role='button'], a[href], input, select"), function (candidato) {
      return dentro(candidato, x, y);
    });
    botoes.sort(function (anterior, posterior) {
      var caixaAnterior = anterior.getBoundingClientRect();
      var caixaPosterior = posterior.getBoundingClientRect();
      return caixaAnterior.width * caixaAnterior.height - caixaPosterior.width * caixaPosterior.height;
    });
    return botoes[0] || null;
  }

  var pelicula = null;
  var acompanhamento = 0;

  // A pelicula segue o painel a cada quadro (ele muda de lugar ao ser arrastado).
  function acompanharPainel() {
    var painelAvatar = painelDoAvatar();
    if (!pelicula || !painelAvatar) return;
    var retangulo = painelAvatar.getBoundingClientRect();
    pelicula.style.left = retangulo.left + "px";
    pelicula.style.top = retangulo.top + "px";
    pelicula.style.width = retangulo.width + "px";
    pelicula.style.height = retangulo.height + "px";
    acompanhamento = requestAnimationFrame(acompanharPainel);
  }

  function criarPelicula(janela) {
    pelicula = document.createElement("div");
    pelicula.className = "pelicula-libras";
    pelicula.setAttribute("popover", "manual");
    pelicula.setAttribute("aria-hidden", "true");
    janela.appendChild(pelicula);
    pelicula.showPopover();

    var inicio = null;
    pelicula.addEventListener("pointerdown", function (toque) {
      var painelAvatar = painelDoAvatar();
      if (!painelAvatar) return;
      toque.preventDefault();
      inicio = { x: toque.clientX, y: toque.clientY, arrastou: false };
      var alca = botaoDoAvatar(painelAvatar, toque.clientX, toque.clientY) ? null : alcaDeArraste(painelAvatar, toque.clientX, toque.clientY);
      if (!alca) return;
      pelicula.setPointerCapture(toque.pointerId);
      alca.dispatchEvent(new PointerEvent("pointerdown", {
        bubbles: true, composed: true, cancelable: true, clientX: toque.clientX, clientY: toque.clientY,
        pointerId: toque.pointerId, pointerType: toque.pointerType, isPrimary: true, button: 0, buttons: 1,
      }));
    });
    pelicula.addEventListener("pointermove", function (toque) {
      if (inicio && Math.abs(toque.clientX - inicio.x) + Math.abs(toque.clientY - inicio.y) > 6) inicio.arrastou = true;
    });
    pelicula.addEventListener("pointerup", function (toque) {
      var painelAvatar = painelDoAvatar();
      if (inicio && !inicio.arrastou && painelAvatar) {
        var alvo = botaoDoAvatar(painelAvatar, toque.clientX, toque.clientY);
        if (alvo) alvo.click();
      }
      inicio = null;
    });
    pelicula.addEventListener("click", function (clique) { clique.stopPropagation(); });

    acompanharPainel();
  }

  function removerPelicula() {
    cancelAnimationFrame(acompanhamento);
    if (pelicula) { if (pelicula.matches(":popover-open")) pelicula.hidePopover(); pelicula.remove(); }
    pelicula = null;
  }

  function levarAvatarParaJanela(janela) {
    var raiz = raizDoAvatar();
    if (!raiz || raiz.dataset.active !== "true" || !raiz.showPopover || raiz.hasAttribute("popover")) return;
    raiz.setAttribute("popover", "manual");
    raiz.showPopover();
    criarPelicula(janela); // depois do avatar: fica por cima dele
  }

  function devolverAvatar() {
    removerPelicula();
    var raiz = raizDoAvatar();
    if (!raiz || !raiz.hasAttribute("popover")) return;
    if (raiz.matches(":popover-open")) raiz.hidePopover();
    raiz.removeAttribute("popover");
  }

  function janelaAberta() { return [].filter.call(document.querySelectorAll("dialog"), function (janela) { return janela.open; })[0] || null; }

  // <dialog> aparecem e somem durante a navegacao: observa o <body> e liga cada um uma vez.
  var janelasObservadas = new WeakSet();
  function observarJanelas() {
    document.querySelectorAll("dialog").forEach(function (janela) {
      if (janelasObservadas.has(janela)) return;
      janelasObservadas.add(janela);
      new MutationObserver(function () {
        if (janela.open) levarAvatarParaJanela(janela); else devolverAvatar();
      }).observe(janela, { attributes: true, attributeFilter: ["open"] });
    });
  }
  observarJanelas();
  new MutationObserver(observarJanelas).observe(document.body, { childList: true, subtree: true });

  // O avatar pode ser fechado (pela pelicula) ou aberto com a janela ja aberta.
  var observadorDoAvatar = new MutationObserver(function () {
    var raiz = raizDoAvatar();
    if (!raiz) return;
    var janela = janelaAberta();
    if (raiz.dataset.active === "true" && janela) levarAvatarParaJanela(janela);
    else if (raiz.dataset.active !== "true") devolverAvatar();
  });
  // A raiz do avatar so aparece quando o VLibras abre pela primeira vez.
  function observarQuandoSurgir() {
    var raiz = raizDoAvatar();
    if (raiz) { observadorDoAvatar.observe(raiz, { attributes: true, attributeFilter: ["data-active"] }); return; }
    setTimeout(observarQuandoSurgir, 500);
  }

  // ---------------------------------------------------------------------------
  // Sienna
  // ---------------------------------------------------------------------------
  function botaoDoSienna() { return document.querySelector(".asw-menu-btn"); }
  function menuDoSienna() { return document.querySelector(".asw-menu"); }

  // O menu fica dentro de uma caixa que o Sienna mostra e esconde com display.
  function siennaAberto() {
    var menu = menuDoSienna();
    return !!menu && menu.parentElement.style.display !== "none";
  }

  // Rotulos em portugues: a primeira linha do texto que ja aparece traduzido.
  function traduzirRotulos() {
    var menu = menuDoSienna();
    if (!menu) return;
    var fechar = menu.querySelector(".asw-menu-close");
    if (fechar) { fechar.setAttribute("aria-label", "Fechar os ajustes de leitura"); fechar.title = "Fechar"; }
    var restaurar = menu.querySelector(".asw-menu-reset");
    if (restaurar) { restaurar.setAttribute("aria-label", "Restaurar as configurações"); restaurar.title = "Restaurar as configurações"; }
    menu.querySelectorAll("[aria-label]").forEach(function (elemento) {
      if (elemento === fechar || elemento === restaurar) return;
      if (elemento.tagName === "SELECT") { elemento.setAttribute("aria-label", "Idioma do menu"); return; }
      var texto = (elemento.innerText || "").trim().split("\n")[0];
      if (texto) elemento.setAttribute("aria-label", texto);
    });
  }

  // Abre o menu do Sienna pelo botao escondido dele e leva o foco para dentro.
  function abrirAjustes() {
    var botaoSienna = botaoDoSienna();
    if (!botaoSienna) return;
    botaoSienna.click();
    setTimeout(function () {
      if (!siennaAberto()) return;
      traduzirRotulos();
      var fechar = menuDoSienna().querySelector(".asw-menu-close");
      if (fechar) fechar.focus();
    }, 60);
  }

  // Ao fechar o Sienna, o foco volta para o botao do menu de acessibilidade.
  function fecharAjustes() {
    var fechar = menuDoSienna() && menuDoSienna().querySelector(".asw-menu-close");
    if (fechar) fechar.click();
    botao.focus();
  }

  // Tamanho do texto: o Sienna 2.1.0, ao iniciar e a cada ajuste de fonte, grava
  // o tamanho de todo titulo, paragrafo, link e span fixo em pixels no elemento,
  // mesmo em 100%. Em 100% (ninguem pediu fonte maior) os tamanhos voltam a ser
  // os do CSS, para textos fluidos (clamp, vw) nao ficarem presos num valor.
  function escalaDaFonte() {
    try {
      var salvo = JSON.parse(localStorage.getItem("asw-user-settings") || "{}");
      return Number(salvo && salvo.states && salvo.states.fontSize) || 1;
    } catch (erro) { return 1; }
  }

  function liberarTamanhos() {
    if (escalaDaFonte() !== 1) return;
    document.querySelectorAll("[data-asw-org-font-size]").forEach(function (elemento) {
      elemento.style.removeProperty("font-size");
      elemento.removeAttribute("data-asw-org-font-size");
    });
  }

  document.addEventListener("click", function (clique) {
    if (clique.target.closest && clique.target.closest(".asw-menu")) setTimeout(liberarTamanhos, 50);
  });

  // O Sienna termina de carregar depois da pagina: a opcao aparece quando ele surgir.
  function siennaPronto() {
    if (!botaoDoSienna()) return false;
    opcaoAjustes.hidden = false;
    mostrarBotao();
    liberarTamanhos();
    return true;
  }
  function aguardarSienna() {
    if (siennaPronto()) return;
    var observador = new MutationObserver(function () { if (siennaPronto()) observador.disconnect(); });
    observador.observe(document.body, { childList: true });
  }

  // ---------------------------------------------------------------------------
  // Menu: abre no botao redondo; fecha com Esc, clique fora ou ao escolher.
  // ---------------------------------------------------------------------------
  function abrirMenu(abrir) {
    painel.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
    recolherDepois(abrir ? 0 : 3000);
    if (!abrir) return;
    var primeiro = painel.querySelector(".acesso-opcao:not([hidden]), .ouvir button:not(:disabled)");
    if (primeiro) primeiro.focus();
  }

  botao.addEventListener("click", function () { abrirMenu(painel.hidden); });
  opcaoLibras.addEventListener("click", function () { abrirMenu(false); abrirLibras(); });
  opcaoAjustes.addEventListener("click", function () { abrirMenu(false); abrirAjustes(); });

  document.addEventListener("click", function (clique) {
    if (!painel.hidden && !caixa.contains(clique.target)) abrirMenu(false);
  });

  document.addEventListener("keydown", function (tecla) {
    // Esc fecha o menu de acessibilidade e devolve o foco ao botao.
    if (tecla.key === "Escape" && !painel.hidden) { tecla.preventDefault(); abrirMenu(false); botao.focus(); return; }
    if (!siennaAberto()) return;
    // Sienna aberto: Esc fecha; Enter e espaco acionam os "botoes" feitos com <div role="button">.
    if (tecla.key === "Escape") { tecla.preventDefault(); fecharAjustes(); return; }
    var alvo = tecla.target;
    if ((tecla.key === "Enter" || tecla.key === " ") && alvo.getAttribute && alvo.getAttribute("role") === "button" &&
      alvo.tagName !== "BUTTON" && alvo.tagName !== "A" && menuDoSienna().contains(alvo)) {
      tecla.preventDefault();
      if (alvo.classList.contains("asw-menu-close")) fecharAjustes(); else alvo.click();
    }
  }, true);

  // O botao so aparece se ao menos uma ferramenta estiver disponivel.
  function mostrarBotao() { caixa.hidden = false; }

  // Botao recolhido: alguns segundos depois de abrir o site (e depois de fechar
  // o menu), ele desliza para a borda e deixa so uma ponta a mostra. Com o menu
  // aberto ou com a leitura em voz alta ativa, fica inteiro.
  var temporizadorRecolher = 0;
  function recolherDepois(tempo) {
    clearTimeout(temporizadorRecolher);
    caixa.classList.remove("recolhido");
    if (!tempo) return;
    temporizadorRecolher = setTimeout(function () {
      if (painel.hidden && !botao.classList.contains("ativo")) caixa.classList.add("recolhido");
    }, tempo);
  }
  recolherDepois(4000);

  // ---------------------------------------------------------------------------
  // Ouvir esta pagina: Web Speech API (speechSynthesis), pt-BR, sem dependencias.
  //   - o texto vem do <main> visivel, sem o que esta escondido dos leitores de tela;
  //   - e lido em trechos curtos, porque o Chrome corta falas longas;
  //   - "Pausar" interrompe e guarda o trecho; "Continuar" retoma desse trecho
  //     (o pause() nativo nao funciona no Chrome do Android).
  // ---------------------------------------------------------------------------
  function iniciarOuvir() {
    if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) return;

    var sintese = window.speechSynthesis;
    var estadoTexto = $("ouvir-estado");
    var botaoLer = $("ouvir-ler");
    var botaoPausar = $("ouvir-pausar");
    var botaoContinuar = $("ouvir-continuar");
    var botaoParar = $("ouvir-parar");
    var seletorVelocidade = $("ouvir-velocidade");

    var IGNORAR = ["[aria-hidden='true']", "[hidden]", "script", "style", "template", "dialog", "#acesso", ".asw-menu", "[data-acesso-ignorar]"].join(",");
    var TAMANHO_TRECHO = 220; // caracteres por fala

    var trechos = [];
    var posicao = 0;
    var situacao = "parado"; // parado | lendo | pausado
    var rodada = 0; // muda a cada cancelamento: ignora o "fim" de falas canceladas
    var voz = null;

    // Voz pt-BR, se o sistema tiver; as vozes chegam depois em alguns navegadores.
    function escolherVoz() {
      var vozes = sintese.getVoices();
      voz = vozes.filter(function (candidata) { return /^pt[-_]BR$/i.test(candidata.lang); })[0] ||
        vozes.filter(function (candidata) { return /^pt/i.test(candidata.lang); })[0] || null;
    }
    escolherVoz();
    if (sintese.addEventListener) sintese.addEventListener("voiceschanged", escolherVoz);

    // O <main> visivel; sem ele, a pagina inteira.
    function conteudoPrincipal() {
      return [].filter.call(document.querySelectorAll("main"), function (principal) { return !principal.closest("[hidden]"); })[0] || document.body;
    }

    // Junta o texto visivel do <main> em frases, pulando o que nao se le.
    function textoDaPagina() {
      var percorrer = document.createTreeWalker(conteudoPrincipal(), NodeFilter.SHOW_TEXT);
      var blocos = [];
      var blocoAtual = null;
      var paiAnterior = null;
      var noDeTexto;
      while ((noDeTexto = percorrer.nextNode())) {
        var pai = noDeTexto.parentElement;
        var conteudo = noDeTexto.nodeValue.replace(/\s+/g, " ");
        if (!conteudo.trim() || !pai || pai.closest(IGNORAR)) continue;
        // Um bloco novo (titulo, paragrafo, item de lista...) vira uma frase nova.
        var bloco = pai.closest("h1, h2, h3, h4, p, li, dt, dd, button, a, td, th, small, strong") || pai;
        if (bloco !== blocoAtual) { blocos.push(""); blocoAtual = bloco; }
        // No mesmo bloco, textos de elementos diferentes ganham uma virgula, para a voz nao emendar as palavras.
        else if (pai !== paiAnterior && !/[\s,.;:]$/.test(blocos[blocos.length - 1])) blocos[blocos.length - 1] += ", ";
        blocos[blocos.length - 1] += conteudo;
        paiAnterior = pai;
      }
      return blocos.map(function (bloco) { return bloco.trim(); }).filter(Boolean).map(function (bloco) {
        return /[.!?:…]$/.test(bloco) ? bloco : bloco + ".";
      }).join(" ");
    }

    // Corta o texto em trechos curtos (o Chrome corta falas longas).
    function dividirEmTrechos(texto) {
      var frases = texto.match(/[^.!?…]+[.!?…]*\s*/g) || [];
      var lista = [];
      var atual = "";
      frases.forEach(function (frase) {
        if ((atual + frase).length > TAMANHO_TRECHO && atual) { lista.push(atual.trim()); atual = ""; }
        atual += frase;
      });
      if (atual.trim()) lista.push(atual.trim());
      return lista;
    }

    function falar() {
      if (posicao >= trechos.length) { parar("Leitura concluída."); return; }
      var minhaRodada = rodada;
      var fala = new SpeechSynthesisUtterance(trechos[posicao]);
      fala.lang = "pt-BR";
      if (voz) fala.voice = voz;
      fala.rate = Number(seletorVelocidade.value) || 1;
      fala.onend = function () {
        if (minhaRodada !== rodada || situacao !== "lendo") return;
        posicao++;
        falar();
      };
      fala.onerror = function (erro) {
        if (minhaRodada !== rodada || erro.error === "interrupted" || erro.error === "canceled") return;
        parar("Não foi possível ler a página neste navegador.");
      };
      mostrar("lendo", "Lendo… trecho " + (posicao + 1) + " de " + trechos.length + ".");
      sintese.speak(fala);
    }

    // Cancela a fala em andamento sem disparar o proximo trecho.
    function silenciar() {
      rodada++;
      sintese.cancel();
    }

    function ler() {
      silenciar();
      trechos = dividirEmTrechos(textoDaPagina());
      posicao = 0;
      if (!trechos.length) { parar("Não há texto para ler nesta página."); return; }
      falar();
    }

    function pausar() {
      if (situacao !== "lendo") return;
      silenciar();
      mostrar("pausado", "Pausado no trecho " + (posicao + 1) + " de " + trechos.length + ".");
    }

    function continuar() {
      if (situacao !== "pausado") return;
      falar();
    }

    function parar(mensagem) {
      silenciar();
      posicao = 0;
      mostrar("parado", mensagem || "Leitura parada.");
    }

    // Botoes de acordo com a situacao; se o botao em foco fica desativado, o foco passa para o que faz sentido.
    function mostrar(novaSituacao, mensagem) {
      situacao = novaSituacao;
      estadoTexto.textContent = mensagem;
      var focado = document.activeElement;
      botaoLer.disabled = situacao !== "parado";
      botaoPausar.disabled = situacao !== "lendo";
      botaoContinuar.disabled = situacao !== "pausado";
      botaoParar.disabled = situacao === "parado";
      botao.classList.toggle("ativo", situacao !== "parado");
      if (focado && focado.disabled && secaoOuvir.contains(focado)) {
        ({ parado: botaoLer, lendo: botaoPausar, pausado: botaoContinuar })[situacao].focus();
      }
    }

    botaoLer.addEventListener("click", ler);
    botaoPausar.addEventListener("click", pausar);
    botaoContinuar.addEventListener("click", continuar);
    botaoParar.addEventListener("click", function () { parar(); });

    // Nova velocidade vale na hora: recomeca o trecho atual.
    seletorVelocidade.addEventListener("change", function () {
      if (situacao === "lendo") { silenciar(); falar(); }
    });

    // Ao sair da pagina, a leitura para.
    window.addEventListener("pagehide", function () { silenciar(); });

    // Navegacao dentro do app (sem recarregar): a leitura da tela anterior para.
    var principal = document.querySelector("main");
    if (principal) {
      new MutationObserver(function () {
        if (situacao !== "parado") parar("A tela mudou. Use “Ouvir” para ler a nova tela.");
      }).observe(principal, { childList: true });
    }

    secaoOuvir.hidden = false;
    mostrarBotao();
  }
  iniciarOuvir();

  // ---------------------------------------------------------------------------
  // Carrega as duas ferramentas externas
  // ---------------------------------------------------------------------------
  carregar(pasta + "sienna-accessibility.umd.js", aguardarSienna, { "data-asw-lang": "pt" });
  carregar("https://vlibras.gov.br/app/vlibras-plugin.js", function () { iniciarLibras(); observarQuandoSurgir(); });
})();
