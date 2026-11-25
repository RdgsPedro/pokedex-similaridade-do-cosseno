// A equipe (#/equipe): até 6 Pokémon, guardados no navegador, com a matriz de similaridade entre eles.
// Um link como #/equipe/9-130-131 mostra a equipe de outra pessoa.

import { carregarPerfil } from "./dados.js";
import { produtoEscalar, dividirPelaNorma, vetoresDeAtributos } from "./vetores.js";
import { numero, decimal, escapar, seloDoTipo, coresDoPokemon, pokemonEmLinha, spriteDe } from "./ui.js";

export const MAXIMO = 6;
const CHAVE = "parecidex-equipe"; // o nome com que a equipe fica guardada no navegador

// Se o navegador não deixar gravar (alguns modos anônimos), a equipe fica só na memória até a página fechar.
let naMemoria = [];
let semGravar = false;

// ---------------------------------------------------------------- guardar a equipe

/** Os números dos Pokémon da equipe, na ordem em que entraram. */
export function lerEquipe() {
    if (semGravar) return [...naMemoria];
    try {
        const salvos = JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
        return Array.isArray(salvos) ? salvos.filter(Number.isInteger).slice(0, MAXIMO) : [];
    } catch {
        return [...naMemoria];
    }
}

function salvarEquipe(ids) {
    naMemoria = [...ids];
    try {
        localStorage.setItem(CHAVE, JSON.stringify(ids));
    } catch {
        semGravar = true;
    }
    atualizarContador();
}

export function estaNaEquipe(id) {
    return lerEquipe().includes(id);
}

/** Tenta pôr o Pokémon na equipe. Responde "ok", "ja-esta" ou "cheia". */
export function adicionarNaEquipe(id) {
    const ids = lerEquipe();
    if (ids.includes(id)) return "ja-esta";
    if (ids.length >= MAXIMO) return "cheia";
    salvarEquipe([...ids, id]);
    return "ok";
}

export function removerDaEquipe(id) {
    salvarEquipe(lerEquipe().filter((outro) => outro !== id));
}

/** O número ao lado de "Equipe" no menu. Some quando a equipe está vazia. */
export function atualizarContador() {
    const contador = document.querySelector(".contador-equipe");
    if (!contador) return;
    const quantos = lerEquipe().length;
    contador.textContent = quantos;
    contador.hidden = quantos === 0;
}

// ---------------------------------------------------------------- a página da equipe

/** Lê "25-6-94" do link compartilhado e devolve os números que existem, sem repetir. */
export function idsDoLink(texto, dados) {
    const ids = texto.split("-").map(Number).filter((id) => dados.porId.has(id));
    return [...new Set(ids)].slice(0, MAXIMO);
}

/** Mostra a equipe. `doLink` é a lista de números quando a página veio de um link compartilhado. */
export async function mostrarEquipe(alvo, dados, doLink = null, focar = false) {
    const compartilhada = doLink !== null;
    const ids = compartilhada ? doLink : lerEquipe();
    const membros = ids.map((id) => dados.porId.get(id));
    const livres = MAXIMO - membros.length;
    document.title = `${compartilhada ? "Equipe compartilhada" : "Sua equipe"} | Parecidex`;

    alvo.innerHTML = `
    <section class="equipe" aria-labelledby="titulo-equipe">
      <h1 id="titulo-equipe" class="titulo-pagina" tabindex="-1">${compartilhada ? "Equipe compartilhada" : "Sua equipe"}</h1>
      <p class="subtitulo">${membros.length} de ${MAXIMO} Pokémon.
        ${compartilhada ? "" : "Para adicionar, abra um Pokémon e use o botão “Adicionar à equipe”."}</p>

      ${compartilhada ? `
        <div class="aviso-link">
          <p>Esta equipe veio de um link.</p>
          <button type="button" class="botao" data-acao="usar">Usar como minha equipe</button>
        </div>` : ""}

      <ol class="vagas">
        ${membros.map((pokemon) => vaga(pokemon, compartilhada)).join("")}
        ${`<li class="vaga vaga-livre"><a href="#/">Vaga livre<span>escolher na Pokédex</span></a></li>`.repeat(compartilhada ? 0 : livres)}
      </ol>

      <div class="analise" aria-live="polite">
        ${membros.length >= 2
            ? `<p class="nota">Calculando a similaridade da equipe...</p>`
            : `<p class="nota">Com 2 ou mais Pokémon aparece a matriz de similaridade da equipe.</p>`}
      </div>

      ${membros.length ? compartilhar(ids) : ""}
    </section>`;

    // Um "ouvinte" só para todos os botões da página: cada botão diz a sua ação em data-acao.
    alvo.querySelector(".equipe").addEventListener("click", (evento) => {
        const botao = evento.target.closest("button[data-acao]");
        if (!botao) return;
        const acao = botao.dataset.acao;
        if (acao === "remover") {
            removerDaEquipe(Number(botao.dataset.id));
            mostrarEquipe(alvo, dados, null, true);
        } else if (acao === "adicionar") {
            adicionarNaEquipe(Number(botao.dataset.id));
            mostrarEquipe(alvo, dados, null, true);
        } else if (acao === "usar") {
            salvarEquipe(ids);
            location.hash = "#/equipe";
        } else if (acao === "copiar") {
            copiarLink(botao);
        }
    });

    // Depois de tirar ou pôr alguém, o foco do teclado volta para o título (senão ele se perde).
    if (focar) alvo.querySelector("#titulo-equipe").focus();

    if (membros.length >= 2) {
        try {
            const perfil = await carregarPerfil();
            alvo.querySelector(".analise").innerHTML =
                analise(dados, membros, vetoresDeAtributos(perfil), compartilhada || livres === 0);
        } catch (erro) {
            console.error(erro);
            alvo.querySelector(".analise").innerHTML =
                `<p class="nota">A matriz da equipe precisa do arquivo perfil.json, que não carregou.</p>`;
        }
    }
}

/** A carta de um Pokémon da equipe, com o botão de tirar. */
function vaga(pokemon, compartilhada) {
    return `
    <li class="vaga" style="${coresDoPokemon(pokemon)}">
      <a class="vaga-pokemon" href="#/pokemon/${pokemon.id}">
        <img src="${pokemon.imagem}" alt="" width="120" height="120" loading="lazy">
        <span class="vaga-numero">${numero(pokemon.id)}</span>
        <span class="vaga-nome">${escapar(pokemon.nome)}</span>
        <span class="vaga-tipos">${pokemon.tipos.map(seloDoTipo).join("")}</span>
      </a>
      ${compartilhada ? "" : `
        <button type="button" class="botao-remover" data-acao="remover" data-id="${pokemon.id}"
          aria-label="Tirar ${escapar(pokemon.nome)} da equipe">×</button>`}
    </li>`;
}

/** A matriz de similaridade da equipe, a média e as sugestões. */
function analise(dados, membros, vetores, semBotao) {
    const u = membros.map((pokemon) => vetores.get(pokemon.id));

    // A matriz é um pedaço de S = U·Uᵀ: cada célula é o produto escalar de dois vetores de norma 1.
    const matriz = u.map((a) => u.map((b) => produtoEscalar(a, b)));

    // A média só dos pares diferentes, acima da diagonal (a diagonal é sempre 1: cada um com ele mesmo).
    const pares = [];
    for (let i = 0; i < u.length; i++) {
        for (let j = i + 1; j < u.length; j++) pares.push(matriz[i][j]);
    }
    const media = pares.reduce((soma, valor) => soma + valor, 0) / pares.length;

    // O "vetor da equipe": a soma dos vetores, dividida pela norma. Os sugeridos são os mais perto dele.
    const soma = u.reduce((total, v) => total.map((x, k) => x + v[k]));
    const daEquipe = dividirPelaNorma(soma);
    const sugestoes = [...vetores.entries()]
        .filter(([id]) => !membros.some((pokemon) => pokemon.id === id))
        .map(([id, v]) => ({ pokemon: dados.porId.get(id), cos: produtoEscalar(daEquipe, v) }))
        .sort((a, b) => b.cos - a.cos)
        .slice(0, 5);

    return `
    <div class="analise-grade">
      <section class="painel" aria-labelledby="titulo-matriz">
        <h2 id="titulo-matriz">Quanto eles se parecem</h2>
        <p class="nota">Cada número é o cosseno entre dois Pokémon da equipe, pelos atributos e tipos.
          Azul é parecido; rosa é o contrário.</p>
        <div class="matriz-rolagem">${tabela(membros, matriz)}</div>
      </section>
      <section class="painel painel-media" aria-labelledby="titulo-media">
        <h2 id="titulo-media">Variedade</h2>
        <p class="media-valor">${decimal(media)}</p>
        <p>é a média do cosseno entre os ${pares.length} pares da equipe.</p>
        <p class="nota">Perto de 1, a equipe é de Pokémon parecidos. Perto de 0 ou abaixo, ela é bem variada.</p>
      </section>
    </div>

    <section class="painel" aria-labelledby="titulo-sugestoes">
      <h2 id="titulo-sugestoes">Combinam com a equipe</h2>
      <p class="nota">Somamos os vetores da equipe e procuramos os Pokémon mais perto dessa soma.
        Numa equipe variada os tipos se anulam na soma, e quem sobra são os lendários, fortes em tudo.</p>
      <ul class="sugestoes">
        ${sugestoes.map(({ pokemon, cos }) => `
          <li class="sugestao-equipe">
            <a class="linha" href="#/pokemon/${pokemon.id}">${pokemonEmLinha(pokemon)}</a>
            <span class="sugestao-cos">${decimal(cos)}</span>
            ${semBotao ? "" : `<button type="button" class="botao botao-pequeno" data-acao="adicionar"
              data-id="${pokemon.id}" aria-label="Adicionar ${escapar(pokemon.nome)} à equipe">Adicionar</button>`}
          </li>`).join("")}
      </ul>
    </section>`;
}

/** A tabela n × n. A cor de cada célula vem do valor do cosseno. */
function tabela(membros, matriz) {
    const imagem = (pokemon) =>
        `<img src="${spriteDe(pokemon)}" alt="${escapar(pokemon.nome)}" title="${escapar(pokemon.nome)}" width="48" height="48">`;
    const cabecalho = membros.map((pokemon) => `<th scope="col">${imagem(pokemon)}</th>`).join("");
    const linhas = membros.map((pokemon, i) => `
    <tr>
      <th scope="row">${imagem(pokemon)}</th>
      ${matriz[i].map((valor) => `<td style="${corDaCelula(valor)}">${decimal(valor)}</td>`).join("")}
    </tr>`).join("");
    return `
    <table class="matriz">
      <caption class="oculto">Cosseno entre cada par de Pokémon da equipe</caption>
      <thead><tr><td></td>${cabecalho}</tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

/** Azul para cosseno positivo, rosa para negativo. Quanto mais longe de 0, mais forte a cor. */
function corDaCelula(valor) {
    const forca = Math.min(Math.abs(valor), 1) * 0.9;
    const cor = valor >= 0 ? `rgba(58, 91, 217, ${forca})` : `rgba(229, 51, 109, ${forca})`;
    const texto = forca > 0.5 ? "#FFFFFF" : "var(--tinta)";
    return `background: ${cor}; color: ${texto};`;
}

/** O link com os números da equipe, para mandar para outra pessoa. */
function compartilhar(ids) {
    const link = `${location.origin}${location.pathname}#/equipe/${ids.join("-")}`;
    return `
    <div class="compartilhar">
      <label for="link-equipe">Link para compartilhar esta equipe</label>
      <div class="compartilhar-linha">
        <input id="link-equipe" type="text" readonly value="${escapar(link)}">
        <button type="button" class="botao" data-acao="copiar">Copiar link</button>
      </div>
    </div>`;
}

async function copiarLink(botao) {
    const campo = document.querySelector("#link-equipe");
    try {
        await navigator.clipboard.writeText(campo.value);
        botao.textContent = "Link copiado";
    } catch {
        campo.select(); // sem permissão para copiar: deixa o link selecionado para a pessoa usar Ctrl+C
        botao.textContent = "Use Ctrl+C";
    }
    setTimeout(() => { botao.textContent = "Copiar link"; }, 2000);
}