# Sentinela PCP - TODO

## Backend
- [x] Criar endpoint POST /api/upload para processar CSV
- [x] Implementar lógica de parsing do CSV com Pandas
- [x] Implementar cálculo de caminho crítico
- [x] Implementar cálculo de progresso de OPs
- [x] Implementar cálculo de status de atraso
- [x] Implementar cálculo de tempo restante
- [x] Retornar JSON estruturado conforme schema

## Frontend
- [x] Criar componente de Upload (Dropzone)
- [x] Criar estado de Empty State inicial
- [x] Criar componente Accordion para lista de OPs
- [x] Criar Header do Accordion com Badge de Status
- [x] Criar Barra de Progresso no Header
- [x] Criar visualização de Fluxo (Stepper Horizontal)
- [x] Implementar estilização dinâmica de operações
- [x] Implementar destaque de Peça Crítica (borda pulsante)
- [x] Integrar upload com backend

## Design
- [x] Definir paleta de cores (Verde/Amarelo/Vermelho para status)
- [x] Definir tipografia
- [x] Criar logo/identidade visual

## Novas Funcionalidades - Filtros e Busca

### Filtros
- [x] Criar componente de filtro por status (Todos/Atrasado/No Prazo/Concluído)
- [x] Implementar lógica de filtragem por status
- [x] Criar campo de busca por produto (código ou descrição)
- [x] Implementar lógica de busca em tempo real

### Ordenação
- [x] Criar seletor de ordenação (Prazo/Progresso/Status)
- [x] Implementar ordenação por prazo (mais urgente primeiro)
- [x] Implementar ordenação por progresso
- [x] Implementar ordenação por status

### UI/UX
- [x] Criar barra de ferramentas com filtros e busca
- [x] Adicionar contador de resultados filtrados
- [x] Adicionar botão de limpar filtros
- [x] Manter estado dos filtros durante a sessão

## Sistema de Alertas

### Lógica de Alertas
- [x] Definir critérios de alerta (prazo próximo, atrasado, crítico)
- [x] Implementar função para calcular urgência de OPs
- [x] Criar categorias de alerta (Urgente, Atenção, Normal)
- [x] Implementar lógica de priorização de alertas

### Componentes UI
- [x] Criar componente AlertPanel para exibir alertas
- [x] Criar componente AlertBadge para indicadores visuais
- [x] Adicionar ícone de sino com contador de alertas no header
- [x] Criar modal/drawer de notificações
- [x] Adicionar animações para alertas urgentes

### Funcionalidades
- [x] Mostrar contador de alertas no header
- [x] Exibir painel de alertas destacado no dashboard
- [x] Filtrar OPs por nível de alerta
- [x] Adicionar som/notificação visual para alertas críticos
- [x] Permitir marcar alertas como lidos

## Filtro de Produtos Específicos

### Backend
- [x] Criar lista de produtos permitidos (MOLDE, BLANK, BAFFLE, etc.)
- [x] Implementar filtro no processamento do CSV
- [x] Descartar produtos que não estão na lista
- [x] Atualizar lógica de agrupamento para considerar apenas produtos filtrados

### Testes
- [x] Testar com CSV completo
- [x] Verificar contagem de OPs após filtragem
- [x] Validar que apenas produtos permitidos aparecem no dashboard

## Filtro por Data de Emissão

### Backend
- [x] Adicionar filtro para processar apenas OPs com data de emissão >= 2024
- [x] Implementar função de validação de data
- [x] Aplicar filtro após filtragem de produtos
- [x] Testar com CSV completo

## Reorganização de Hierarquia (PREFIXO → PEÇA → OP)

### Backend
- [x] Modificar lógica de agrupamento para PREFIXO → PEÇA → OP
- [x] Extrair prefixo do código do produto
- [x] Agrupar primeiro por prefixo
- [x] Dentro de cada prefixo, agrupar por peça
- [x] Dentro de cada peça, agrupar por OP
- [x] Atualizar cálculo de caminho crítico para nova hierarquia
- [x] Atualizar JSON schema de saída

### Frontend
- [x] Criar componente de accordion para Prefixos
- [x] Criar componente de accordion para Peças dentro de Prefixo
- [x] Criar componente de accordion para OPs dentro de Peça
- [x] Atualizar visualização de operações
- [x] Ajustar filtros para nova hierarquia
- [x] Ajustar sistema de alertas para nova hierarquia

### Testes
- [x] Testar nova hierarquia com CSV completo
- [x] Verificar agrupamento por prefixo
- [x] Verificar agrupamento por peça
- [x] Verificar agrupamento por OP
- [x] Validar identificação de caminho crítico
- [x] Validar contadores e estatísticas

## Correções Urgentes

### Bug de Carregamento
- [x] Investigar por que a página não carrega após processamento do CSV
- [x] Verificar erros no console do navegador
- [x] Corrigir problema de renderização

### Correção de Hierarquia
- [x] Verificar ordem atual da hierarquia
- [x] Corrigir para ordem correta: PREFIXO → PEÇA → OP
- [x] Testar agrupamento correto

### Melhorias de UI
- [x] Adicionar scroll horizontal nas operações
- [x] Ajustar layout das "caixinhas de progresso"
- [x] Melhorar visualização do stepper

### Filtro de Data
- [x] Verificar se filtro de data 2024+ está ativo
- [x] Garantir que apenas dados de 2024+ sejam processados
- [x] Testar com CSV completo

## Suporte a Arquivos Excel (.xlsx)

### Backend
- [x] Instalar biblioteca para processar arquivos Excel
- [x] Adicionar função para ler arquivos .xlsx
- [x] Converter dados Excel para o mesmo formato do CSV
- [x] Atualizar endpoint de upload para aceitar .xlsx

### Frontend
- [x] Atualizar FileUpload para aceitar .xlsx
- [x] Atualizar mensagens e validações
- [x] Testar upload de arquivo Excel
