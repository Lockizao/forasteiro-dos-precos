# 🔎 Comparador de Preços

Busca um produto e mostra os preços em várias lojas brasileiras, em tempo real, ordenados do mais barato pro mais caro — sem cadastro, sem esperar dias por aprovação de API de loja.

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|---|---|
| Front-End | Next.js 16 (App Router), React, TypeScript, Tailwind CSS |
| Back-End | Next.js API Route (Node.js) |
| Dados | [SerpApi](https://serpapi.com) (Google Shopping, resultados do Brasil) |

## 🗺️ Como funciona

1. O front-end (`src/app/page.tsx`) manda o termo de busca pra `src/app/api/search/route.ts`.
2. A API consulta o SerpApi (que por sua vez consulta o Google Shopping), mantendo a chave secreta no servidor.
3. Filtra só resultados com preço numérico, ordena do mais barato pro mais caro, e devolve loja, preço, avaliação e link direto pro produto.
4. O front-end destaca o mais barato e mostra a diferença de preço entre o mais barato e o mais caro.

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
  "total": 28,
  "resultados": [
    { "titulo": "...", "loja": "Amazon.com.br", "preco": 3742.99, "precoFormatado": "R$ 3.742,99", "avaliacao": 4.7, "numeroAvaliacoes": 24000, "imagem": "...", "link": "..." }
  ]
}
```

⚠️ A primeira busca de cada termo pode levar até ~30s (tempo do SerpApi consultando o Google). Buscas repetidas do mesmo termo são cacheadas e voltam em segundos.
