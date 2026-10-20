# Instruções para agentes — Dogmania

## Contexto e relatório único

Por solicitação do usuário, o arquivo `CONTEXTO_DO_PROJETO.md`, nesta raiz, é a
referência única de contexto e histórico contínuo das alterações do projeto.

- Leia esse arquivo antes de alterar o código; confira o código atual antes de
  assumir que uma informação histórica ainda se aplica.
- Em toda entrega que altere arquivos, atualize o resumo do estado atual quando
  necessário e acrescente uma entrada ao histórico no mesmo arquivo.
- Registre data (America/Sao_Paulo), pedido, alterações e motivos, arquivos afetados,
  verificações realmente executadas e seus resultados, limitações e pendências.
- Inclua mudanças em código, banco, dependências, configuração e documentação.
  Não é necessário criar uma entrada para uma conversa ou inspeção sem alterações.
- Preserve as entradas anteriores. Corrija informações superadas no resumo e
  explique a correção na nova entrada; não reescreva o passado como se tivesse
  sido verificado novamente.
- Não crie um relatório novo por tarefa nem um histórico paralelo. READMEs e
  documentação técnica continuam permitidos, com o trabalho registrado no arquivo único.
- Não registre senhas, tokens, chaves, connection strings com credenciais ou dados
  privados. Registre somente nomes das variáveis e referências aos exemplos seguros.
- Uma alteração só está documentada quando essa atualização foi feita antes da
  resposta final. Caso haja bloqueio, registre o que foi feito e o que ficou pendente.

Os relatórios já existentes são registros históricos, anteriores a essa regra.
Respeite também as instruções específicas de subdiretórios, incluindo o arquivo
`Dogmania-Catalogo/AGENTS.md` e as orientações de integração com Lovable.

## Documento privado de acessos

O usuário solicitou expressamente um documento local com os acessos configurados.
Essa entrega fica exclusivamente em `.private/ACESSOS_DO_SISTEMA.local.txt`,
ignorada pelo Git e com permissões restritas. Nunca copie seu conteúdo para este
arquivo, para `CONTEXTO_DO_PROJETO.md`, READMEs, commits, logs ou mensagens.
Senhas existentes são digitadas pelo responsável em campo local oculto; senhas
novas podem ser geradas criptograficamente. Registre no histórico apenas o caminho
do documento, o estado da configuração e as verificações sem valores privados.
Uma permissão ampla para configurar o computador não autoriza commit/push,
publicação ou alteração de serviços alheios ao projeto.

## GitHub: aprovação obrigatória antes de commit e push

Destino informado pelo usuário: `https://github.com/GustavoKenz0/DogMania-Catalogo.git`.
O repositório local abrange esta raiz inteira (frontend, backend, banco e documentos).

Por solicitação expressa do usuário, alterações concluídas devem ser preparadas
para sincronização com o GitHub, mas cada commit e cada push dependem de aprovação
prévia e explícita do usuário. Uma aprovação pode cobrir os dois atos quando o
pedido identificar o conteúdo, a mensagem de commit e o destino de envio.

- Antes de pedir aprovação, conclua as mudanças autorizadas, atualize o arquivo de
  contexto, prepare/revise o diff e confira todos os arquivos selecionados.
- Verifique arquivos ignorados e procure segredos no conteúdo selecionado. Nunca
  suba credenciais reais, chaves privadas, dumps, configurações locais ou caches.
  Exemplos de configuração só podem ser incluídos sem segredos funcionais.
- Apresente o resumo, validações, mensagem de commit e repositório/branch de destino.
  Espere a resposta do usuário antes de criar o commit ou enviar qualquer conteúdo.
- O pedido de modificar o sistema não equivale a aprovar commit/push. Não trate
  uma aprovação de entrega anterior como autorização para futuras alterações.
- Não contorne essa regra por GitHub API, upload de arquivos, Actions ou criação
  automática de commits. Não configure publicação automática sem aprovação.
- Se o usuário aprovar ambos para a entrega revisada, execute ambos e confirme o
  resultado. Se pedir novos ajustes materiais antes do envio, apresente-os para
  revisão antes de prosseguir. Não faça force push nem reescreva histórico publicado.
