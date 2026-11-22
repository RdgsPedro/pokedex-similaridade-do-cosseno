from __future__ import annotations
from datetime import date
import json
from pathlib import Path
import re

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer

ORDEM_TIPOS = [
    "Normal",
    "Fogo",
    "Água",
    "Planta",
    "Elétrico",
    "Gelo",
    "Lutador",
    "Venenoso",
    "Terrestre",
    "Voador",
    "Psíquico",
    "Inseto",
    "Pedra",
    "Fantasma",
    "Dragão",
    "Sombrio",
    "Aço",
    "Fada",
]

COLUNAS_STATUS = [
    "hp",
    "ataque",
    "defesa",
    "ataque_especial",
    "defesa_especial",
    "velocidade",
]

COLUNAS_TAMANHO = ["altura_m", "peso_kg"]

STOPWORDS_PT_EN = set(ENGLISH_STOP_WORDS) | {"pokémon", "pokemon"}
TOKEN_PATTERN = re.compile(r"[a-zà-ÿ]+(?:['-][a-zà-ÿ]+)*")


def to_bool(valor) -> bool:
    if isinstance(valor, bool):
        return valor
    if isinstance(valor, (int, float)):
        return bool(valor)
    return str(valor).strip().lower() in {"true", "1", "yes", "sim"}


def zscore_pop(arr: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Calcula z-score usando média e desvio padrão populacional (ddof=0)."""
    media = np.mean(arr, axis=0)
    desvio = np.std(arr, axis=0, ddof=0)
    desvio_seguro = np.where(desvio == 0, 1.0, desvio)
    z = (arr - media) / desvio_seguro
    return z, media, desvio


def construir_vetor_atributos(df_poke: pd.DataFrame):
    """Passo 1: constrói matriz U_atributos (N x 26) e blocos base para perfil.json."""
    # 1. Status (6 colunas) com z-score (ddof=0)
    status_raw = df_poke[COLUNAS_STATUS].to_numpy(dtype=np.float64)
    status_z, status_media, status_desvio = zscore_pop(status_raw)

    # 2. Tamanho (2 colunas): log natural de altura_m e peso_kg, depois z-score (ddof=0)
    log_tamanho = np.log(df_poke[COLUNAS_TAMANHO].to_numpy(dtype=np.float64))
    tamanho_z, log_tam_media, log_tam_desvio = zscore_pop(log_tamanho)

    # 3. Tipos (18 colunas): 1 nos tipos do Pokémon, normalizado por linha
    n_poke = len(df_poke)
    idx_tipo = {nome: i for i, nome in enumerate(ORDEM_TIPOS)}
    tipos_mat = np.zeros((n_poke, len(ORDEM_TIPOS)), dtype=np.float64)

    for i, row in enumerate(df_poke.itertuples(index=False)):
        for t in (getattr(row, "tipo1", ""), getattr(row, "tipo2", "")):
            t_limpo = str(t).strip()
            if t_limpo in idx_tipo:
                tipos_mat[i, idx_tipo[t_limpo]] = 1.0

    normas_tipos = np.linalg.norm(tipos_mat, axis=1, keepdims=True)
    tipos_norm = np.where(normas_tipos > 0, tipos_mat / normas_tipos, 0.0)

    # Pesos de 1/3 por bloco: sqrt(peso / n_colunas)
    w_status = np.sqrt((1.0 / 3.0) / 6.0)
    w_tamanho = np.sqrt((1.0 / 3.0) / 2.0)
    w_tipos = np.sqrt(1.0 / 3.0)

    x = np.hstack([
        status_z * w_status,
        tamanho_z * w_tamanho,
        tipos_norm * w_tipos,
    ])
    normas_x = np.linalg.norm(x, axis=1, keepdims=True)
    u_attr = np.where(normas_x > 0, x / normas_x, 0.0)

    stats_info = {
        "status_media": status_media,
        "status_desvio": status_desvio,
        "log_tam_media": log_tam_media,
        "log_tam_desvio": log_tam_desvio,
        "status_z": status_z,
        "tamanho_z": tamanho_z,
        "tipos_norm": tipos_norm,
    }
    return u_attr, stats_info


def tokenizar_descricao(texto: str) -> list[str]:
    """Passo 2.2: aplica regras de limpeza e filtragem de palavras."""
    tokens_brutos = TOKEN_PATTERN.findall(texto.lower())
    tokens_validos: list[str] = []

    for tok in tokens_brutos:
        # Remove possessivo "'s"
        if tok.endswith("'s"):
            tok = tok[:-2]

        # Descarta se ainda houver apóstrofo, menos de 3 letras ou stopword
        if "'" in tok or len(tok) < 3 or tok in STOPWORDS_PT_EN:
            continue

        tokens_validos.append(tok)

    return tokens_validos


def construir_vetor_descricao(
    df_poke: pd.DataFrame, df_desc: pd.DataFrame
) -> tuple[np.ndarray, list[str], dict[int, list[str]]]:
    """Passo 2: monta documentos, calcula TF-IDF (sublinear_tf=True, min_df=2) e retorna U_desc."""
    textos_por_id: dict[int, list[str]] = {int(pid): [] for pid in df_poke["id"]}
    for row in df_desc.itertuples(index=False):
        pid = int(getattr(row, "id"))
        if pid in textos_por_id:
            textos_por_id[pid].append(str(getattr(row, "texto")))

    documentos: list[str] = []
    for row in df_poke.itertuples(index=False):
        pid = int(getattr(row, "id"))
        categoria = str(getattr(row, "categoria")).strip()
        txts = textos_por_id.get(pid, [])
        if txts:
            doc = f"{categoria}. {' '.join(txts)}"
        else:
            doc = f"{categoria}."
        documentos.append(doc)

    vectorizer = TfidfVectorizer(
        analyzer=tokenizar_descricao,
        sublinear_tf=True,
        min_df=2,
        norm="l2",
    )
    matriz_tfidf = vectorizer.fit_transform(documentos)
    u_desc = matriz_tfidf.toarray().astype(np.float64)
    vocabulario = list(vectorizer.get_feature_names_out())

    return u_desc, vocabulario, textos_por_id


def calcular_vizinhos_para_indice(
    idx: int,
    candidatos: list[int],
    S_attr: np.ndarray,
    S_desc: np.ndarray,
    u_attr: np.ndarray,
    u_desc: np.ndarray,
    vocabulario: list[str],
    k: int = 5,
) -> dict:
    """Passo 3: encontra os k vizinhos mais próximos e calcula contribuições de blocos e palavras."""
    candidatos_sem_si = [j for j in candidatos if j != idx]
    # Ordena do maior cosseno para o menor (menor ângulo = mais similar)
    ordenados = sorted(
        candidatos_sem_si,
        key=lambda j: float(S_attr[idx, j]),
        reverse=True,
    )[:k]

    viz_atributos = []
    for j in ordenados:
        c_status = float(np.dot(u_attr[idx, 0:6], u_attr[j, 0:6]))
        c_tamanho = float(np.dot(u_attr[idx, 6:8], u_attr[j, 6:8]))
        c_tipos = float(np.dot(u_attr[idx, 8:26], u_attr[j, 8:26]))
        viz_atributos.append({
            "id": int(u_attr_ids[j]),
            "cos": round(float(S_attr[idx, j]), 4),
            "blocos": {
                "status": round(c_status, 4),
                "tamanho": round(c_tamanho, 4),
                "tipos": round(c_tipos, 4),
            },
        })

    ordenados_desc = sorted(
        candidatos_sem_si,
        key=lambda j: float(S_desc[idx, j]),
        reverse=True,
    )[:k]

    viz_descricao = []
    for j in ordenados_desc:
        prod_palavras = u_desc[idx] * u_desc[j]
        idxs_pos = np.flatnonzero(prod_palavras > 0)
        idxs_pos_ordenados = idxs_pos[np.argsort(-prod_palavras[idxs_pos])[:5]]

        palavras_top = [
            {
                "palavra": vocabulario[int(w)],
                "contribuicao": round(float(prod_palavras[int(w)]), 4),
            }
            for w in idxs_pos_ordenados
        ]

        viz_descricao.append({
            "id": int(u_attr_ids[j]),
            "cos": round(float(S_desc[idx, j]), 4),
            "palavras": palavras_top,
        })

    return {
        "atributos": viz_atributos,
        "descricao": viz_descricao,
    }


def avaliar_vizinhos(
    pokemon_lista: list[dict],
    mapa_por_id: dict[int, dict],
    k: int = 5,
) -> dict:
    """Passo 4: calcula tipo_em_comum e mesma_familia nos 1025 x k pares de cada modo."""
    total_pares = len(pokemon_lista) * k
    resultado = {}

    for modo in ("atributos", "descricao"):
        mesmo_tipo_count = 0
        mesma_familia_count = 0

        for p in pokemon_lista:
            tipos_p = set(p["tipos"])
            fam_p = p["familia"]

            for viz in p["vizinhos"][modo]:
                q = mapa_por_id[viz["id"]]
                if tipos_p & set(q["tipos"]):
                    mesmo_tipo_count += 1
                if fam_p == q["familia"]:
                    mesma_familia_count += 1

        resultado[modo] = {
            "tipo_em_comum": round(mesmo_tipo_count / total_pares, 3),
            "mesma_familia": round(mesma_familia_count / total_pares, 3),
        }

    return resultado


def salvar_json_compacto(caminho: Path, dados: dict) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, separators=(",", ":"))


def main() -> None:
    global u_attr_ids

    raiz = Path(".")
    caminho_poke = raiz / "dados" / "processados" / "pokemon.csv"
    caminho_desc = raiz / "dados" / "processados" / "descricoes.csv"
    pasta_saida = raiz / "docs" / "dados_front"

    df_poke = pd.read_csv(caminho_poke, keep_default_na=False)
    df_desc = pd.read_csv(caminho_desc, keep_default_na=False)

    df_poke["id"] = df_poke["id"].astype(int)
    df_poke["geracao"] = df_poke["geracao"].astype(int)
    df_poke = df_poke.sort_values("id").reset_index(drop=True)

    u_attr_ids = df_poke["id"].to_numpy()
    n_poke = len(df_poke)
    k = 5
    hoje = date.today().isoformat()

    # Passo 1 e Passo 2
    u_attr, stats_info = construir_vetor_atributos(df_poke)
    u_desc, vocabulario, textos_por_id = construir_vetor_descricao(df_poke, df_desc)

    # Passo 3: matrizes de similaridade do cosseno (linhas têm norma 1 -> S = U @ U.T)
    S_attr = u_attr @ u_attr.T
    S_desc = u_desc @ u_desc.T

    todos_indices = list(range(n_poke))
    indices_por_geracao: dict[int, list[int]] = {}
    for idx, ger in enumerate(df_poke["geracao"].to_numpy()):
        indices_por_geracao.setdefault(int(ger), []).append(idx)

    pokemon_itens: list[dict] = []
    vizinhos_geracao_map: dict[str, dict] = {}

    for i, row in enumerate(df_poke.itertuples(index=False)):
        pid = int(row.id)
        tipos_poke = [t for t in (str(row.tipo1).strip(), str(row.tipo2).strip()) if t]

        viz_geral = calcular_vizinhos_para_indice(
            i, todos_indices, S_attr, S_desc, u_attr, u_desc, vocabulario, k=k
        )
        viz_ger = calcular_vizinhos_para_indice(
            i,
            indices_por_geracao[int(row.geracao)],
            S_attr,
            S_desc,
            u_attr,
            u_desc,
            vocabulario,
            k=k,
        )
        vizinhos_geracao_map[str(pid)] = viz_ger

        item = {
            "id": pid,
            "nome": str(row.nome),
            "categoria": str(row.categoria),
            "geracao": int(row.geracao),
            "tipos": tipos_poke,
            "status": {
                "hp": int(row.hp),
                "ataque": int(row.ataque),
                "defesa": int(row.defesa),
                "ataque_especial": int(row.ataque_especial),
                "defesa_especial": int(row.defesa_especial),
                "velocidade": int(row.velocidade),
                "total": int(row.total),
            },
            "altura_m": float(row.altura_m),
            "peso_kg": float(row.peso_kg),
            "lendario": to_bool(row.lendario),
            "mitico": to_bool(row.mitico),
            "bebe": to_bool(row.bebe),
            "familia": int(row.familia),
            "imagem": str(row.imagem),
            "sprite": str(row.sprite),
            "textos": textos_por_id.get(pid, []),
            "vizinhos": viz_geral,
        }
        pokemon_itens.append(item)

    mapa_por_id = {item["id"]: item for item in pokemon_itens}

    # Passo 4: avaliação
    avaliacao = avaliar_vizinhos(pokemon_itens, mapa_por_id, k=k)

    # Passo 5: montagem e gravação dos 3 arquivos
    dados_pokemon = {
        "exemplo": False,
        "fonte": "PokéAPI (https://pokeapi.co)",
        "gerado_em": hoje,
        "k": k,
        "pesos_atributos": {
            "status": round(1.0 / 3.0, 4),
            "tamanho": round(1.0 / 3.0, 4),
            "tipos": round(1.0 / 3.0, 4),
        },
        "avaliacao": avaliacao,
        "pokemon": pokemon_itens,
    }

    dados_vizinhos_geracao = {
        "exemplo": False,
        "fonte": "PokéAPI (https://pokeapi.co)",
        "gerado_em": hoje,
        "k": k,
        "vizinhos": vizinhos_geracao_map,
    }

    media_dict = {}
    desvio_dict = {}
    for idx_col, col_nome in enumerate(COLUNAS_STATUS):
        media_dict[col_nome] = round(float(stats_info["status_media"][idx_col]), 4)
        desvio_dict[col_nome] = round(float(stats_info["status_desvio"][idx_col]), 4)

    media_dict["log_altura_m"] = round(float(stats_info["log_tam_media"][0]), 4)
    media_dict["log_peso_kg"] = round(float(stats_info["log_tam_media"][1]), 4)
    desvio_dict["log_altura_m"] = round(float(stats_info["log_tam_desvio"][0]), 4)
    desvio_dict["log_peso_kg"] = round(float(stats_info["log_tam_desvio"][1]), 4)

    dados_perfil = {
        "exemplo": False,
        "fonte": "PokéAPI (https://pokeapi.co)",
        "gerado_em": hoje,
        "k": k,
        "colunas": {
            "status": COLUNAS_STATUS,
            "tamanho": COLUNAS_TAMANHO,
            "tipos": ORDEM_TIPOS,
        },
        "media": media_dict,
        "desvio": desvio_dict,
        "pesos": {
            "status": round(1.0 / 3.0, 4),
            "tamanho": round(1.0 / 3.0, 4),
            "tipos": round(1.0 / 3.0, 4),
        },
        "ids": [int(x) for x in u_attr_ids],
        "blocos": {
            "status": [
                [round(float(val), 4) for val in linha]
                for linha in stats_info["status_z"]
            ],
            "tamanho": [
                [round(float(val), 4) for val in linha]
                for linha in stats_info["tamanho_z"]
            ],
            "tipos": [
                [round(float(val), 4) for val in linha]
                for linha in stats_info["tipos_norm"]
            ],
        },
    }

    salvar_json_compacto(pasta_saida / "pokemon.json", dados_pokemon)
    salvar_json_compacto(pasta_saida / "vizinhos_geracao.json", dados_vizinhos_geracao)
    salvar_json_compacto(pasta_saida / "perfil.json", dados_perfil)


if __name__ == "__main__":
    main()