# Parecidex: Pokémon parecidos pela similaridade do cosseno

Trabalho de Álgebra Linear (P2) do curso de Ciência de Dados da Fatec Rubens Lara. Cada Pokémon vira um vetor, e a
similaridade do cosseno mostra quais são os mais parecidos com ele: pelos atributos e tipos, ou pela descrição da Pokédex.

**Site:** https://rdgspedro.github.io/pokedex-similaridade-do-cosseno/

## O que dá para fazer no site

- Ver os 1025 Pokémon, separados por região, com busca por nome ou número e filtro por tipo.
- Abrir um Pokémon e ver os 5 mais parecidos com ele, de dois jeitos:
  - **Atributos e tipos:** a barra mostra quanto o status, o tamanho e os tipos somaram no cosseno.
  - **Descrição da Pokédex:** aparecem as palavras em comum que mais somaram.
- Ver só os parecidos da mesma geração.
- Montar uma equipe de até 6 Pokémon e ver a matriz de similaridade entre eles, a média e sugestões, com um link para
  compartilhar.
- Entender a matemática na página "Como funciona", que faz a conta com dois Pokémon à escolha.

## Como funciona

- **Atributos:** cada Pokémon vira um vetor de 26 números, em 3 blocos que valem 1/3 cada: os 6 status com z-score, a
  altura e o peso com logaritmo e z-score, e os 18 tipos (1 nos tipos do Pokémon, dividido pela norma).
- **Descrição:** cada Pokémon vira um vetor com o peso TF-IDF de cada uma das 5604 palavras dos textos da Pokédex.
- Os vetores são divididos pela norma, e a similaridade é o cosseno do ângulo entre eles:
  cos(a, b) = a · b / (‖a‖ ‖b‖). A matriz com todos os pares sai numa conta só: S = U·Uᵀ.

Com os 5 parecidos de cada um dos 1025 Pokémon:

| | Atributos e tipos | Descrição da Pokédex |
|---|---|---|
| Têm algum tipo em comum | 98,6% | 55,9% |
| São da mesma família | 4,6% | 12,5% |

## Como rodar

Os dados prontos já estão no repositório, então o site funciona sem rodar nada. Para refazer tudo do zero, rode os
comandos na pasta do repositório. Precisa do Python 3 (testado no 3.12). No Windows o comando é `py`; no Linux e no
Mac, `python3`.

1. Instalar as bibliotecas:
   ```
   py -m pip install -r requirements.txt
   ```
2. Baixar os dados da PokéAPI para `dados/brutos/`. São 2050 arquivos, uns 29 MB, e leva alguns minutos. Se parar no
   meio, é só rodar de novo: ele continua de onde parou.
   ```
   py extracao/extrair.py
   ```
3. Montar as tabelas `dados/processados/pokemon.csv` e `dados/processados/descricoes.csv`. No fim aparecem
   "1025 Pokémon e 21 colunas" e "7486 textos de 1025 Pokémon".
   ```
   py extracao/limpar.py
   ```
4. Calcular os vetores e as similaridades. O script grava os 3 arquivos do site em `docs/dados_front/`.
   ```
   py matematica/similaridade.py
   ```
5. Abrir o site no computador e entrar em http://localhost:8000. O site precisa de um servidor: abrindo o
   `index.html` direto, o navegador não deixa carregar os dados. O Live Server do VS Code também serve.
   ```
   py -m http.server 8000 --directory docs
   ```

Depois do passo 4, o `git status` mostra os 3 arquivos de `docs/dados_front/` como modificados só por causa da data em
`gerado_em`. Se a PokéAPI tiver mudado algum dado, podem aparecer diferenças pequenas também nos CSV.

## Pastas

```
extracao/            extrair.py (PokéAPI → dados/brutos/) e limpar.py (→ tabelas CSV)
dados/processados/   pokemon.csv e descricoes.csv
matematica/          similaridade.py (CSV → vetores → cossenos → arquivos do site)
documentacao/        contrato_de_dados.md, com as colunas das tabelas
docs/                o site (HTML, CSS e JavaScript), publicado pelo GitHub Pages
docs/dados_front/    pokemon.json, vizinhos_geracao.json e perfil.json, que o site lê
```

## Fonte e créditos

- Dados e imagens: [PokéAPI](https://pokeapi.co).
- Pokémon e os nomes dos Pokémon são marcas da Nintendo, da Creatures e da Game Freak. Este é um trabalho acadêmico,
  sem fins comerciais.

## Quem fez

- Pedro Rodrigues Almeida: extração e limpeza dos dados
- Julia Aiyra Silva Santos: matemática (vetores, similaridade do cosseno e avaliação)
- Lucas Honorato Ferreira: site