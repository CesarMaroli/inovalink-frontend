
# InovaLink — Front‑end (Vite + React)

Protótipo **moderno e futurista** da plataforma colaborativa de invenções **InovaLink**.

## Recursos
- Cadastro de invenções com **título, resumo, descrição, tags, contato e mídia** (imagens/vídeos).
- Cards interativos, **like**, contagem de **views**, botão de **contato do inventor**.
- **Busca** por palavra‑chave.
- **Alerta de semelhança** (Jaccard de trigramas) ao digitar título/descrição durante o cadastro.
- **Painel de tendências** (ranking por `likes*2 + views`).
- Persistência em `localStorage` (mock).

## Rodando local
```bash
npm install
npm run dev
```
Acesse o URL que o Vite mostrar (ex.: http://localhost:5173).

## Build / Deploy rápido
```bash
npm run build
npm run preview
```
- **Vercel**: importe o repositório → Framework **Vite**, Build **npm run build**, Output **dist/**.
- **Netlify**: faça o upload da pasta **dist/**.
- **GitHub Pages**: publique **dist/** em `gh-pages`.

## Próximos passos (back‑end real)
- Node.js + Express com Auth (JWT, OAuth).
- Banco: PostgreSQL/MongoDB. Armazenar mídia no S3/Cloud Storage.
- Busca semântica com vetores (MiniLM) e **detector de duplicatas** por similaridade de embeddings.
- Filas (BullMQ) para **processar e gerar thumbnails** de vídeos/imagens.
- Webhooks/Emails para **convites à colaboração** quando houver match.
