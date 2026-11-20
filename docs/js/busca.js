// A busca do topo: acha um Pokémon pelo nome ou pelo número, com sugestões enquanto digita.

import { chaveDeBusca, pokemonEmLinha } from "./ui.js";

const LIMITE = 8; // quantas sugestões mostrar

/**
 * Procura Pokémon. Ignora maiúsculas, acentos e pontuação:
 * "mr mime" acha Mr. Mime, "flabebe" acha Flabébé e "nidoran" acha os dois Nidoran.
 */
export function procurar(dados, texto) {
    const termo = chaveDeBusca(texto);
    if (!termo) return [];

    // Só números: procura pelo número da Pokédex ("25" ou "#025").
    if (/^\d+$/.test(termo)) {
        const alvo = Number(termo);
        const comeco = String(alvo);
        return dados.pokemon
            .filter((p) => String(p.id).startsWith(comeco))
            .sort((a, b) => (a.id === alvo ? -1 : b.id === alvo ? 1 : a.id - b.id))
            .slice(0, LIMITE);
    }

    // Nome: primeiro os que começam com o termo, depois os que só contêm.
    const comecam = dados.pokemon.filter((p) => p.chave.startsWith(termo));
    const contem = dados.pokemon.filter((p) => !p.chave.startsWith(termo) && p.chave.includes(termo));
    return [...comecam, ...contem].slice(0, LIMITE);
}

/** Liga a caixa de busca do topo. Chamada uma vez, depois que os dados carregam. */
export function iniciarBusca(dados) {
    const campo = document.querySelector("#busca-campo");
    const lista = document.querySelector("#busca-lista");
    let resultados = [];
    let ativo = -1; // sugestão destacada pelas setas do teclado

    campo.disabled = false;

    function abrir() {
        resultados = procurar(dados, campo.value);
        ativo = resultados.length ? 0 : -1;
        if (!campo.value.trim()) return fechar();

        lista.innerHTML = resultados.length
            ? resultados.map((p, i) => `
          <li id="sugestao-${p.id}" class="sugestao" role="option" data-id="${p.id}" aria-selected="${i === ativo}">
            ${pokemonEmLinha(p)}
          </li>`).join("")
            : `<li class="sugestao-vazia" role="option" aria-disabled="true">Nenhum Pokémon com esse nome ou número.</li>`;
        lista.hidden = false;
        campo.setAttribute("aria-expanded", "true");
        destacar();
    }

    function fechar() {
        lista.hidden = true;
        lista.innerHTML = "";
        campo.setAttribute("aria-expanded", "false");
        campo.removeAttribute("aria-activedescendant");
    }

    function destacar() {
        lista.querySelectorAll(".sugestao").forEach((item, i) => item.setAttribute("aria-selected", String(i === ativo)));
        if (ativo >= 0) campo.setAttribute("aria-activedescendant", `sugestao-${resultados[ativo].id}`);
    }

    function irPara(id) {
        location.hash = `#/pokemon/${id}`;
        campo.value = "";
        fechar();
        campo.blur();
    }

    campo.addEventListener("input", abrir);
    campo.addEventListener("focus", () => { if (campo.value) abrir(); });

    campo.addEventListener("keydown", (evento) => {
        if (evento.key === "ArrowDown" && resultados.length) {
            ativo = (ativo + 1) % resultados.length;
            destacar();
            evento.preventDefault();
        } else if (evento.key === "ArrowUp" && resultados.length) {
            ativo = (ativo - 1 + resultados.length) % resultados.length;
            destacar();
            evento.preventDefault();
        } else if (evento.key === "Enter" && ativo >= 0) {
            irPara(resultados[ativo].id);
        } else if (evento.key === "Escape") {
            fechar();
        }
    });

    // mousedown (e não click) para escolher antes de o campo perder o foco
    lista.addEventListener("mousedown", (evento) => {
        const item = evento.target.closest(".sugestao");
        if (item) {
            evento.preventDefault();
            irPara(Number(item.dataset.id));
        }
    });

    campo.addEventListener("blur", () => setTimeout(fechar, 100));
}