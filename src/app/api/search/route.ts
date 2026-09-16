import { NextRequest, NextResponse } from "next/server";

export interface Resultado {
    titulo: string;
    loja: string;
    lojaIcone: string | null;
    lojaVerificada: boolean;
    condicao: "novo" | "usado";
    preco: number;
    precoFormatado: string;
    avaliacao: number | null;
    numeroAvaliacoes: number | null;
    imagem: string | null;
    link: string;
}

// Remove acentos e baixa a caixa, pra comparar texto sem se importar com "é" vs "e" etc.
function normalizar(texto: string): string {
    return texto
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
}

// Verifica se TODAS as palavras relevantes da busca aparecem no título — é o que
// impede "iphone 15" de trazer "iPhone 16" ou "iPhone 18 Pro" (o Google Shopping
// amplia pra "produtos parecidos", a gente restringe de volta pro que foi pedido).
const PALAVRAS_IGNORADAS = new Set(["de", "da", "do", "com", "para", "a", "o", "e"]);

function tituloRelevante(titulo: string, busca: string): boolean {
    const tituloNorm = normalizar(titulo);
    const termos = normalizar(busca)
        .split(/\s+/)
        .filter((t) => t.length > 1 && !PALAVRAS_IGNORADAS.has(t));

    return termos.every((termo) => {
        // \b não funciona bem com acentos já removidos, então usamos um match simples
        // de substring — pra números (ex: "15") isso pode colar em "150", mas na prática
        // títulos de produto raramente têm esse tipo de colisão.
        return tituloNorm.includes(termo);
    });
}

// Título no padrão "Capa para iPhone 15" / "Película compatível com iPhone 15" —
// é um acessório PRA o produto buscado, não o produto em si.
const REGEX_ACESSORIO_PARA =
    /(capa|case|pelicula|película|suporte|carregador|cabo|fone|adaptador|bumper|skin|frontal|protetor|kit de limpeza)\b[^.]{0,25}\b(para|compat[íi]vel)/i;

// Título que já COMEÇA com a peça/acessório (ex: "Frontal iPhone 15 Pro Vivid",
// "Capa iPhone 15") — convenção comum de e-commerce de nomear pelo tipo de item primeiro.
const REGEX_ACESSORIO_INICIO =
    /^\s*(capa|case|pelicula|película|suporte|carregador|cabo|fone de ouvido|adaptador|bumper|skin|frontal|protetor de tela|kit de limpeza)\b/i;

function ehAcessorio(titulo: string): boolean {
    return REGEX_ACESSORIO_PARA.test(titulo) || REGEX_ACESSORIO_INICIO.test(titulo);
}

const REGEX_USADO = /(seminovo|semi[\s-]?novo|usado|recondicionado|recertificado|vitrine|open[\s-]?box|segunda[\s-]?m[ãa]o)/i;

function detectarCondicao(titulo: string, secondHandCondition: string | undefined): "novo" | "usado" {
    if (secondHandCondition) return "usado";
    if (REGEX_USADO.test(titulo)) return "usado";
    return "novo";
}

// Lojas grandes/estabelecidas — recebem o selo de "verificada". Curadoria manual,
// não é status oficial do Mercado Livre/Google, é uma marcação nossa de confiança.
const LOJAS_VERIFICADAS = [
    "amazon",
    "magalu",
    "magazine luiza",
    "casas bahia",
    "americanas",
    "submarino",
    "shoptime",
    "carrefour",
    "extra",
    "fast shop",
    "kabum",
    "netshoes",
    "centauro",
    "ponto frio",
    "pontofrio",
    "leroy merlin",
    "mercado livre",
    "zattini",
    "drogasil",
    "drogaria sao paulo",
    "droga raia",
    "petz",
    "cobasi",
    "renner",
    "riachuelo",
    "dell",
    "samsung",
    "apple",
    "positivo",
    "multilaser",
    "casa e video",
    "casa & video",
    "girafa",
];

function ehLojaVerificada(nomeLoja: string): boolean {
    const nomeNorm = normalizar(nomeLoja);
    return LOJAS_VERIFICADAS.some((loja) => nomeNorm.includes(loja));
}

// O SerpApi pode demorar bastante (buscas sem cache passam de 30s, às vezes até 90s+
// e retornam 503 por instabilidade do lado deles). Damos mais tempo pra função rodar
// e tentamos de novo automaticamente se dor um erro transitório.
export const maxDuration = 60;

async function buscarNoSerpApi(url: string, tentativa = 1): Promise<{ dados?: unknown; erro?: string }> {
    try {
        const resposta = await fetch(url, {
            // Cache de verdade: se alguém já buscou "iphone 15" na última hora,
            // todo mundo recebe a resposta na hora, sem gastar cota do SerpApi de novo.
            next: { revalidate: 3600 },
        });
        const dados = await resposta.json();

        if (dados.error) {
            if (tentativa < 2) return buscarNoSerpApi(url, tentativa + 1);
            return { erro: dados.error };
        }

        return { dados };
    } catch (error) {
        if (tentativa < 2) return buscarNoSerpApi(url, tentativa + 1);
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return { erro: message };
    }
}

export async function GET(request: NextRequest) {
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { erro: "Variável de ambiente SERPAPI_KEY não configurada no servidor." },
            { status: 500 }
        );
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();

    if (!q) {
        return NextResponse.json({ erro: "Informe um produto pra buscar (parâmetro 'q')." }, { status: 400 });
    }

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_shopping");
    url.searchParams.set("q", q);
    url.searchParams.set("gl", "br"); // resultados do Brasil
    url.searchParams.set("hl", "pt-br");
    url.searchParams.set("api_key", apiKey);

    const { dados, erro } = await buscarNoSerpApi(url.toString());

    if (erro) {
        return NextResponse.json({ erro: `Falha ao consultar o SerpApi: ${erro}` }, { status: 502 });
    }

    interface ItemBruto {
        title?: string;
        source?: string;
        source_icon?: string;
        extracted_price?: number;
        price?: string;
        rating?: number;
        reviews?: number;
        thumbnail?: string;
        product_link?: string;
        second_hand_condition?: string;
    }

    const brutos: ItemBruto[] = (dados as { shopping_results?: ItemBruto[] }).shopping_results ?? [];

    const resultados: Resultado[] = brutos
        // Só mantém resultados com preço numérico de verdade — sem isso não dá pra ordenar/comparar
        .filter((item) => typeof item.extracted_price === "number")
        // Corta produto de modelo diferente do buscado (ex: "iPhone 16" numa busca de "iPhone 15")
        .filter((item) => tituloRelevante(item.title ?? "", q))
        // Corta acessórios ("Capa para iPhone 15", "Película compatível com...")
        .filter((item) => !ehAcessorio(item.title ?? ""))
        .map((item) => {
            const loja = item.source ?? "Loja não identificada";
            return {
                titulo: item.title ?? "Produto sem título",
                loja,
                lojaIcone: item.source_icon ?? null,
                lojaVerificada: ehLojaVerificada(loja),
                condicao: detectarCondicao(item.title ?? "", item.second_hand_condition),
                preco: item.extracted_price as number,
                precoFormatado: (item.extracted_price as number).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                }),
                avaliacao: item.rating ?? null,
                numeroAvaliacoes: item.reviews ?? null,
                imagem: item.thumbnail ?? null,
                link: item.product_link ?? "#",
            };
        })
        .sort((a, b) => a.preco - b.preco);

    return NextResponse.json({
        busca: q,
        total: resultados.length,
        resultados,
    });
}
