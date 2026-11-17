"""
Extração: baixa da PokéAPI os dados de todos os Pokémon e guarda em dados/brutos/.

Para cada número da Pokédex, guarda duas respostas:
    dados/brutos/pokemon/<número>.json          status, tipos, altura e peso
    dados/brutos/pokemon-species/<número>.json  descrições, categoria, geração e família

Uso, na pasta do projeto: python extracao/extrair.py (no Windows: py extracao/extrair.py)
O que já foi baixado não é pedido de novo: se parar no meio, é só rodar outra vez.
"""
import json
import time
from pathlib import Path

import requests

API = "https://pokeapi.co/api/v2"
BRUTOS = Path("dados/brutos")   # pasta onde ficam as respostas da API
TENTATIVAS = 3                  # quantas vezes tentar cada pedido antes de desistir


def pedir(url):
    """Pede um endereço à API. Se der erro, espera um pouco e tenta de novo."""
    for tentativa in range(1, TENTATIVAS + 1):
        try:
            resposta = requests.get(url, timeout=30)
            resposta.raise_for_status()   # resposta de erro (404, 500...) vira erro do Python
            return resposta.json()
        except requests.RequestException as erro:
            print(f"  tentativa {tentativa} de {TENTATIVAS} falhou: {erro}")
            time.sleep(5 * tentativa)   # espera 5, 10 e 15 segundos
    raise SystemExit("A API não respondeu. Rode de novo mais tarde: o script continua de onde parou.")


def enxugar(dados):
    """Tira da resposta de /pokemon as partes grandes que o projeto não usa."""
    for chave in ["moves", "game_indices", "held_items"]:
        dados.pop(chave, None)
    dados["sprites"].pop("versions", None)
    return dados


def baixar(recurso, numero):
    """Baixa um item da API e guarda em dados/brutos/<recurso>/<numero>.json."""
    arquivo = BRUTOS / recurso / f"{numero}.json"
    if arquivo.exists():
        return   # já foi baixado antes: não pede de novo

    dados = pedir(f"{API}/{recurso}/{numero}")
    if recurso == "pokemon":
        dados = enxugar(dados)

    arquivo.parent.mkdir(parents=True, exist_ok=True)
    arquivo.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
    print("baixado:", arquivo)
    time.sleep(0.1)   # pausa curta, para não sobrecarregar a API


# A lista de espécies diz, no campo "count", quantos Pokémon existem (1025 em nov/2026).
total = pedir(f"{API}/pokemon-species/?limit=1")["count"]
print(f"A API tem {total} Pokémon")

for numero in range(1, total + 1):   # os números vão de 1 ao total, sem buracos
    baixar("pokemon", numero)
    baixar("pokemon-species", numero)

print(f"Pronto: {total} Pokémon em {BRUTOS}")