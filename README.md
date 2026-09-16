# 🤠 Forasteiro dos Preços

Chegou na cidade, rastreou as lojas, achou quem cobra menos. Busca um produto e mostra os preços em várias lojas brasileiras, em tempo real, ordenados do mais barato pro mais caro — sem cadastro, sem esperar dias por aprovação de API de loja.

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|---|---|
| Front-End | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| Back-End | Next.js API Route (Node.js) |
| Dados | [SerpApi](https://serpapi.com) (Google Shopping, resultados do Brasil) |

## 🗺️ Como funciona

1. O front-end (`src/app/page.tsx`) manda o termo de busca pra `src/app/api/search/route.ts`.
2. A API consulta o SerpApi, mantendo a chave secreta no servidor, com cache de 1h (`next: { revalidate }`) e retry automático se der erro transitório.
3. Filtra o que não é o produto certo:
   - **Relevância**: exige que todas as palavras da busca apareçam no título (corta "iPhone 16" numa busca de "iPhone 15", por exemplo — o Google Shopping amplia pra "produtos parecidos" e a gente restringe de volta).
   - **Acessórios**: corta títulos no padrão "Capa para iPhone 15" ou que começam com peça/acessório ("Frontal iPhone 15...").
4. Detecta **usado vs novo** (campo `second_hand_condition` da API quando existe, ou palavras-chave no título tipo "seminovo"/"vitrine"/"recondicionado").
5. Marca **lojas verificadas** com um selo ✓ — curadoria manual de redes grandes/estabelecidas (Amazon, Magalu, Carrefour, etc.), não é um selo oficial de ninguém.
6. Ordena por preço e destaca o mais barato.

## ⚠️ Por que não usa a API do Mercado Livre direto?

Testei primeiro — o Mercado Livre fechou o acesso a busca/catálogo pra apps de terceiros (mesmo com app registrado e token válido, todo endpoint de produto retorna 403 bloqueado por política deles). O SerpApi contorna isso de forma legítima, consultando o Google Shopping (que já agrega várias lojas) em vez de fazer scraping direto nos sites.

## ⚙️ Rodando localmente

### Pré-requisitos
- Node.js e npm
- Uma chave do [SerpApi](https://serpapi.com/users/sign_up) (100 buscas grátis por mês)

### Instalação
```bash
npm install
```

### Configuração
Copie `.env.local.example` para `.env.local` e preencha:
```env
SERPAPI_KEY=sua_chave_aqui
```

### Iniciar
```bash
npm run dev
```
🌐 Acesse http://localhost:3000

## 🔑 API

`GET /api/search?q=iphone+15`

Resposta:
```json
{
  "busca": "iphone 15",
  "total": 23,
  "resultados": [
    {
      "titulo": "...",
      "loja": "Amazon.com.br - Seller",
      "lojaVerificada": true,
      "condicao": "usado",
      "preco": 3742.99,
      "precoFormatado": "R$ 3.742,99",
      "avaliacao": 4.7,
      "numeroAvaliacoes": 24000,
      "imagem": "...",
      "link": "..."
    }
  ]
}
```

⚠️ A primeira busca de cada termo pode levar até ~30s (às vezes mais — o SerpApi já retornou 503 em picos de instabilidade; a API tenta de novo automaticamente). Buscas repetidas do mesmo termo são cacheadas (pelo SerpApi e por nós) e voltam em segundos.
