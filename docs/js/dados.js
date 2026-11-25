// Dados do site: os arquivos que a parte de matemática gera, em docs/dados_front/.

import { chaveDeBusca } from "./ui.js";

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

/** Baixa um JSON. Se der errado, o erro diz o que aconteceu, para a tela de erro mostrar. */
async function baixarJson(caminho) {
  let resposta;
  try {
    resposta = await fetch(caminho);
  } catch {
    throw new Error(`Não deu para pedir o arquivo docs/${caminho} ao servidor.`);
  }
  if (!resposta.ok) {
    throw new Error(`O arquivo docs/${caminho} não foi encontrado (código ${resposta.status}).`);
  }
  try {
    return await resposta.json();
  } catch {
    throw new Error(`O arquivo docs/${caminho} está vazio ou não é um JSON válido.`);
  }
}

/** Baixa o pokemon.json (uma vez só, ao abrir o site). */
export async function carregarPokemon() {
  const dados = await baixarJson("dados_front/pokemon.json");

  // Um "índice" por número: assim dá para achar o Pokémon 25 sem percorrer a lista toda.
  dados.porId = new Map(dados.pokemon.map((pokemon) => [pokemon.id, pokemon]));

  // O nome pronto para a busca: "Mr. Mime" vira "mrmime".
  for (const pokemon of dados.pokemon) {
    pokemon.chave = chaveDeBusca(pokemon.nome);
  }
  return dados;
}

// O vizinhos_geracao.json só é baixado quando alguém liga o filtro de geração.
// A "promessa" fica guardada para não baixar o mesmo arquivo duas vezes.
let promessaGeracao = null;

/** vizinhos_geracao.json: os parecidos só entre Pokémon da mesma geração. */
export function carregarVizinhosGeracao() {
  if (!promessaGeracao) {
    promessaGeracao = baixarJson("dados_front/vizinhos_geracao.json")
      .catch((erro) => { promessaGeracao = null; throw erro; }); // se falhar, tenta de novo da próxima vez
  }
  return promessaGeracao;
}


// O perfil.json também só é baixado quando precisa: na página da equipe (e, depois, no "Como funciona").
let promessaPerfil = null;

/** perfil.json: os blocos de cada Pokémon, para o site montar os vetores de atributos. */
export function carregarPerfil() {
  if (!promessaPerfil) {
    promessaPerfil = baixarJson("dados_front/perfil.json")
      .catch((erro) => { promessaPerfil = null; throw erro; }); // se falhar, tenta de novo da próxima vez
  }
  return promessaPerfil;
}