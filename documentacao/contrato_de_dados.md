# Contrato de dados

Este arquivo descreve o que cada parte do trabalho entrega para a próxima. Mudou uma coluna? Atualize aqui primeiro e avise o trio.

## Fluxo

1. `extracao/extrair.py` baixa da PokéAPI para `dados/brutos/` (cópia local, fora do Git).
2. `extracao/limpar.py` lê `dados/brutos/` e gera as tabelas de `dados/processados/`.
3. A matemática lê as tabelas e gera os arquivos do site, em `docs/dados_front/`.

## Quais Pokémon entram

As 1025 espécies da PokéAPI (gerações 1 a 9), uma linha por espécie, na forma padrão. Megas, Gigantamax e formas regionais (Alola, Galar, Hisui, Paldea) ficam de fora: o Vulpix, por exemplo, entra como o de Kanto (Fogo), não como o de Alola (Gelo).

O `id` é o número da Pokédex Nacional (1 = Bulbasaur, 25 = Pikachu, 1025 = Pecharunt).

## Formato das tabelas

CSV separado por vírgula, em UTF-8, com cabeçalho na primeira linha e decimais com ponto (`0.4`). Para ler com o pandas:

    import pandas as pd
    pokemon = pd.read_csv("dados/processados/pokemon.csv", keep_default_na=False)

O `keep_default_na=False` faz o `tipo2` vazio chegar como texto vazio (`""`) em vez de `NaN`.

## `dados/processados/pokemon.csv`

Uma linha por Pokémon: 1025 linhas e 21 colunas, ordenadas por `id`. Só o `tipo2` pode vir vazio.

| coluna | tipo | o que é | exemplo (Pikachu) |
|---|---|---|---|
| `id` | inteiro, 1 a 1025 | número na Pokédex Nacional | 25 |
| `nome` | texto | nome do Pokémon, com apóstrofo simples (Farfetch'd) | Pikachu |
| `categoria` | texto | categoria da Pokédex, em inglês | Mouse Pokémon |
| `geracao` | inteiro, 1 a 9 | geração em que apareceu | 1 |
| `tipo1` | texto | tipo principal, em português (lista abaixo) | Elétrico |
| `tipo2` | texto ou vazio | segundo tipo; vazio em 499 Pokémon | |
| `hp` | inteiro, 1 a 255 | status base | 35 |
| `ataque` | inteiro, 5 a 181 | status base | 55 |
| `defesa` | inteiro, 5 a 230 | status base | 40 |
| `ataque_especial` | inteiro, 10 a 173 | status base | 50 |
| `defesa_especial` | inteiro, 20 a 230 | status base | 50 |
| `velocidade` | inteiro, 5 a 200 | status base | 90 |
| `total` | inteiro, 175 a 720 | soma dos 6 status | 320 |
| `altura_m` | decimal, 0.1 a 20.0 | altura em metros (a API dá em decímetros) | 0.4 |
| `peso_kg` | decimal, 0.1 a 999.9 | peso em kg (a API dá em hectogramas) | 6.0 |
| `lendario` | 0 ou 1 | lendário (71 Pokémon) | 0 |
| `mitico` | 0 ou 1 | mítico (23) | 0 |
| `bebe` | 0 ou 1 | bebê (19) | 0 |
| `familia` | inteiro | número da cadeia evolutiva; Pichu, Pikachu e Raichu têm o mesmo (540 famílias) | 10 |
| `imagem` | URL | arte oficial (cerca de 140 KB) | https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png |
| `sprite` | URL | imagem pequena, de 96 px (cerca de 1 KB) | https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png |

Os 18 tipos: Normal, Fogo, Água, Planta, Elétrico, Gelo, Lutador, Venenoso, Terrestre, Voador, Psíquico, Inseto, Pedra, Fantasma, Dragão, Sombrio, Aço, Fada. A PokéAPI não traz os tipos em português do Brasil; a tradução é feita no `limpar.py`.

## `dados/processados/descricoes.csv`

Os textos da Pokédex, em inglês: a PokéAPI não tem textos em português do Brasil, e o inglês é o único idioma com textos para os 1025 Pokémon. Uma linha por texto: 7486 linhas e 3 colunas, ordenadas por `id` e, dentro de cada Pokémon, do jogo mais antigo para o mais novo. Todo Pokémon tem pelo menos 1 texto (de 1 a 23, com média de 7,3). Nenhuma coluna vem vazia.

| coluna | tipo | o que é | exemplo (Pikachu) |
|---|---|---|---|
| `id` | inteiro, 1 a 1025 | número na Pokédex Nacional; liga cada texto à linha do Pokémon no `pokemon.csv` | 25 |
| `versao` | texto | jogo de onde o texto veio, com o nome usado pela PokéAPI (por exemplo red, gold, sword e scarlet) | red |
| `texto` | texto | o texto já limpo, numa linha só (de 49 a 235 caracteres) | When several of these Pokémon gather, their electricity could build and cause lightning storms. |

O que a limpeza faz com os textos:

- junta numa linha só o que os jogos antigos quebram em várias, inclusive as palavras partidas no fim da linha;
- escreve como nos jogos novos: Pokémon em vez de POKéMON, Pikachu em vez de PIKACHU e Berries em vez de BERRIES. Siglas como TV e DNA continuam em maiúsculas;
- troca o apóstrofo curvo (’) pelo simples ('), como no `nome` do `pokemon.csv`;
- deixa uma vez só o texto que se repete em vários jogos, com a `versao` do jogo mais antigo. Dos 14496 textos em inglês da API, 7486 são diferentes.

## Como gerar de novo

Na raiz do repositório:

    pip install -r requirements.txt
    python extracao/extrair.py
    python extracao/limpar.py
