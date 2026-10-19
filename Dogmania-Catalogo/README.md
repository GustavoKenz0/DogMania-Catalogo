# Dogmania — frontend

Catálogo digital responsivo da Dogmania Pet Shop. Vitrine de produtos com busca,
filtro por categoria e compra iniciada pelo WhatsApp do proprietário.

## Como rodar

Configure primeiro a API Java e o banco conforme [README do projeto](../README.md). Use Bun para executar este frontend. Copie `.env.example` para `.env.local` e ajuste `VITE_API_URL`, se necessário. A variável é pública: não coloque senhas ou chaves de serviço nela.

```bash
bun install      # instala as dependências
bun dev          # frontend em http://127.0.0.1:8081; API em localhost:8080
bun build        # gera a versão de produção
bun run preview  # serve a versão gerada
```

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
