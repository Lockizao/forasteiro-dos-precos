# Forasteiro dos Preços

Comparador de preços que busca o mesmo produto em várias lojas brasileiras ao mesmo tempo e mostra quem cobra menos. Sem cadastro, sem precisar esperar aprovação de parceria com nenhuma loja.

## Tecnologias

- Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- API Route do próprio Next.js como back-end
- SerpApi (Google Shopping) como fonte dos preços

## Como funciona

O front-end manda o termo de busca pra `src/app/api/search/route.ts`, que consulta o SerpApi mantendo a chave no servidor. A resposta fica em cache por 6 horas e a API tenta de novo automaticamente se der algum erro passageiro.

Antes de devolver os resultados, o back-end filtra duas coisas que estavam atrapalhando:

- Relevância: exige que todas as palavras da busca apareçam no título do produto. Sem isso, buscar "iPhone 15" trazia junto iPhone 16 e até iPhone 18, porque o Google Shopping amplia a busca pra "produtos parecidos".
- Acessórios: corta título no formato "Capa para iPhone 15" ou que já começa com o nome de uma peça, tipo "Frontal iPhone 15".

Também marca se o produto é usado (pelo campo que a própria API às vezes devolve, ou por palavras como "seminovo" e "vitrine" no título) e se a loja é uma rede grande e conhecida — isso último é uma lista que eu mantenho manualmente, não é um selo oficial de ninguém.

## Por que não usei a API do Mercado Livre direto

Foi minha primeira tentativa, na verdade. Cadastrei um app lá, gerei token, testei os endpoints de busca e catálogo — e todos voltavam bloqueados com 403, mesmo com tudo configurado certo. Parece que fecharam esse acesso pra quem não é parceiro deles. Acabei indo pro SerpApi, que consulta o Google Shopping (e esse já agrega várias lojas) em vez de depender de acesso direto a uma única plataforma.

## Rodando localmente

Precisa de Node.js, npm, e uma chave do SerpApi (o plano grátis dá 100 buscas por mês, e você consegue uma em serpapi.com).

```bash
npm install
```

Copie o `.env.local.example` para `.env.local` e coloque sua chave:

```
SERPAPI_KEY=sua_chave_aqui
```

Depois só rodar:

```bash
npm run dev
```

E acessar localhost:3000.

## API

`GET /api/search?q=iphone+15` devolve algo assim:

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

Um aviso honesto: a primeira busca de um termo novo pode demorar, às vezes até 30 segundos ou mais, porque depende do tempo que o SerpApi leva pra raspar o Google Shopping do lado deles. Já vi cair em erro 503 em horário de pico. Busca repetida do mesmo termo volta na hora porque fica em cache.
