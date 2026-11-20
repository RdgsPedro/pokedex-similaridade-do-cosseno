// Página inicial: a Pokédex, uma região por vez.

import { REGIOES } from "./dados.js";
import { carta } from "./ui.js";

/** Mostra a região de número `geracao` (1 = Kanto ... 9 = Paldea) dentro de `alvo`. */
export function mostrarPokedex(alvo, dados, geracao) {
    const regiao = REGIOES.find((r) => r.geracao === geracao) ?? REGIOES[0];
    const daRegiao = dados.pokemon.filter((pokemon) => pokemon.geracao === regiao.geracao);

    alvo.innerHTML = `
    <p class="intro">Escolha um Pokémon e veja quais são os mais parecidos com ele, pelos atributos ou pela descrição da Pokédex.</p>

    <nav class="regioes" aria-label="Regiões">
      ${REGIOES.map((r) => abaDaRegiao(r, r.geracao === regiao.geracao)).join("")}
    </nav>

    <section class="secao-regiao" aria-labelledby="titulo-regiao">
      <h1 id="titulo-regiao" class="titulo-regiao">${regiao.nome}</h1>
      <p class="subtitulo">${regiao.geracao}ª geração, do nº ${regiao.inicio} ao ${regiao.fim}</p>
      <div class="grade">
        ${daRegiao.map((pokemon, ordem) => carta(pokemon, ordem)).join("")}
      </div>
    </section>`;
}

/** Uma aba de região. A aba da região aberta ganha aria-current, que o CSS destaca. */
function abaDaRegiao(regiao, aberta) {
    return `
    <a class="regiao" href="#/regiao/${regiao.geracao}"${aberta ? ' aria-current="page"' : ""}>
      <span class="regiao-nome">${regiao.nome}</span>
      <span class="regiao-faixa">${regiao.inicio}–${regiao.fim}</span>
    </a>`;
}