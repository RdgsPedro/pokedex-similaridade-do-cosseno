// "Como funciona" (#/como-funciona): a matemática do site explicada, com as contas feitas na hora com os dados.

import { REGIOES, carregarPerfil } from "./dados.js";
import { produtoEscalar, dividirPelaNorma, vetoresDeAtributos, BLOCOS } from "./vetores.js";
import { TIPOS, numero, decimal, escapar } from "./ui.js";

const STATUS = ["hp", "ataque", "defesa", "ataque_especial", "defesa_especial", "velocidade"];
const COLUNAS = {
  status: ["HP", "Ataque", "Defesa", "Ataque esp.", "Defesa esp.", "Velocidade"],
  tamanho: ["Altura", "Peso"],
  tipos: TIPOS,
};
const NOME_DO_BLOCO = { status: "Status", tamanho: "Tamanho", tipos: "Tipos" };

let escolhidos = [25, 100]; // a conta começa com Pikachu e Voltorb, e guarda a última escolha

/** Mostra a página "Como funciona" dentro de `alvo`. */
export function mostrarComoFunciona(alvo, dados) {
  document.title = "Como funciona | Parecidex";
  const pikachu = dados.porId.get(25);
  const parecidoPelaDescricao = pikachu.vizinhos.descricao[0];
  const pachirisu = dados.porId.get(parecidoPelaDescricao.id);
  const charizard = dados.porId.get(6);
  const pesos = dados.pokemon.map((pokemon) => pokemon.peso_kg);
  const totalDeTextos = dados.pokemon.reduce((soma, pokemon) => soma + pokemon.textos.length, 0);
  const z = zScoreDoHp(dados, pikachu);

  alvo.innerHTML = `
    <article class="como">
      <h1 class="titulo-pagina">Como funciona</h1>
      <p class="subtitulo">Cada Pokémon vira um vetor, uma lista de números. Dois Pokémon são parecidos quando os
        vetores deles apontam quase para o mesmo lado, e quem mede isso é o cosseno do ângulo entre eles.</p>

      <section class="painel" aria-labelledby="titulo-cosseno">
        <h2 id="titulo-cosseno">O cosseno do ângulo</h2>
        <p>Um vetor dá para desenhar como uma seta. Quanto menor o ângulo entre duas setas, mais elas apontam para o
          mesmo lado, e mais o cosseno chega perto de 1.</p>
        <div class="angulos">
          ${figuraDoAngulo(0, "1", "mesma direção")}
          ${figuraDoAngulo(90, "0", "nada em comum")}
          ${figuraDoAngulo(180, "−1", "direções opostas")}
        </div>
        <div class="formula">
          <math display="block">
            <mi>cos</mi><mo>&#x2061;</mo><mi>θ</mi><mo>=</mo>
            <mfrac>
              <mrow><mi>a</mi><mo>·</mo><mi>b</mi></mrow>
              <mrow><mo>‖</mo><mi>a</mi><mo>‖</mo><mspace width="0.2em"></mspace><mo>‖</mo><mi>b</mi><mo>‖</mo></mrow>
            </mfrac>
          </math>
        </div>
        <p>O <strong>produto escalar</strong> a · b multiplica os números da mesma posição e soma tudo:
          a₁b₁ + a₂b₂ + … A <strong>norma</strong> ‖a‖ = √(a · a) é o comprimento da seta.</p>
        <p>O comprimento não importa, só a direção. Por isso cada vetor é dividido pela sua norma e fica com
          comprimento 1. Aí o cosseno é só o produto escalar. Com os vetores numa matriz U, uma linha por Pokémon,
          a conta <strong>S = U·Uᵀ</strong> dá o cosseno de todos os pares de uma vez: são
          ${dados.pokemon.length.toLocaleString("pt-BR")} × ${dados.pokemon.length.toLocaleString("pt-BR")} =
          ${(dados.pokemon.length ** 2).toLocaleString("pt-BR")} números.</p>
      </section>

      <section class="painel" aria-labelledby="titulo-atributos">
        <h2 id="titulo-atributos">Pelos atributos e tipos</h2>
        <p>Cada Pokémon vira um vetor de 26 números, em 3 blocos. Cada bloco vale um terço da conta.</p>
        <div class="rolagem">
          <table class="tabela tabela-blocos">
            <thead><tr><th scope="col">Bloco</th><th scope="col">Números</th><th scope="col">Como é feito</th></tr></thead>
            <tbody>
              <tr><th scope="row"><span class="amostra parte-status"></span>Status</th>
                <td>6: HP, Ataque, Defesa, Ataque esp., Defesa esp. e Velocidade</td><td>z-score de cada um</td></tr>
              <tr><th scope="row"><span class="amostra parte-tamanho"></span>Tamanho</th>
                <td>2: altura e peso</td><td>logaritmo, depois z-score</td></tr>
              <tr><th scope="row"><span class="amostra parte-tipos"></span>Tipos</th>
                <td>18, um por tipo</td><td>1 nos tipos do Pokémon e 0 no resto, dividido pela norma</td></tr>
            </tbody>
          </table>
        </div>
        <div class="formula">
          <math display="block">
            <mi>z</mi><mo>=</mo>
            <mfrac><mrow><mi>x</mi><mo>−</mo><mtext>média</mtext></mrow><mtext>desvio padrão</mtext></mfrac>
          </math>
        </div>
        <p>O z-score diz quanto o Pokémon está acima ou abaixo da média. A média de HP dos ${dados.pokemon.length} é
          ${decimal(z.media, 1)}, e o desvio padrão é ${decimal(z.desvio, 1)}. O Pikachu tem ${z.valor} de HP, então
          z = (${z.valor} − ${decimal(z.media, 1)}) ÷ ${decimal(z.desvio, 1)} = <strong>${sinal(decimal(z.z))}</strong>:
          bem abaixo da média.</p>
        <p class="medianas">Sem o z-score, todos os status são positivos e os vetores apontam quase todos para o mesmo
          lado. <span class="calculando">Calculando o cosseno entre todos os pares...</span></p>
        <p>No tamanho entra o logaritmo porque o peso vai de ${decimal(Math.min(...pesos), 1)} kg a
          ${decimal(Math.max(...pesos), 1)} kg: sem ele, meia dúzia de gigantes dominaria a coluna.</p>
        <p>Os pesos dos blocos: um bloco com n colunas é multiplicado por √(⅓ ÷ n). Assim os 6 números de status não
          valem três vezes mais que os 2 de tamanho. Depois o vetor é dividido pela norma:</p>
        <div class="formula formula-dupla">
          <math display="block">
            <mi>x</mi><mo>=</mo>
            <mrow>
              <mo>[</mo>
              <mtable displaystyle="true">
                <mtr><mtd><mtext>status</mtext><mo>·</mo><msqrt><mfrac><mn>1</mn><mn>18</mn></mfrac></msqrt></mtd></mtr>
                <mtr><mtd><mtext>tamanho</mtext><mo>·</mo><msqrt><mfrac><mn>1</mn><mn>6</mn></mfrac></msqrt></mtd></mtr>
                <mtr><mtd><mtext>tipos</mtext><mo>·</mo><msqrt><mfrac><mn>1</mn><mn>3</mn></mfrac></msqrt></mtd></mtr>
              </mtable>
              <mo>]</mo>
            </mrow>
          </math>
          <math display="block">
            <mi>u</mi><mo>=</mo><mfrac><mi>x</mi><mrow><mo>‖</mo><mi>x</mi><mo>‖</mo></mrow></mfrac>
          </math>
        </div>
      </section>

      <section class="painel conta" aria-labelledby="titulo-conta">
        <h2 id="titulo-conta">Faça a conta</h2>
        <p>Escolha dois Pokémon e veja os 26 números de cada um, já com os pesos e divididos pela norma. O cosseno é
          a soma dos produtos, e cada bloco é uma parcela dessa soma.</p>
        <div class="conta-escolha">
          <label for="conta-a">Primeiro Pokémon</label>
          <select id="conta-a">${opcoes(dados, escolhidos[0])}</select>
          <label for="conta-b">Segundo Pokémon</label>
          <select id="conta-b">${opcoes(dados, escolhidos[1])}</select>
        </div>
        <div class="conta-resultado" aria-live="polite">
          <p class="nota">Carregando os vetores...</p>
        </div>
      </section>

      <section class="painel" aria-labelledby="titulo-descricao">
        <h2 id="titulo-descricao">Pela descrição da Pokédex</h2>
        <p>Aqui o vetor tem uma posição para cada palavra: são 5604 palavras. O texto de cada Pokémon é a categoria
          dele (como "${escapar(pikachu.categoria)}") mais todos os textos da Pokédex. As palavras ficam em minúsculas, e
          saem as muito comuns do inglês (the, and, of...), as de menos de 3 letras e as que só aparecem em um
          Pokémon.</p>
        <p>O peso de cada palavra é o TF-IDF:</p>
        <div class="formula">
          <math display="block">
            <mtext>tf</mtext><mo>=</mo><mn>1</mn><mo>+</mo><mi>ln</mi><mo>&#x2061;</mo><mi>C</mi>
            <mspace width="1.5em"></mspace>
            <mtext>idf</mtext><mo>=</mo><mi>ln</mi><mo>&#x2061;</mo>
            <mfrac><mrow><mn>1</mn><mo>+</mo><mi>n</mi></mrow><mrow><mn>1</mn><mo>+</mo><mtext>df</mtext></mrow></mfrac>
            <mo>+</mo><mn>1</mn>
            <mspace width="1.5em"></mspace>
            <mtext>peso</mtext><mo>=</mo><mtext>tf</mtext><mo>·</mo><mtext>idf</mtext>
          </math>
        </div>
        <p>C é quantas vezes a palavra aparece no texto do Pokémon, n = ${dados.pokemon.length} e df é em quantos
          Pokémon ela aparece. O ln no tf faz uma palavra repetida 10 vezes não valer 10 vezes mais. O idf faz uma
          palavra rara, como "cheeks", pesar mais que uma comum, como "body".</p>
        <p>Depois cada vetor é dividido pela norma, e o cosseno é a soma, palavra por palavra, de
          (peso no texto A) × (peso no texto B). Só as palavras em comum somam. O ${escapar(pikachu.nome)} e o
          ${escapar(pachirisu.nome)} têm cosseno <strong>${decimal(parecidoPelaDescricao.cos, 3)}</strong>, e estas
          palavras foram as que mais somaram:</p>
        <ul class="palavras">
          ${parecidoPelaDescricao.palavras.map((p) =>
            `<li><span lang="en">${escapar(p.palavra)}</span> <span class="palavra-peso">${decimal(p.contribuicao, 3)}</span></li>`).join("")}
        </ul>
        <p class="nota">Com 5604 colunas, essa conta é feita em Python. O site recebe prontos os 5 parecidos de cada
          Pokémon e as palavras.</p>
      </section>

      <section class="painel" aria-labelledby="titulo-avaliacao">
        <h2 id="titulo-avaliacao">Os dois jeitos acham coisas diferentes</h2>
        <p>Olhando os 5 parecidos de cada um dos ${dados.pokemon.length} Pokémon
          (${(dados.pokemon.length * dados.k).toLocaleString("pt-BR")} pares):</p>
        <div class="rolagem">
          <table class="tabela tabela-numeros">
            <thead>
              <tr><td></td><th scope="col">Atributos e tipos</th><th scope="col">Descrição da Pokédex</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Têm algum tipo em comum</th>
                <td>${porcento(dados.avaliacao.atributos.tipo_em_comum)}</td><td>${porcento(dados.avaliacao.descricao.tipo_em_comum)}</td></tr>
              <tr><th scope="row">São da mesma família</th>
                <td>${porcento(dados.avaliacao.atributos.mesma_familia)}</td><td>${porcento(dados.avaliacao.descricao.mesma_familia)}</td></tr>
            </tbody>
          </table>
        </div>
        <p>Pelos atributos, os parecidos quase sempre dividem um tipo e têm porte parecido. Pela descrição, aparecem
          mais Pokémon da mesma família, porque os textos de uma família falam das mesmas coisas. O
          <a href="#/pokemon/6">${escapar(charizard.nome)}</a> mostra bem: pelos atributos, o mais parecido é o
          ${escapar(dados.porId.get(charizard.vizinhos.atributos[0].id).nome)}; pela descrição, o
          ${escapar(dados.porId.get(charizard.vizinhos.descricao[0].id).nome)}.</p>
      </section>

      <section class="painel" aria-labelledby="titulo-equipe-como">
        <h2 id="titulo-equipe-como">A equipe</h2>
        <p>A matriz da equipe é um pedaço de S = U·Uᵀ, só com as linhas e as colunas dos Pokémon escolhidos. A
          variedade é a média dos cossenos acima da diagonal. As sugestões vêm do vetor da equipe: a soma dos vetores,
          dividida pela norma. Os sugeridos são os Pokémon com o maior cosseno com ele.</p>
        <p><a href="#/equipe">Montar uma equipe</a></p>
      </section>

      <section class="painel" aria-labelledby="titulo-dados">
        <h2 id="titulo-dados">De onde vêm os dados</h2>
        <ol class="caminho">
          <li><code>extrair.py</code> baixa da <a href="https://pokeapi.co">PokéAPI</a> os dados dos
            ${dados.pokemon.length} Pokémon.</li>
          <li><code>limpar.py</code> monta duas tabelas: <code>pokemon.csv</code>, com status, tipos, altura e peso, e
            <code>descricoes.csv</code>, com ${totalDeTextos.toLocaleString("pt-BR")} textos da Pokédex, em inglês.</li>
          <li><code>similaridade.py</code> monta os vetores, calcula os cossenos e grava os 3 arquivos que o site lê.</li>
          <li>O site, em HTML, CSS e JavaScript, mostra tudo e refaz no navegador as contas da equipe e desta página.</li>
        </ol>
        <p>O código está no GitHub:
          <a href="https://github.com/RdgsPedro/pokedex-similaridade-do-cosseno">RdgsPedro/pokedex-similaridade-do-cosseno</a>.</p>
      </section>
    </article>`;

  // As medianas levam um instante (são mais de 500 mil pares): a página aparece primeiro, e o número chega depois.
  setTimeout(() => {
    const m = medianas(dados);
    const lugar = alvo.querySelector(".medianas .calculando");
    if (lugar) {
      lugar.outerHTML = `A mediana do cosseno entre dois Pokémon quaisquer, só com os status crus, é
        <strong>${decimal(m.crus)}</strong>: quase tudo pareceria igual. Com o z-score aparecem os números negativos,
        e a mediana cai para <strong>${sinal(decimal(m.z))}</strong>.`;
    }
  }, 0);

  prepararConta(alvo, dados);
}

// ---------------------------------------------------------------- a conta com dois Pokémon

async function prepararConta(alvo, dados) {
  const resultado = alvo.querySelector(".conta-resultado");
  let vetores;
  try {
    vetores = vetoresDeAtributos(await carregarPerfil());
  } catch (erro) {
    console.error(erro);
    resultado.innerHTML = `<p class="nota">A conta precisa do arquivo perfil.json, que não carregou.</p>`;
    return;
  }
  // A conta usa o que está escolhido nas duas listas na hora de desenhar
  const listas = alvo.querySelectorAll(".conta-escolha select");
  const desenhar = () => {
    escolhidos = [...listas].map((lista) => Number(lista.value));
    resultado.innerHTML = conta(dados, vetores, escolhidos[0], escolhidos[1]);
  };
  for (const lista of listas) lista.addEventListener("change", desenhar);
  desenhar();
}

/** As 1025 opções da lista, separadas por região. */
function opcoes(dados, escolhido) {
  return REGIOES.map((regiao) => `
    <optgroup label="${regiao.nome} (${regiao.geracao}ª geração)">
      ${dados.pokemon.filter((pokemon) => pokemon.geracao === regiao.geracao).map((pokemon) =>
        `<option value="${pokemon.id}"${pokemon.id === escolhido ? " selected" : ""}>${numero(pokemon.id)} ${escapar(pokemon.nome)}</option>`).join("")}
    </optgroup>`).join("");
}

/** A conta inteira: os vetores dos dois, os produtos e a soma de cada bloco. */
function conta(dados, vetores, idA, idB) {
  const a = dados.porId.get(idA);
  const b = dados.porId.get(idB);
  const ua = vetores.get(idA);
  const ub = vetores.get(idB);

  const blocos = ["status", "tamanho", "tipos"].map((bloco) => {
    const [inicio, fim] = BLOCOS[bloco];
    let posicoes = Array.from({ length: fim - inicio }, (_, k) => inicio + k);
    const soma = posicoes.reduce((total, k) => total + ua[k] * ub[k], 0);
    // Nos tipos, só aparecem as colunas que não são 0 nos dois (as outras não somam nada)
    if (bloco === "tipos") posicoes = posicoes.filter((k) => ua[k] !== 0 || ub[k] !== 0);
    return { bloco, inicio, posicoes, soma };
  });
  const cosseno = produtoEscalar(ua, ub);
  const angulo = (Math.acos(Math.min(1, Math.max(-1, cosseno))) * 180) / Math.PI;
  const zeros = 18 - blocos[2].posicoes.length;

  return `
    ${blocos.map(({ bloco, inicio, posicoes, soma }) => `
      <div class="conta-bloco">
        <h3><span class="amostra parte-${bloco}"></span>${NOME_DO_BLOCO[bloco]}
          <span class="conta-soma">soma ${sinal(decimal(soma, 4))}</span></h3>
        <div class="rolagem">
          <table class="tabela tabela-numeros tabela-conta">
            <thead><tr><td></td>${posicoes.map((k) => `<th scope="col">${COLUNAS[bloco][k - inicio]}</th>`).join("")}</tr></thead>
            <tbody>
              <tr><th scope="row">${escapar(a.nome)}</th>${posicoes.map((k) => `<td>${quatro(ua[k])}</td>`).join("")}</tr>
              <tr><th scope="row">${escapar(b.nome)}</th>${posicoes.map((k) => `<td>${quatro(ub[k])}</td>`).join("")}</tr>
              <tr class="conta-produto"><th scope="row">Produto</th>${posicoes.map((k) => `<td>${quatro(ua[k] * ub[k])}</td>`).join("")}</tr>
            </tbody>
          </table>
        </div>
        ${bloco === "tipos" && zeros ? `<p class="nota">Os outros ${zeros} tipos são 0 nos dois e não somam nada.</p>` : ""}
      </div>`).join("")}
    <p class="conta-total">
      <span>cos = ${blocos.map(({ soma }) => sinal(decimal(soma, 4))).join(" + ").replaceAll("+ −", "− ")} =</span>
      <strong>${sinal(decimal(cosseno, 4))}</strong>
      <span>ângulo de ${Math.round(angulo)}°</span>
    </p>`;
}

// ---------------------------------------------------------------- contas pequenas e desenhos

/** O z-score do HP do Pikachu, com a média e o desvio padrão dos 1025 (desvio populacional, como no Python). */
function zScoreDoHp(dados, pokemon) {
  const valores = dados.pokemon.map((p) => p.status.hp);
  const media = valores.reduce((s, v) => s + v, 0) / valores.length;
  const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - media) ** 2, 0) / valores.length);
  return { valor: pokemon.status.hp, media, desvio, z: (pokemon.status.hp - media) / desvio };
}

/** A mediana do cosseno entre todos os pares, com os 6 status crus e com o z-score. */
function medianas(dados) {
  const crus = dados.pokemon.map((pokemon) => STATUS.map((chave) => pokemon.status[chave]));
  const n = crus.length;
  const media = STATUS.map((_, j) => crus.reduce((s, linha) => s + linha[j], 0) / n);
  const desvio = STATUS.map((_, j) => Math.sqrt(crus.reduce((s, linha) => s + (linha[j] - media[j]) ** 2, 0) / n));
  const z = crus.map((linha) => linha.map((valor, j) => (valor - media[j]) / desvio[j]));
  return { crus: medianaDosCossenos(crus), z: medianaDosCossenos(z) };
}

function medianaDosCossenos(linhas) {
  const u = linhas.map(dividirPelaNorma);
  const valores = new Float64Array((u.length * (u.length - 1)) / 2);
  let k = 0;
  for (let i = 0; i < u.length; i++) {
    for (let j = i + 1; j < u.length; j++) valores[k++] = produtoEscalar(u[i], u[j]);
  }
  valores.sort();
  const meio = valores.length / 2;
  return valores.length % 2 ? valores[Math.floor(meio)] : (valores[meio - 1] + valores[meio]) / 2;
}

/** Número com 4 casas e o sinal de menos de verdade (−), como nas contas. */
function quatro(valor) {
  return sinal(decimal(Math.abs(valor) < 0.00005 ? 0 : valor, 4));
}

/** Troca o hífen pelo sinal de menos: "-0,32" -> "−0,32". */
function sinal(texto) {
  return texto.replace("-", "−");
}

/** 0.986 -> "98,6%" */
function porcento(fracao) {
  return `${decimal(fracao * 100, 1)}%`;
}

/** Duas setas com o ângulo entre elas, para os exemplos de 0°, 90° e 180°. */
function figuraDoAngulo(graus, cosseno, legenda) {
  const rad = (graus * Math.PI) / 180;
  const ponta = { x: 40 + 30 * Math.cos(rad), y: 40 - 30 * Math.sin(rad) };
  const arco = graus === 0 ? "" : `<path class="seta-arco" d="M54 40 A14 14 0 ${graus > 180 ? 1 : 0} 0 ${(40 + 14 * Math.cos(rad)).toFixed(1)} ${(40 - 14 * Math.sin(rad)).toFixed(1)}"/>`;
  return `
    <figure class="angulo">
      <svg viewBox="0 0 80 52" aria-hidden="true">
        ${arco}
        <path class="seta-base" d="M40 40 H70"/>
        <path class="seta-outra" d="M40 40 L${ponta.x.toFixed(1)} ${ponta.y.toFixed(1)}"/>
        <circle cx="40" cy="40" r="3"/>
      </svg>
      <figcaption><strong>${graus}°</strong> cos = ${cosseno}<br>${legenda}</figcaption>
    </figure>`;
}