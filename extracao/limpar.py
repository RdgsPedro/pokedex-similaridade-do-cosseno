"""
Limpeza: lê as respostas da API em dados/brutos/ e monta as tabelas do projeto.

Gera duas tabelas em dados/processados/:
    pokemon.csv      uma linha por Pokémon: status, tipos, altura, peso e imagens
    descricoes.csv   uma linha por texto da Pokédex, em inglês

Uso, na pasta do projeto: python extracao/limpar.py (no Windows: py extracao/limpar.py)
Antes, rode o extrair.py, que baixa os dados.
"""
import json
import re
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


# ---------------------------------------------------------------- textos da Pokédex

# Siglas que aparecem nos textos e continuam em maiúsculas.
SIGLAS = {"DNA", "IQ", "UFO", "TV", "KO", "UB", "UBS", "MPH", "CDS", "HP", "PSI", "AI"}


def textos_em_ingles(numero):
    """Os textos da Pokédex em inglês, do jogo mais antigo para o mais novo, do jeito que vêm da API."""
    especie = ler("pokemon-species", numero)
    entradas = [e for e in especie["flavor_text_entries"] if e["language"]["name"] == "en"]
    entradas.sort(key=lambda e: numero_da_url(e["version"]["url"]))   # o número da versão segue a ordem dos jogos
    return [(e["version"]["name"], e["flavor_text"]) for e in entradas]


def tirar_maiusculas(achado):
    """PIKACHU -> Pikachu e BERRIES -> Berries, mas siglas como TV e DNA ficam como estão."""
    palavra = achado.group(0)
    if palavra.upper() in SIGLAS:
        return palavra
    return palavra.capitalize()


def limpar_texto(texto):
    """Deixa o texto como nos jogos novos: numa linha só e sem palavras inteiras em maiúsculas."""
    # 1. Hífen invisível (\xad): a palavra foi partida no fim da linha. Junta de volta.
    texto = texto.replace("\xad\n", "").replace("\xad\x0c", "").replace("\xad", "")
    # 2. Hífen de verdade no fim da linha (self-\ndestruct): mantém o hífen e junta.
    texto = re.sub(r"(\w)-[\n\x0c]", r"\1-", texto)
    # 3. Apóstrofo curvo vira simples, como no nome do Farfetch'd.
    texto = texto.replace("’", "'").replace("‘", "'")
    # 4. Os jogos antigos escrevem POKéMON; os novos, Pokémon.
    texto = re.sub(r"\bPOK[EÉé]MON", "Pokémon", texto)
    texto = re.sub(r"\bPOK[EÉé]GEAR", "Pokégear", texto)
    texto = re.sub(r"\bPOK[EÉé]", "Poké", texto)   # POKé BALL -> Poké BALL (o BALL fica para a regra 5)
    # 5. Palavra inteira em maiúsculas (PIKACHU, BERRIES, PIKACHU'S) fica só com a inicial maiúscula.
    texto = re.sub(r"\b[A-Z][A-Z0-9]+(?:'[A-Z])?s?\b", tirar_maiusculas, texto)
    # 6. Quebras de linha e espaços repetidos viram um espaço só.
    return " ".join(texto.split())


def descricoes_de(numero):
    """As linhas de um Pokémon na tabela de descrições, sem textos repetidos."""
    linhas = []
    vistos = set()   # os textos que já entraram, em minúsculas
    for versao, texto in textos_em_ingles(numero):
        texto = limpar_texto(texto)
        if texto.lower() in vistos:
            continue   # vários jogos repetem o mesmo texto: fica só o do jogo mais antigo
        vistos.add(texto.lower())
        linhas.append({"id": numero, "versao": versao, "texto": texto})
    return linhas


# ---------------------------------------------------------------- gerar as tabelas

# Um arquivo por Pokémon em dados/brutos/pokemon/, numerados de 1 ao total.
total = len(list((BRUTOS / "pokemon").glob("*.json")))
linhas = [montar_linha(numero) for numero in range(1, total + 1)]

tabela = pd.DataFrame(linhas)
PROCESSADOS.mkdir(parents=True, exist_ok=True)
tabela.to_csv(PROCESSADOS / "pokemon.csv", index=False)

print(tabela[["id", "nome", "tipo1", "tipo2", "total", "geracao"]].head())
print(f"{len(tabela)} Pokémon e {len(tabela.columns)} colunas em {PROCESSADOS / 'pokemon.csv'}")

# Cada Pokémon dá várias linhas na tabela de descrições, uma por texto diferente.
textos = []
for numero in range(1, total + 1):
    textos += descricoes_de(numero)   # junta as linhas deste Pokémon no fim da lista

descricoes = pd.DataFrame(textos)
descricoes.to_csv(PROCESSADOS / "descricoes.csv", index=False)

print()
print(descricoes[descricoes["id"] == 25].head())   # os primeiros textos do Pikachu
print(f"{len(descricoes)} textos de {descricoes['id'].nunique()} Pokémon em {PROCESSADOS / 'descricoes.csv'}")