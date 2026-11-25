// A álgebra linear do site: produto escalar, norma e os vetores de atributos de cada Pokémon.
// Os vetores são montados a partir do perfil.json, do mesmo jeito que a parte de matemática fez em Python.

/** a · b = a1·b1 + a2·b2 + ... + an·bn */
export function produtoEscalar(a, b) {
    let soma = 0;
    for (let i = 0; i < a.length; i++) soma += a[i] * b[i];
    return soma;
}

/** ‖v‖ = √(v · v), o comprimento do vetor. */
export function norma(v) {
    return Math.sqrt(produtoEscalar(v, v));
}

/** v / ‖v‖: o mesmo vetor, com comprimento 1. */
export function dividirPelaNorma(v) {
    const comprimento = norma(v);
    return v.map((x) => x / comprimento);
}

/** Onde cada bloco começa e termina dentro do vetor de 26 números. */
export const BLOCOS = { status: [0, 6], tamanho: [6, 8], tipos: [8, 26] };

/** A parcela de um bloco no cosseno: o produto escalar só das colunas daquele bloco. */
export function parcela(a, b, bloco) {
    const [inicio, fim] = BLOCOS[bloco];
    return produtoEscalar(a.slice(inicio, fim), b.slice(inicio, fim));
}

/**
 * Os vetores de atributos (26 números) de todos os Pokémon, num Map de número -> vetor:
 * x = [status · √(peso/6), tamanho · √(peso/2), tipos · √peso], e depois u = x / ‖x‖.
 * Com todos os vetores de norma 1, cos(a, b) = u_a · u_b.
 */
let vetores = null;
export function vetoresDeAtributos(perfil) {
    if (vetores) return vetores; // monta uma vez só
    const { pesos, blocos, ids } = perfil;
    const fator = {
        status: Math.sqrt(pesos.status / blocos.status[0].length),
        tamanho: Math.sqrt(pesos.tamanho / blocos.tamanho[0].length),
        tipos: Math.sqrt(pesos.tipos),
    };
    vetores = new Map();
    ids.forEach((id, i) => {
        const x = [
            ...blocos.status[i].map((valor) => valor * fator.status),
            ...blocos.tamanho[i].map((valor) => valor * fator.tamanho),
            ...blocos.tipos[i].map((valor) => valor * fator.tipos),
        ];
        vetores.set(id, dividirPelaNorma(x));
    });
    return vetores;
}