// Ponto de entrada do site: carrega os dados e mostra a página certa para cada endereço.
// Os endereços usam # (hash), como #/regiao/2 ou #/pokemon/25, para funcionar no GitHub Pages.

import { carregarPokemon } from "./js/dados.js";
import { mostrarPokedex } from "./js/pokedex.js";

const conteudo = document.querySelector("#conteudo");
let dados = null;

iniciar();

async function iniciar() {
    mostrarCarregando();
    try {
        dados = await carregarPokemon();
    } catch (erro) {
        console.error(erro);
        mostrarErro();
        return;
    }

    // Enquanto a matemática não entrega os arquivos definitivos, o rodapé avisa.
    document.querySelector(".aviso-exemplo").hidden = !dados.exemplo;

    window.addEventListener("hashchange", () => mostrarPagina(true));
    mostrarPagina(false);
}

/** Lê o endereço e mostra a página. `trocou` é verdadeiro quando a pessoa clicou num link. */
function mostrarPagina(trocou) {
    // "#/regiao/3" -> pagina = "regiao", parametro = "3"
    const [pagina, parametro] = location.hash.replace(/^#\/?/, "").split("/");

    if (pagina === "" || pagina === "regiao") {
        mostrarPokedex(conteudo, dados, Number(parametro) || 1);
        marcarMenu("pokedex");
    } else {
        mostrarEmBreve();
        marcarMenu(pagina);
    }

    if (trocou) {
        window.scrollTo({ top: 0 });
        conteudo.focus({ preventScroll: true }); // quem usa leitor de tela "chega" na página nova
    }
}

/** Destaca no menu a página aberta. */
function marcarMenu(pagina) {
    for (const link of document.querySelectorAll(".menu a")) {
        if (link.dataset.pagina === pagina) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    }
}

/** Um Pokémon sorteado pula enquanto os dados carregam. */
function mostrarCarregando() {
    const sorteado = 1 + Math.floor(Math.random() * 1025);
    conteudo.innerHTML = `
    <div class="carregando" role="status">
      <img class="carregando-sprite" alt="" width="192" height="192"
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${sorteado}.png">
      <span class="carregando-sombra" aria-hidden="true"></span>
      <p>Carregando os 1025 Pokémon</p>
    </div>`;
}

function mostrarErro() {
    conteudo.innerHTML = `
    <section class="erro" role="alert">
      <h1>Os dados não carregaram</h1>
      <p>Aberto direto do computador, o site não consegue ler os dados: o navegador bloqueia.
        Na pasta do projeto, rode <code>py -m http.server 8000 --directory docs</code>
        e abra <a href="http://localhost:8000">http://localhost:8000</a>.</p>
    </section>`;
}

function mostrarEmBreve() {
    conteudo.innerHTML = `
    <section class="em-breve">
      <h1>Em construção</h1>
      <p>Esta página chega nas próximas etapas.</p>
      <p><a href="#/">Voltar para a Pokédex</a></p>
    </section>`;
}