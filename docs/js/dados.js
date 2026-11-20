// Dados do site: os arquivos que a parte de matemática gera, em docs/dados_front/.

// As 9 regiões, com o intervalo de números da Pokédex Nacional de cada uma.
export const REGIOES = [
  { geracao: 1, nome: "Kanto", inicio: 1, fim: 151 },
  { geracao: 2, nome: "Johto", inicio: 152, fim: 251 },
  { geracao: 3, nome: "Hoenn", inicio: 252, fim: 386 },
  { geracao: 4, nome: "Sinnoh", inicio: 387, fim: 493 },
  { geracao: 5, nome: "Unova", inicio: 494, fim: 649 },
  { geracao: 6, nome: "Kalos", inicio: 650, fim: 721 },
  { geracao: 7, nome: "Alola", inicio: 722, fim: 809 },
  { geracao: 8, nome: "Galar", inicio: 810, fim: 905 },
  { geracao: 9, nome: "Paldea", inicio: 906, fim: 1025 },
];

/** Baixa o pokemon.json (uma vez só, ao abrir o site). */
export async function carregarPokemon() {
  const resposta = await fetch("dados_front/pokemon.json");
  if (!resposta.ok) {
    throw new Error(`pokemon.json respondeu com o código ${resposta.status}`);
  }
  const dados = await resposta.json();

  // Um "índice" por número: assim dá para achar o Pokémon 25 sem percorrer a lista toda.
  dados.porId = new Map(dados.pokemon.map((pokemon) => [pokemon.id, pokemon]));
  return dados;
}