// Ponto de entrada do site: carrega os dados e mostra a página certa para cada endereço.
// Os endereços usam # (hash), como #/regiao/2 ou #/pokemon/25, para funcionar no GitHub Pages.

import { carregarPokemon } from "./js/dados.js";
import { mostrarPokedex } from "./js/pokedex.js";
import { mostrarPokemon } from "./js/pokemon.js";
import { iniciarBusca } from "./js/busca.js";
import { mostrarEquipe, idsDoLink, atualizarContador } from "./js/equipe.js";
import { mostrarComoFunciona } from "./js/como-funciona.js";
import { escapar } from "./js/ui.js";

const conteudo = document.querySelector("#conteudo");
let dados = null;

// O link "Pular para o conteúdo" só leva o foco para o conteúdo. Sem isto, ele trocaria o endereço para
// #conteudo, e o site acharia que é uma página que não existe.
document.querySelector(".pular").addEventListener("click", (evento) => {
    evento.preventDefault();
    conteudo.focus();
});

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
    atualizarContador(); // o número de Pokémon da equipe, ao lado de "Equipe" no menu
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
    } else if (pagina === "equipe") {
        // "#/equipe" é a sua equipe; "#/equipe/9-130-131" é uma equipe que veio de um link
        mostrarEquipe(conteudo, dados, parametro ? idsDoLink(parametro, dados) : null);
        marcarMenu("equipe");
    } else if (pagina === "como-funciona") {
        mostrarComoFunciona(conteudo, dados);
        marcarMenu("como-funciona");
    } else {
        mostrarNaoEncontrada();
        marcarMenu("");
    }

    if (trocou) {
        window.scrollTo({ top: 0, behavior: "instant" }); // pula direto para o topo, sem a rolagem animada
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

/** Endereço que não existe, como #/abc. */
function mostrarNaoEncontrada() {
    conteudo.innerHTML = `
    <section class="em-breve">
      <h1>Página não encontrada</h1>
      <p>Este endereço não existe no site.</p>
      <p><a href="#/">Voltar para a Pokédex</a></p>
    </section>`;
}