// Peças de interface usadas em mais de uma página.

// Os 18 tipos, na mesma ordem das colunas de tipos do perfil.json.
export const TIPOS = ["Normal", "Fogo", "Água", "Planta", "Elétrico", "Gelo", "Lutador", "Venenoso", "Terrestre",
    "Voador", "Psíquico", "Inseto", "Pedra", "Fantasma", "Dragão", "Sombrio", "Aço", "Fada"];

/** Tira os acentos: "Água" -> "Agua". */
export function semAcento(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Para a busca: sem acento, sem maiúsculas e só letras e números. "Mr. Mime" -> "mrmime". */
export function chaveDeBusca(texto) {
    return semAcento(texto).toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** O nome do tipo sem acento e em minúsculas: "Água" -> "agua". Vira classe e cor no CSS. */
export function chaveDoTipo(tipo) {
    return semAcento(tipo).toLowerCase();
}

/** 25 -> "#025" */
export function numero(id) {
    return "#" + String(id).padStart(3, "0");
}

/** Número com vírgula, como no Brasil: decimal(1.7, 1) -> "1,7". */
export function decimal(valor, casas = 2) {
    return valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** A imagem pequena do Pokémon. Se faltar no JSON, monta o endereço pelo número. */
export function spriteDe(pokemon) {
    return pokemon.sprite ||
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
}

/** Protege um texto antes de colocá-lo dentro do HTML. */
export function escapar(texto) {
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

/** As cores do Pokémon como variáveis CSS: --cor1 é o primeiro tipo, --cor2 o segundo. */
export function coresDoPokemon(pokemon) {
    const [tipo1, tipo2] = pokemon.tipos;
    let estilo = `--cor1: var(--c-${chaveDoTipo(tipo1)});`;
    if (tipo2) estilo += ` --cor2: var(--c-${chaveDoTipo(tipo2)});`;
    return estilo;
}

/** O selo colorido de um tipo: <span class="tipo tipo-fogo">Fogo</span> */
export function seloDoTipo(tipo) {
    return `<span class="tipo tipo-${chaveDoTipo(tipo)}">${tipo}</span>`;
}

/**
 * A carta de um Pokémon na grade.
 * `ordem` é a posição na grade: as primeiras cartas ganham a animação de "distribuir".
 */
export function carta(pokemon, ordem = 99) {
    const classes = ordem < 24 ? "carta distribuir" : "carta";
    return `
    <a class="${classes}" style="--ordem: ${ordem}; ${coresDoPokemon(pokemon)}" href="#/pokemon/${pokemon.id}">
      <span class="carta-faixa" aria-hidden="true"></span>
      <span class="carta-imagem">
        <img src="${spriteDe(pokemon)}" alt="" width="96" height="96" loading="lazy">
      </span>
      <span class="carta-numero">${numero(pokemon.id)}</span>
      <span class="carta-nome">${escapar(pokemon.nome)}</span>
      <span class="carta-tipos">${pokemon.tipos.map(seloDoTipo).join("")}</span>
    </a>`;
}

/** Uma linha compacta com sprite, número, nome e tipos (sugestões da busca e, depois, os parecidos). */
export function pokemonEmLinha(pokemon) {
    return `
    <span class="linha-imagem" style="${coresDoPokemon(pokemon)}">
      <img src="${spriteDe(pokemon)}" alt="" width="96" height="96" loading="lazy">
    </span>
    <span class="linha-texto">
      <span class="linha-numero">${numero(pokemon.id)}</span>
      <span class="linha-nome">${escapar(pokemon.nome)}</span>
      <span class="linha-tipos">${pokemon.tipos.map(seloDoTipo).join("")}</span>
    </span>`;
}