import { NextRequest, NextResponse } from "next/server";

export interface Resultado {
    titulo: string;
    loja: string;
    lojaIcone: string | null;
    preco: number;
    precoFormatado: string;
    avaliacao: number | null;
    numeroAvaliacoes: number | null;
    imagem: string | null;
    link: string;
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

    let dados;
    try {
        const resposta = await fetch(url.toString());
        dados = await resposta.json();

        if (dados.error) {
            return NextResponse.json({ erro: `SerpApi: ${dados.error}` }, { status: 502 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ erro: `Falha ao consultar o SerpApi: ${message}` }, { status: 502 });
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
    }

    const brutos: ItemBruto[] = dados.shopping_results ?? [];

    // Só mantém resultados com preço numérico de verdade — sem isso não dá pra ordenar/comparar
    const resultados: Resultado[] = brutos
        .filter((item) => typeof item.extracted_price === "number")
        .map((item) => ({
            titulo: item.title ?? "Produto sem título",
            loja: item.source ?? "Loja não identificada",
            lojaIcone: item.source_icon ?? null,
            preco: item.extracted_price as number,
            precoFormatado: (item.extracted_price as number).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            }),
            avaliacao: item.rating ?? null,
            numeroAvaliacoes: item.reviews ?? null,
            imagem: item.thumbnail ?? null,
            link: item.product_link ?? "#",
        }))
        .sort((a, b) => a.preco - b.preco);

    return NextResponse.json({
        busca: q,
        total: resultados.length,
        resultados,
    });
}
