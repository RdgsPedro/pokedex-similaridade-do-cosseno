// Ponto de entrada do site: carrega os dados e mostra a página certa para cada endereço.
// Os endereços usam # (hash), como #/regiao/2 ou #/pokemon/25, para funcionar no GitHub Pages.

import { carregarPokemon } from "./js/dados.js";
import { mostrarPokedex } from "./js/pokedex.js";
import { mostrarPokemon } from "./js/pokemon.js";
import { iniciarBusca } from "./js/busca.js";
import { escapar } from "./js/ui.js";

const conteudo = document.querySelector("#conteudo");
let dados = null;

iniciar();

async function iniciar() {
    mostrarCarregando();
    try {
        dados = await carregarPokemon();
    } catch (erro) {
        console.error(erro);
        mostrarErro(erro);
        return;
    }

    // Enquanto a matemática não entrega os arquivos definitivos, o rodapé avisa.
    document.querySelector(".aviso-exemplo").hidden = !dados.exemplo;

    iniciarBusca(dados);
    window.addEventListener("hashchange", () => mostrarPagina(true));
    mostrarPagina(false);
}

/** Lê o endereço e mostra a página. `trocou` é verdadeiro quando a pessoa clicou num link. */
function mostrarPagina(trocou) {
    // "#/pokemon/25" -> pagina = "pokemon", parametro = "25"
    const [pagina, parametro] = location.hash.replace(/^#\/?/, "").split("/");
    document.title = "Parecidex: Pokémon parecidos pela similaridade do cosseno";

    if (pagina === "" || pagina === "regiao") {
        // "#/regiao/todas" mostra as 9 regiões; "#/regiao/3", só Hoenn
        mostrarPokedex(conteudo, dados, parametro === "todas" ? "todas" : Number(parametro) || 1);
        marcarMenu("pokedex");
    } else if (pagina === "pokemon") {
        mostrarPokemon(conteudo, dados, Number(parametro));
        marcarMenu(""); // a página do Pokémon não tem botão no menu
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

/** A tela de erro diz o que deu errado (arquivo vazio, faltando...) e o que conferir. */
function mostrarErro(erro) {
    conteudo.innerHTML = `
    <section class="erro" role="alert">
      <h1>Os dados não carregaram</h1>
      <p>${escapar(erro.message)}</p>
      <p>Confira se os 3 arquivos estão em <code>docs/dados_front/</code> e se o site foi aberto por um servidor
        (o Live Server do VS Code, ou <code>py -m http.server 8000 --directory docs</code>).</p>
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