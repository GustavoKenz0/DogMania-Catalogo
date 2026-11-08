# Dogmania — frontend

Catálogo digital responsivo da Dogmania Pet Shop. Vitrine de produtos com busca,
filtro por categoria e compra iniciada pelo WhatsApp do proprietário.

## Como rodar

Configure primeiro a API Java e o banco conforme [README do projeto](../README.md). Use Bun para executar este frontend. Copie `.env.example` para `.env.local` e ajuste `VITE_API_URL`, se necessário. A variável é pública: não coloque senhas ou chaves de serviço nela.

```bash
bun install      # instala as dependências
bun dev          # frontend em http://127.0.0.1:8081; API em localhost:8080
bun run build    # gera a versão de produção
bun run preview  # serve a versão gerada
```

## Frontend na Vercel

Para a vitrine comercial da Dogmania, use uma equipe Vercel Pro. O plano Hobby
é para uso pessoal e não comercial. [Planos da Vercel](https://vercel.com/docs/plans/hobby)

1. Na importação do repositório, escolha **Root Directory** igual a
   **Dogmania-Catalogo**, a subpasta que contém este README e o `bun.lock`.
   O `vercel.json` configura o preset **TanStack Start**, a instalação Bun com
   lockfile e o build Nitro para Vercel. Mantenha a saída padrão do framework
   para servir as rotas SSR. Use Node.js 24.x no projeto.
   [Guia TanStack Start na Vercel](https://vercel.com/kb/guide/deploy-a-tanstack-start-app-to-vercel)
2. Hospede a API Java 21 separadamente no Render, com HTTPS e acesso ao banco
   Supabase. Configure `CORS_ORIGINS` no serviço Java com as origens exatas
   autorizadas, incluindo https:// e sem caminho ou barra final. Use a origem
   estável da branch de Preview no ambiente de homologação e a do domínio da
   loja no ambiente de produção.
3. Em **Settings → Environment Variables**, defina `VITE_API_URL` para cada
   ambiente. Em **Preview**, use a URL pública da API de homologação.
   Em **Production**, use a URL da API de produção. O formato esperado é
   `https://meu-servico.onrender.com/api/v1`. Essa variável é pública e vai para o
   navegador no build. Configure credenciais do PostgreSQL, JWT e Storage
   somente no serviço Java. Alterações de `VITE_API_URL` exigem novo build.
   [Ambientes da Vercel](https://vercel.com/docs/deployments/environments)
4. O primeiro deployment de um projeto Vercel usa o ambiente **Production**,
   inclusive ao começar por outra branch. Configure as variáveis de Production
   antes desse primeiro build e faça a homologação antes de associar o domínio
   público da loja. Nas entregas seguintes, use uma branch de Preview com API e
   banco de homologação. Valide abertura direta de `/produtos` e `/admin`, catálogo,
   login e CRUD com dados de teste antes da promoção.
   [Primeiro deployment e Preview](https://vercel.com/docs/deployments/environments#first-deployment)

O build de Vercel verifica a configuração da URL e rejeita localhost, URLs
sem HTTPS e bases fora de `/api/v1`. Para gerar o artefato localmente, rode
`bun run build --mode vercel` nesta pasta com a variável pública `VITE_API_URL`
configurada para a API desejada. O comando gera `.vercel/output`.

## Estrutura

```
src/
  assets/            imagens (logo, banners do carrossel, fotos de produtos)
  components/
    SiteHeader.tsx   cabeçalho fixo: logo, navegação (Início / Produtos), busca
    SiteFooter.tsx   rodapé com contatos
    HeroCarousel.tsx carrossel de banners na home (autoplay + setas + bolinhas)
    CatalogGrid.tsx  contador de resultados, filtros por categoria, grade
    ProductCard.tsx  card de produto com preço e botão "Comprar via WhatsApp"
    ui/              componentes de interface (shadcn/ui)
  config/store.ts    contato compartilhado da loja
  features/
    admin/           painel, formulário e listagem administrativa
    products/        modelo, categorias e mensagens WhatsApp
  routes/
    __root.tsx       shell da aplicação (fontes, metadados, rotas)
    index.tsx        página inicial (/)
    produtos.tsx     página de produtos (/produtos)
  hooks/             consultas e mutações via React Query
  lib/               API HTTP, moeda e utilidades
  router.tsx         configuração do roteador
  server.ts start.ts inicialização do servidor
  styles.css         tema (azul royal + amarelo/ouro) e tokens de design
```

## Administração e validação

O painel `/admin` usa login real pela API Java; `/dogmania-painel` é um atalho. Não existem senha de demonstração ou persistência local de produtos. Crie o primeiro administrador conforme `../backend-api/README.md`. O token fica no `sessionStorage` da aba e expira conforme o servidor; logout o remove.

Produtos, imagens e disponibilidade são gerenciados pelo painel e persistidos no banco. O catálogo consulta a API periodicamente para refletir mudanças feitas em outra aba. A API deve permitir a origem do frontend em `CORS_ORIGINS`.

Execute `bun run build` e `bun x tsc --noEmit` nesta pasta. Para homologação e publicação, consulte o README principal e a documentação de backend e banco. Preserve os pontos de entrada TanStack/Lovable e os módulos de captura de erros. Não edite `routeTree.gen.ts` manualmente.

## Tecnologias

React 19, TanStack Start (Vite), Tailwind CSS v4, Embla Carousel, TypeScript.
