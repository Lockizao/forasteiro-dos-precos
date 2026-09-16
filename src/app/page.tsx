"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import type { Resultado } from "./api/search/route";

// Mensagens que mudam conforme o tempo passa — pra deixar claro que tá funcionando
// de verdade (não travado), mesmo quando a busca demora.
function mensagemDeEspera(segundos: number): string {
    if (segundos < 5) return "Sacando a arma... isso costuma ser rápido.";
    if (segundos < 15) return "Rastreando pelas lojas da cidade...";
    if (segundos < 30) return "Ainda procurando — às vezes o forasteiro cavalga mais longe.";
    return "Tá osso hoje. Aguenta mais um pouco, quase lá.";
}

interface RespostaBusca {
    busca: string;
    total: number;
    resultados: Resultado[];
    erro?: string;
}

function Estrelas({ nota }: { nota: number }) {
    return (
        <span className="text-amber-700 text-sm" aria-label={`Avaliação ${nota} de 5`}>
            {"★".repeat(Math.round(nota))}
            <span className="text-[var(--border)]">{"★".repeat(5 - Math.round(nota))}</span>
        </span>
    );
}

function SeloVerificado() {
    return (
        <span
            title="Loja verificada — rede grande/estabelecida"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--verified)] text-[var(--surface)] text-[10px] shrink-0"
            aria-label="Loja verificada"
        >
            ✓
        </span>
    );
}

export default function Home() {
    const [termo, setTermo] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [resposta, setResposta] = useState<RespostaBusca | null>(null);
    const [segundosEspera, setSegundosEspera] = useState(0);

    useEffect(() => {
        if (!carregando) return;

        const inicio = Date.now();
        const intervalo = setInterval(() => {
            setSegundosEspera(Math.floor((Date.now() - inicio) / 1000));
        }, 1000);

        return () => clearInterval(intervalo);
    }, [carregando]);

    async function buscar(e: FormEvent) {
        e.preventDefault();
        if (!termo.trim()) return;

        setSegundosEspera(0);
        setCarregando(true);
        setErro(null);
        setResposta(null);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(termo.trim())}`);
            const data: RespostaBusca = await res.json();

            if (!res.ok) {
                setErro(data.erro ?? "Erro desconhecido ao buscar preços.");
                return;
            }

            setResposta(data);
        } catch {
            setErro("Não foi possível conectar à API. Verifique sua conexão e tente novamente.");
        } finally {
            setCarregando(false);
        }
    }

    const resultados = resposta?.resultados ?? [];
    const maisBarato = resultados[0];
    const maisCaro = resultados[resultados.length - 1];
    const economiaMaxima =
        resultados.length > 1 && maisBarato && maisCaro ? maisCaro.preco - maisBarato.preco : 0;

    return (
        <main className="min-h-screen">
            <div className="max-w-3xl mx-auto px-4 py-14 sm:py-20">
                <header className="mb-10">
                    <p className="font-label text-sm uppercase text-[var(--accent)] mb-2">
                        procurado: o menor preço
                    </p>
                    <h1 className="font-display text-4xl sm:text-5xl leading-tight text-balance text-[var(--accent-strong)]">
                        Forasteiro dos Preços
                    </h1>
                    <p className="text-[var(--text-muted)] mt-3 max-w-[60ch]">
                        Chegou na cidade, rastreou as lojas, achou quem cobra menos. Busca em tempo real,
                        sem cadastro.
                    </p>
                </header>

                <form onSubmit={buscar} className="flex gap-2 mb-10">
                    <input
                        id="termo-busca"
                        value={termo}
                        onChange={(e) => setTermo(e.target.value)}
                        placeholder="Ex: iPhone 15, tênis Nike, cafeteira..."
                        className="flex-1 rounded-lg border-2 border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                    />
                    <button
                        type="submit"
                        disabled={carregando || !termo.trim()}
                        className="rounded-lg bg-[var(--accent)] text-[var(--surface)] font-semibold px-6 py-3 hover:bg-[var(--accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-label uppercase tracking-wide"
                    >
                        {carregando ? "Rastreando..." : "Buscar"}
                    </button>
                </form>

                {erro && (
                    <div className="rounded-lg border-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)] px-4 py-3 mb-8">
                        {erro}
                    </div>
                )}

                {carregando && (
                    <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm mb-2">
                        <span
                            className="inline-block w-4 h-4 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--accent)] animate-spin shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            {mensagemDeEspera(segundosEspera)}{" "}
                            <span className="tabular text-[var(--text)]">({segundosEspera}s)</span>
                        </p>
                    </div>
                )}

                {resposta && resultados.length === 0 && !erro && (
                    <p className="text-[var(--text-muted)]">
                        Nenhum resultado encontrado pra &quot;{resposta.busca}&quot;. Tenta outro termo.
                    </p>
                )}

                {resultados.length > 0 && (
                    <>
                        <div className="flex items-baseline justify-between mb-4">
                            <p className="text-sm text-[var(--text-muted)]">
                                {resultados.length} resultado{resultados.length > 1 ? "s" : ""} pra{" "}
                                <strong className="text-[var(--text)]">&quot;{resposta!.busca}&quot;</strong>
                            </p>
                            {economiaMaxima > 0 && (
                                <p className="text-sm text-[var(--accent-strong)] font-medium tabular">
                                    até {economiaMaxima.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
                                    de diferença
                                </p>
                            )}
                        </div>

                        <ul className="flex flex-col gap-3">
                            {resultados.map((item, i) => (
                                <li key={i}>
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-4 rounded-xl border-2 p-4 bg-[var(--surface)] transition-colors hover:border-[var(--accent)] ${
                                            i === 0 ? "border-[var(--accent)]" : "border-[var(--border)]"
                                        }`}
                                    >
                                        {item.imagem ? (
                                            <Image
                                                src={item.imagem}
                                                alt={item.titulo}
                                                width={56}
                                                height={56}
                                                className="rounded-lg object-cover shrink-0 bg-[var(--bg)]"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg bg-[var(--bg)] shrink-0" />
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{item.titulo}</p>
                                            <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-0.5 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    {item.loja}
                                                    {item.lojaVerificada && <SeloVerificado />}
                                                </span>
                                                {item.condicao === "usado" && (
                                                    <span className="text-xs font-label uppercase bg-[var(--used-soft)] text-[var(--used)] rounded px-1.5 py-0.5">
                                                        usado
                                                    </span>
                                                )}
                                                {item.avaliacao && (
                                                    <>
                                                        <span aria-hidden="true">·</span>
                                                        <Estrelas nota={item.avaliacao} />
                                                        {item.numeroAvaliacoes && (
                                                            <span>({item.numeroAvaliacoes.toLocaleString("pt-BR")})</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {i === 0 && (
                                                <span className="inline-block font-label text-xs uppercase font-semibold text-[var(--surface)] bg-[var(--accent)] rounded px-2 py-0.5 mb-1">
                                                    mais barato
                                                </span>
                                            )}
                                            <p className="font-display text-xl tabular text-[var(--accent-strong)]">
                                                {item.precoFormatado}
                                            </p>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <footer className="mt-16 pt-6 border-t-2 border-[var(--border)] text-xs text-[var(--text-muted)] flex flex-col gap-1">
                    <span>
                        Preços consultados em tempo real via Google Shopping. Os valores podem variar por
                        frete, cupom ou estoque — confirme na loja antes de comprar.
                    </span>
                    <span>
                        <SeloVerificado /> = loja grande/estabelecida (curadoria nossa, não é selo oficial).
                    </span>
                </footer>
            </div>
        </main>
    );
}
