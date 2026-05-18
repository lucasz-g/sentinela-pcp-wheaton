# Deploy POC no Portainer

Este projeto foi configurado para subir no Portainer como uma POC/dev, sem banco de dados e sem servidor OAuth externo. A aplicacao roda em modo de desenvolvimento usando o `Dockerfile.dev`, expondo a porta `3000`.

## Arquivos usados

- `docker-compose.yml`: define a stack usada pelo Portainer.
- `Dockerfile.dev`: instala as dependencias e executa `npm run dev`.

## Stack no Portainer

No Portainer, a stack deve apontar para o repositorio Git do projeto.

Campos principais:

- **Compose path**: `docker-compose.yml`
- **Repository reference**: pode ficar vazio para usar a branch padrao, ou usar `refs/heads/main`
- **Skip TLS Verification**: deixar desmarcado, salvo se o Git usar certificado interno/self-signed

O compose atual cria o servico `sentinela-pcp`, publica a aplicacao em `3000:3000` e mantem os arquivos enviados em um volume Docker chamado `sentinela_uploads`.

## Ambiente da POC

A stack nao configura `DATABASE_URL` nem um OAuth real. Isso e intencional para a POC.

Consequencias:

- funcionalidades publicas e telas sem dependencia de login podem funcionar normalmente;
- rotas ou telas que exigirem autenticacao podem falhar ou retornar usuario ausente;
- dados persistidos em banco nao estarao disponiveis;
- uploads em `/app/uploads` ficam preservados pelo volume `sentinela_uploads`.

## Reconstrucao da imagem

O servico usa:

```yaml
pull_policy: build
```

Em ambiente Docker standalone, isso instrui o Docker/Portainer a reconstruir a imagem quando a stack for redeployada. Ou seja, ao atualizar a stack pelo Portainer, o container deve ser recriado com o codigo mais recente do repositorio.

## Mudancas no repositorio remoto

Um push no repositorio remoto nao atualiza automaticamente o container por si so.

Para que mudancas no Git afetem o container rodando, uma destas acoes precisa acontecer:

1. redeploy manual da stack no Portainer;
2. webhook do Portainer chamado apos o push;
3. pipeline CI/CD chamando o webhook ou atualizando a stack;
4. recurso de auto-update/GitOps do Portainer, se estiver habilitado nessa instalacao.

Sem uma dessas automacoes, o container continua rodando a versao que foi construida no ultimo deploy.

## Passo a passo executado

1. Conferimos que o projeto ja possuia `Dockerfile`, `Dockerfile.dev` e `docker-compose.yml`.
2. Identificamos que o deploy seria uma POC/dev, sem `DATABASE_URL` e sem servidor OAuth real.
3. Ajustamos o `docker-compose.yml` para usar o `Dockerfile.dev`, rodar em `NODE_ENV=development` e expor a porta `3000`.
4. Removemos o bind mount do codigo local (`.:/app`) para evitar problemas no Portainer.
5. Mantivemos apenas o volume `sentinela_uploads:/app/uploads` para preservar arquivos enviados.
6. Adicionamos `pull_policy: build` para reconstruir a imagem quando a stack for redeployada.
7. No Portainer, criamos a stack apontando para o repositorio Git.
8. Informamos `docker-compose.yml` no campo **Compose path**.
9. Deixamos **Skip TLS Verification** desmarcado.
10. Deixamos **Repository reference** vazio ou apontando para a branch desejada, como `refs/heads/main`.
11. Fizemos o deploy da stack.
12. Validamos o acesso da aplicacao pela porta publicada, em `http://IP_DO_SERVIDOR:3000`.

## Fluxo recomendado para POC

1. Fazer alteracoes no codigo.
2. Commitar e enviar para a branch usada pela stack.
3. No Portainer, redeployar a stack.
4. Acessar `http://IP_DO_SERVIDOR:3000`.

Para automatizar, habilite o webhook da stack no Portainer e configure o repositorio ou pipeline para chamar esse webhook apos cada push na branch da POC.
