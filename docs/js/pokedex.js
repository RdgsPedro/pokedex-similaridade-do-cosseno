// Página inicial: a Pokédex, por região, com filtro por tipo.

import { REGIOES } from "./dados.js";
import { TIPOS, carta, chaveDoTipo } from "./ui.js";

// O tipo escolhido no filtro fica guardado enquanto a pessoa navega (null = todos).
let tipoEscolhido = null;

/** Mostra a Pokédex dentro de `alvo`. `regiao` é 1 a 9 (Kanto a Paldea) ou "todas". */
export function mostrarPokedex(alvo, dados, regiao) {
  const todas = regiao === "todas";
  const regioes = todas ? REGIOES : [REGIOES.find((r) => r.geracao === regiao) ?? REGIOES[0]];

  alvo.innerHTML = `
    <p class="intro">Escolha um Pokémon e veja quais são os mais parecidos com ele, pelos atributos ou pela descrição da Pokédex.</p>

    <nav class="regioes" aria-label="Regiões">
      ${REGIOES.map((r) => abaDaRegiao(r.nome, `${r.inicio}–${r.fim}`, r.geracao, !todas && r === regioes[0])).join("")}
      ${abaDaRegiao("Todas", "1–1025", "todas", todas)}
    </nav>

    <div class="filtro-tipos" role="group" aria-label="Filtrar por tipo">
      <button type="button" class="filtro filtro-todos" data-tipo="" aria-pressed="${tipoEscolhido === null}">Todos os tipos</button>
      ${TIPOS.map((tipo) => `
        <button type="button" class="filtro tipo tipo-${chaveDoTipo(tipo)}" data-tipo="${tipo}"
          aria-pressed="${tipoEscolhido === tipo}">${tipo}</button>`).join("")}
    </div>

    <div class="secoes">
      ${todas ? `<h1 class="oculto">Todas as regiões</h1>` : ""}
      ${secoes(dados, regioes, todas)}
    </div>`;

  // Clicar num tipo filtra a grade; clicar de novo no mesmo tipo tira o filtro.
  alvo.querySelector(".filtro-tipos").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button");
    if (!botao) return;
    const tipo = botao.dataset.tipo || null;
    tipoEscolhido = tipo === tipoEscolhido ? null : tipo;
    mostrarPokedex(alvo, dados, regiao);
    alvo.querySelector(`.filtro[data-tipo="${tipoEscolhido ?? ""}"]`)?.focus();
  });
}

/** As seções da página: uma por região, cada uma com a sua grade de cartas. */
function secoes(dados, regioes, todas) {
  const partes = [];
  let ordem = 0; // conta as cartas para a animação de distribuir só nas primeiras

  for (const regiao of regioes) {
    const lista = dados.pokemon.filter((p) =>
      p.geracao === regiao.geracao && (tipoEscolhido === null || p.tipos.includes(tipoEscolhido)));
    if (todas && lista.length === 0) continue; // em "Todas", região sem nenhum do tipo nem aparece

    const quantos = tipoEscolhido ? `. Do tipo ${tipoEscolhido}: ${lista.length}` : "";
    partes.push(`
      <section class="secao-regiao" aria-labelledby="titulo-${regiao.geracao}">
        <h${todas ? 2 : 1} id="titulo-${regiao.geracao}" class="titulo-regiao">${regiao.nome}</h${todas ? 2 : 1}>
        <p class="subtitulo">${regiao.geracao}ª geração, do nº ${regiao.inicio} ao ${regiao.fim}${quantos}</p>
        ${lista.length
        ? `<div class="grade">${lista.map((p) => carta(p, ordem++)).join("")}</div>`
        : `<p class="vazio">${regiao.nome} não tem nenhum Pokémon do tipo ${tipoEscolhido}.
               <a href="#/regiao/todas">Ver em todas as regiões</a></p>`}
      </section>`);
  }
  return partes.join("");
}

/** Uma aba de região. A aba aberta ganha aria-current, que o CSS destaca. */
function abaDaRegiao(nome, faixa, destino, aberta) {
  return `
    <a class="regiao" href="#/regiao/${destino}"${aberta ? ' aria-current="page"' : ""}>
      <span class="regiao-nome">${nome}</span>
      <span class="regiao-faixa">${faixa}</span>
    </a>`;
}