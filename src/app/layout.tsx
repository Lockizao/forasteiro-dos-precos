import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Forasteiro dos Preços",
    description: "Compare preços de produtos em várias lojas brasileiras, em tempo real.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Rye&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
