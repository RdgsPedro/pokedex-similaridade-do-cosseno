// Página do Pokémon (#/pokemon/25): a ficha, os status, os textos e os mais parecidos.

import { REGIOES, carregarVizinhosGeracao } from "./dados.js";
import { numero, decimal, escapar, seloDoTipo, coresDoPokemon, pokemonEmLinha } from "./ui.js";
import { estaNaEquipe, adicionarNaEquipe, removerDaEquipe } from "./equipe.js";

const NOMES_STATUS = {
  hp: "HP", ataque: "Ataque", defesa: "Defesa",
  ataque_especial: "Ataque esp.", defesa_especial: "Defesa esp.", velocidade: "Velocidade",
};
const MAIOR_STATUS = 255; // o maior status base que existe; a barra cheia vale 255

// O jeito de comparar e o filtro ficam guardados quando a pessoa pula de um Pokémon para outro.
let modo = "atributos"; // "atributos" ou "descricao"
let soDaGeracao = false;

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
          <div class="ficha-acoes"></div>
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

      <section class="parecidos" aria-labelledby="titulo-parecidos">
        <h2 id="titulo-parecidos" class="titulo-secao">Os mais parecidos com ${escapar(pokemon.nome)}</h2>
        <div class="controles">
          <div class="alternador" role="group" aria-label="Comparar por">
            <button type="button" data-modo="atributos">Atributos e tipos</button>
            <button type="button" data-modo="descricao">Descrição da Pokédex</button>
          </div>
          <label class="interruptor">
            <input type="checkbox" data-filtro="geracao"${soDaGeracao ? " checked" : ""}>
            <span>Só da ${pokemon.geracao}ª geração (${regiao.nome})</span>
          </label>
        </div>
        <p class="explicacao"></p>
        <ol class="vizinhos"></ol>
      </section>
    </div>`;

  mostrarTextos(alvo, pokemon);
  mostrarBotaoEquipe(alvo.querySelector(".ficha-acoes"), pokemon);

  // As barras começam vazias e enchem logo depois de aparecer na tela (a transição está no CSS).
  requestAnimationFrame(() => requestAnimationFrame(() => {
    alvo.querySelector(".status-lista").classList.add("cheia");
  }));

  // Os parecidos: o alternador troca o modo, e o interruptor liga o filtro de geração.
  const secao = alvo.querySelector(".parecidos");
  secao.querySelector(".alternador").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button");
    if (!botao) return;
    modo = botao.dataset.modo;
    mostrarParecidos(secao, dados, pokemon);
  });
  secao.querySelector("[data-filtro]").addEventListener("change", (evento) => {
    soDaGeracao = evento.target.checked;
    mostrarParecidos(secao, dados, pokemon);
  });
  mostrarParecidos(secao, dados, pokemon);
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

// ---------------------------------------------------------------- os parecidos

/** Desenha a lista dos parecidos no modo escolhido, com ou sem o filtro de geração. */
async function mostrarParecidos(secao, dados, pokemon) {
  for (const botao of secao.querySelectorAll("[data-modo]")) {
    botao.setAttribute("aria-pressed", String(botao.dataset.modo === modo));
  }
  secao.querySelector(".explicacao").textContent = modo === "atributos"
    ? "Compara status, tamanho e tipos. A barra mostra quanto cada parte somou no cosseno, e o desenho mostra o ângulo entre os dois vetores."
    : "Compara as palavras dos textos da Pokédex. Os cossenos ficam menores que pelos atributos, porque dois textos curtos dividem poucas palavras.";

  const lista = secao.querySelector(".vizinhos");
  let vizinhos = pokemon.vizinhos[modo]; // os 5 de todas as gerações, que já vêm no pokemon.json

  if (soDaGeracao) {
    lista.innerHTML = `<li class="nota">Carregando os parecidos da mesma geração...</li>`;
    try {
      const daGeracao = await carregarVizinhosGeracao();
      vizinhos = daGeracao.vizinhos[String(pokemon.id)][modo];
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = `<li class="nota">O filtro de geração precisa do arquivo vizinhos_geracao.json, que não carregou.</li>`;
      secao.querySelector(".interruptor").hidden = true;
      return;
    }
  }

  // Na barra do porquê, só abre espaço à esquerda do zero se alguma parcela da lista for negativa.
  const menorParcela = modo === "atributos"
    ? Math.min(0, ...vizinhos.flatMap((vizinho) => Object.values(vizinho.blocos)))
    : 0;

  lista.innerHTML = vizinhos.map((vizinho) => {
    const outro = dados.porId.get(vizinho.id);
    const porque = modo === "atributos"
      ? barraDosBlocos(vizinho.blocos, menorParcela)
      : palavrasEmComum(vizinho.palavras);
    return `
      <li class="vizinho">
        <a class="linha" href="#/pokemon/${outro.id}">${pokemonEmLinha(outro)}</a>
        <div class="vizinho-cosseno">
          ${mostrador(vizinho.cos)}
          <span>
            <span class="cosseno-valor">${decimal(vizinho.cos)}</span>
            <span class="cosseno-angulo">ângulo de ${Math.round(anguloEmGraus(vizinho.cos))}°</span>
          </span>
        </div>
        <div class="vizinho-porque">${porque}</div>
      </li>`;
  }).join("");
}

/** O ângulo entre os dois vetores: se cos(θ) = c, então θ = arccos(c). */
function anguloEmGraus(cosseno) {
  const limitado = Math.min(1, Math.max(-1, cosseno)); // arredondamentos podem passar um pouco de 1
  return (Math.acos(limitado) * 180) / Math.PI;
}

/** Um desenho pequeno com os dois vetores e o ângulo entre eles. */
function mostrador(cosseno) {
  const angulo = (anguloEmGraus(cosseno) * Math.PI) / 180;
  // O primeiro vetor fica deitado; a ponta do segundo vai para (cos θ, sen θ), virado para cima.
  const ponta = { x: 6 + 40 * Math.cos(angulo), y: 46 - 40 * Math.sin(angulo) };
  const arco = { x: 6 + 18 * Math.cos(angulo), y: 46 - 18 * Math.sin(angulo) };
  return `
    <svg class="mostrador" viewBox="0 0 52 52" aria-hidden="true">
      <path class="mostrador-base" d="M6 46 H46"/>
      <path class="mostrador-arco" d="M24 46 A18 18 0 0 0 ${arco.x.toFixed(1)} ${arco.y.toFixed(1)}"/>
      <path class="mostrador-vetor" d="M6 46 L${ponta.x.toFixed(1)} ${ponta.y.toFixed(1)}"/>
    </svg>`;
}

/**
 * A barra do "porquê" no modo atributos. As três parcelas (status, tamanho e tipos) somam o cosseno.
 * As positivas vão para a direita da linha do zero; uma parcela negativa vai para a esquerda.
 */
function barraDosBlocos(blocos, menorParcela) {
  const MENOR = menorParcela < 0 ? menorParcela - 0.02 : 0; // espaço para a parcela negativa, se houver
  const MAIOR = 1;                                          // o cosseno vai no máximo até 1
  const escala = (valor) => (Math.abs(valor) / (MAIOR - MENOR)) * 100; // em % da largura da barra
  const zero = escala(MENOR);

  let direita = zero;
  let esquerda = zero;
  const partes = ["status", "tamanho", "tipos"].map((nome) => {
    const valor = blocos[nome];
    const largura = escala(valor);
    if (valor >= 0) {
      const inicio = direita;
      direita += largura;
      return `<span class="parte parte-${nome}" style="left: ${inicio}%; width: ${largura}%"></span>`;
    }
    esquerda -= largura;
    return `<span class="parte parte-${nome} negativa" style="left: ${Math.max(0, esquerda)}%; width: ${largura}%"></span>`;
  });

  const descricao = `status ${decimal(blocos.status)}, tamanho ${decimal(blocos.tamanho)}, tipos ${decimal(blocos.tipos)}`;
  return `
    <div class="barra-blocos" role="img" aria-label="Parcelas do cosseno: ${descricao}">
      ${partes.join("")}
      ${zero > 0 ? `<span class="barra-zero" style="left: ${zero}%"></span>` : ""}
    </div>
    <ul class="legenda-blocos">
      <li><span class="amostra parte-status"></span>status ${decimal(blocos.status)}</li>
      <li><span class="amostra parte-tamanho"></span>tamanho ${decimal(blocos.tamanho)}</li>
      <li><span class="amostra parte-tipos"></span>tipos ${decimal(blocos.tipos)}</li>
    </ul>`;
}

/** As palavras em comum que mais somaram no cosseno, no modo descrição. */
function palavrasEmComum(palavras) {
  if (!palavras.length) return `<p class="nota">Nenhuma palavra em comum.</p>`;
  return `
    <ul class="palavras" aria-label="Palavras em comum que mais pesaram">
      ${palavras.map((p) => `<li><span lang="en">${escapar(p.palavra)}</span> <span class="palavra-peso">${decimal(p.contribuicao, 3)}</span></li>`).join("")}
    </ul>`;
}


// ---------------------------------------------------------------- a equipe

/** O botão de pôr ou tirar o Pokémon da equipe, com o aviso embaixo. */
function mostrarBotaoEquipe(acoes, pokemon) {
  const naEquipe = estaNaEquipe(pokemon.id);
  acoes.innerHTML = `
    <button type="button" class="botao${naEquipe ? " botao-secundario" : ""}">
      ${naEquipe ? "Tirar da equipe" : "Adicionar à equipe"}
    </button>
    <p class="aviso-equipe" role="status">${naEquipe ? `Está na <a href="#/equipe">sua equipe</a>.` : ""}</p>`;

  acoes.querySelector("button").addEventListener("click", () => {
    if (naEquipe) {
      removerDaEquipe(pokemon.id);
    } else if (adicionarNaEquipe(pokemon.id) === "cheia") {
      acoes.querySelector(".aviso-equipe").innerHTML =
        `A equipe já tem 6 Pokémon. Tire um na <a href="#/equipe">página da equipe</a> para abrir vaga.`;
      return;
    }
    mostrarBotaoEquipe(acoes, pokemon);
    acoes.querySelector("button").focus(); // o botão é desenhado de novo; o foco do teclado continua nele
  });
}