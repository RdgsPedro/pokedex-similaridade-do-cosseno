// Página do Pokémon (#/pokemon/25): a ficha, os status e os textos da Pokédex.

import { REGIOES } from "./dados.js";
import { numero, decimal, escapar, seloDoTipo, coresDoPokemon } from "./ui.js";

const NOMES_STATUS = {
    hp: "HP", ataque: "Ataque", defesa: "Defesa",
    ataque_especial: "Ataque esp.", defesa_especial: "Defesa esp.", velocidade: "Velocidade",
};
const MAIOR_STATUS = 255; // o maior status base que existe; a barra cheia vale 255

/** Mostra a página do Pokémon de número `id` dentro de `alvo`. */
export function mostrarPokemon(alvo, dados, id) {
    const pokemon = dados.porId.get(id);
    if (!pokemon) {
        alvo.innerHTML = `
      <section class="em-breve">
        <h1>Pokémon não encontrado</h1>
        <p>Não existe Pokémon com esse número. Os números vão de 1 a 1025.</p>
        <p><a href="#/">Voltar para a Pokédex</a></p>
      </section>`;
        return;
    }

    document.title = `${pokemon.nome} | Parecidex`;
    const anterior = dados.porId.get(id - 1);
    const proximo = dados.porId.get(id + 1);
    const regiao = REGIOES[pokemon.geracao - 1];

    // As cores dos tipos ficam no elemento de fora, e tudo dentro dele pode usar --cor1 e --cor2.
    alvo.innerHTML = `
    <div class="pagina-pokemon" style="${coresDoPokemon(pokemon)}">
      <nav class="passos" aria-label="Pokémon anterior e próximo">
        ${anterior ? `<a class="passo" href="#/pokemon/${anterior.id}"><span aria-hidden="true">‹</span> ${numero(anterior.id)} ${escapar(anterior.nome)}</a>` : "<span></span>"}
        ${proximo ? `<a class="passo" href="#/pokemon/${proximo.id}">${numero(proximo.id)} ${escapar(proximo.nome)} <span aria-hidden="true">›</span></a>` : ""}
      </nav>

      <article class="ficha">
        <div class="ficha-arte">
          <img src="${pokemon.imagem}" alt="Arte oficial de ${escapar(pokemon.nome)}" width="360" height="360">
        </div>
        <div class="ficha-dados">
          <p class="ficha-numero">${numero(pokemon.id)}</p>
          <h1 class="ficha-nome">${escapar(pokemon.nome)}</h1>
          <p class="ficha-categoria" lang="en">${escapar(pokemon.categoria)}</p>
          <p class="ficha-tipos">${pokemon.tipos.map(seloDoTipo).join("")}${selosEspeciais(pokemon)}</p>
          <dl class="ficha-medidas">
            <div><dt>Região</dt><dd>${regiao.nome}, ${pokemon.geracao}ª geração</dd></div>
            <div><dt>Altura</dt><dd>${decimal(pokemon.altura_m, 1)} m</dd></div>
            <div><dt>Peso</dt><dd>${decimal(pokemon.peso_kg, 1)} kg</dd></div>
          </dl>
        </div>
      </article>

      <div class="ficha-colunas">
        <section class="painel" aria-labelledby="titulo-status">
          <h2 id="titulo-status">Status</h2>
          ${barrasDeStatus(pokemon)}
        </section>
        <section class="painel textos" aria-labelledby="titulo-textos">
          <h2 id="titulo-textos">Na Pokédex</h2>
          <blockquote class="texto-pokedex" lang="en"></blockquote>
          <div class="texto-navegacao">
            <button type="button" class="botao-redondo" data-passo="-1" aria-label="Texto anterior">‹</button>
            <span class="texto-contador" aria-live="polite"></span>
            <button type="button" class="botao-redondo" data-passo="1" aria-label="Próximo texto">›</button>
          </div>
          <p class="nota">Os textos estão em inglês, como vêm da PokéAPI.</p>
        </section>
      </div>
    </div>`;

    mostrarTextos(alvo, pokemon);

    // As barras começam vazias e enchem logo depois de aparecer na tela (a transição está no CSS).
    requestAnimationFrame(() => requestAnimationFrame(() => {
        alvo.querySelector(".status-lista").classList.add("cheia");
    }));
}

/** Lendário, mítico e bebê viram selos ao lado dos tipos. */
function selosEspeciais(pokemon) {
    const selos = [];
    if (pokemon.lendario) selos.push("Lendário");
    if (pokemon.mitico) selos.push("Mítico");
    if (pokemon.bebe) selos.push("Bebê");
    return selos.map((selo) => `<span class="selo-especial">${selo}</span>`).join("");
}

/** Uma barra por status. A largura é o valor dividido por 255, em porcentagem. */
function barrasDeStatus(pokemon) {
    const linhas = Object.entries(NOMES_STATUS).map(([chave, nome]) => {
        const valor = pokemon.status[chave];
        return `
      <li>
        <span class="status-nome">${nome}</span>
        <span class="status-barra"><span class="status-preenchido" style="--largura: ${(valor / MAIOR_STATUS) * 100}%"></span></span>
        <span class="status-valor">${valor}</span>
      </li>`;
    }).join("");
    return `
    <ul class="status-lista">${linhas}</ul>
    <p class="status-total">Total <strong>${pokemon.status.total}</strong></p>`;
}

/** Os textos da Pokédex: começa pelo mais recente, e as setas passam para os outros. */
function mostrarTextos(alvo, pokemon) {
    const textos = pokemon.textos;
    let atual = textos.length - 1;
    const navegacao = alvo.querySelector(".texto-navegacao");

    const mostrar = () => {
        alvo.querySelector(".texto-pokedex").textContent = textos[atual];
        alvo.querySelector(".texto-contador").textContent = `${atual + 1} de ${textos.length}`;
    };

    navegacao.addEventListener("click", (evento) => {
        const passo = Number(evento.target.closest("button")?.dataset.passo);
        if (!passo) return;
        atual = (atual + passo + textos.length) % textos.length; // dá a volta: depois do último vem o primeiro
        mostrar();
    });

    navegacao.hidden = textos.length < 2; // com um texto só, as setas não aparecem
    mostrar();
}