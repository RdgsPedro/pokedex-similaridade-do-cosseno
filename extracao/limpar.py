"""
Limpeza: lê as respostas da API em dados/brutos/ e monta as tabelas do projeto.

Gera dados/processados/pokemon.csv, com uma linha por Pokémon.
Uso, na pasta do projeto: python extracao/limpar.py (no Windows: py extracao/limpar.py)
Antes, rode o extrair.py, que baixa os dados.
"""
import json
from pathlib import Path

import pandas as pd

BRUTOS = Path("dados/brutos")             # onde o extrair.py guardou as respostas da API
PROCESSADOS = Path("dados/processados")   # onde ficam as tabelas prontas

# A PokéAPI não traz os nomes dos tipos em português do Brasil.
TIPOS_PT = {
    "normal": "Normal", "fire": "Fogo", "water": "Água", "grass": "Planta",
    "electric": "Elétrico", "ice": "Gelo", "fighting": "Lutador", "poison": "Venenoso",
    "ground": "Terrestre", "flying": "Voador", "psychic": "Psíquico", "bug": "Inseto",
    "rock": "Pedra", "ghost": "Fantasma", "dragon": "Dragão", "dark": "Sombrio",
    "steel": "Aço", "fairy": "Fada",
}


def ler(recurso, numero):
    """Lê o arquivo dados/brutos/<recurso>/<numero>.json."""
    arquivo = BRUTOS / recurso / f"{numero}.json"
    return json.loads(arquivo.read_text(encoding="utf-8"))


def em_ingles(lista, campo):
    """Nas listas com um item por idioma, pega o valor em inglês."""
    for item in lista:
        if item["language"]["name"] == "en":
            return item[campo]


def numero_da_url(url):
    """'https://pokeapi.co/api/v2/generation/1/' -> 1"""
    return int(url.rstrip("/").split("/")[-1])


def montar_linha(numero):
    """Junta as duas respostas da API de um Pokémon numa linha da tabela."""
    pokemon = ler("pokemon", numero)
    especie = ler("pokemon-species", numero)

    status = {s["stat"]["name"]: s["base_stat"] for s in pokemon["stats"]}
    tipos = [TIPOS_PT[t["type"]["name"]] for t in pokemon["types"]]   # o principal vem primeiro

    return {
        "id": numero,
        "nome": em_ingles(especie["names"], "name").replace("’", "'"),   # Farfetch’d -> Farfetch'd
        "categoria": em_ingles(especie["genera"], "genus"),
        "geracao": numero_da_url(especie["generation"]["url"]),
        "tipo1": tipos[0],
        "tipo2": tipos[1] if len(tipos) == 2 else "",
        "hp": status["hp"],
        "ataque": status["attack"],
        "defesa": status["defense"],
        "ataque_especial": status["special-attack"],
        "defesa_especial": status["special-defense"],
        "velocidade": status["speed"],
        "total": sum(status.values()),
        "altura_m": pokemon["height"] / 10,   # a API dá em decímetros
        "peso_kg": pokemon["weight"] / 10,    # a API dá em hectogramas
        "lendario": int(especie["is_legendary"]),
        "mitico": int(especie["is_mythical"]),
        "bebe": int(especie["is_baby"]),
        "familia": numero_da_url(especie["evolution_chain"]["url"]),
        "imagem": pokemon["sprites"]["other"]["official-artwork"]["front_default"],
        "sprite": pokemon["sprites"]["front_default"],
    }


# Um arquivo por Pokémon em dados/brutos/pokemon/, numerados de 1 ao total.
total = len(list((BRUTOS / "pokemon").glob("*.json")))
linhas = [montar_linha(numero) for numero in range(1, total + 1)]

tabela = pd.DataFrame(linhas)
PROCESSADOS.mkdir(parents=True, exist_ok=True)
tabela.to_csv(PROCESSADOS / "pokemon.csv", index=False)

print(tabela[["id", "nome", "tipo1", "tipo2", "total", "geracao"]].head())
print(f"{len(tabela)} Pokémon e {len(tabela.columns)} colunas em {PROCESSADOS / 'pokemon.csv'}")