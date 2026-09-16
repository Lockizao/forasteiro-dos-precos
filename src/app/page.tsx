"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import type { Resultado } from "./api/search/route";

interface RespostaBusca {
    busca: string;
    total: number;
    resultados: Resultado[];
    erro?: string;
}

function Estrelas({ nota }: { nota: number }) {
    return (
        <span className="text-amber-500 text-sm" aria-label={`Avaliação ${nota} de 5`}>
            {"★".repeat(Math.round(nota))}
            <span className="text-[var(--border)]">{"★".repeat(5 - Math.round(nota))}</span>
        </span>
    );
}

export default function Home() {
    const [termo, setTermo] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [resposta, setResposta] = useState<RespostaBusca | null>(null);

    async function buscar(e: FormEvent) {
        e.preventDefault();
        if (!termo.trim()) return;

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
                    <p className="font-display text-sm tracking-wide text-[var(--accent)] mb-2">
                        comparador de preços
                    </p>
                    <h1 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-balance">
                        Veja quem cobra menos, antes de comprar.
                    </h1>
                    <p className="text-[var(--text-muted)] mt-3 max-w-[60ch]">
                        Busca em tempo real nas principais lojas do Brasil. Sem cadastro, sem esperar.
                    </p>
                </header>

                <form onSubmit={buscar} className="flex gap-2 mb-10">
                    <input
                        id="termo-busca"
                        value={termo}
                        onChange={(e) => setTermo(e.target.value)}
                        placeholder="Ex: iPhone 15, tênis Nike, cafeteira..."
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                    />
                    <button
                        type="submit"
                        disabled={carregando || !termo.trim()}
                        className="rounded-lg bg-[var(--accent)] text-white font-medium px-6 py-3 hover:bg-[var(--accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {carregando ? "Buscando..." : "Buscar"}
                    </button>
                </form>

                {erro && (
                    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 mb-8">
                        {erro}
                    </div>
                )}

                {carregando && (
                    <p className="text-[var(--text-muted)] text-sm">
                        Consultando lojas — a primeira busca de cada termo pode levar até 30s, buscas repetidas são bem mais rápidas.
                    </p>
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
                                <p className="text-sm text-[var(--accent)] font-medium tabular">
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
                                        className={`flex items-center gap-4 rounded-xl border p-4 bg-[var(--surface)] transition-colors hover:border-[var(--accent)] ${
                                            i === 0
                                                ? "border-[var(--accent)] ring-1 ring-[var(--accent-soft)]"
                                                : "border-[var(--border)]"
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
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] mt-0.5">
                                                <span>{item.loja}</span>
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
                                                <span className="inline-block text-xs font-semibold text-[var(--accent)] bg-[var(--accent-soft)] rounded-full px-2 py-0.5 mb-1">
                                                    mais barato
                                                </span>
                                            )}
                                            <p className="font-display text-lg font-semibold tabular">
                                                {item.precoFormatado}
                                            </p>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <footer className="mt-16 pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
                    Preços consultados em tempo real via Google Shopping. Os valores podem variar por frete,
                    cupom ou estoque — confirme na loja antes de comprar.
                </footer>
            </div>
        </main>
    );
}
