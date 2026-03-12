# Sistema de Aferição de Pressão Arterial - TODO

## Backend
- [x] Schema do banco de dados: tabela `blood_pressure_readings`
- [x] Migração e aplicação do schema via webdev_execute_sql
- [x] Helper de DB: inserir medição
- [x] Helper de DB: listar medições por usuário com filtros
- [x] Helper de DB: estatísticas (média, min, max)
- [x] Helper de DB: última medição
- [x] Rota tRPC: `readings.create`
- [x] Rota tRPC: `readings.list` (com filtros de período)
- [x] Rota tRPC: `readings.stats`
- [x] Rota tRPC: `readings.delete`
- [x] Lógica de classificação clínica da pressão arterial

## Frontend
- [x] Design system: paleta de cores elegante (tons de azul/índigo), tipografia, variáveis CSS
- [x] DashboardLayout com navegação mobile-first
- [x] Página: Landing/Home (não autenticado)
- [x] Página: Dashboard principal com última medição e estatísticas
- [x] Componente: Card de classificação da pressão
- [x] Componente: Formulário de registro de medição
- [x] Página: Histórico de medições com filtros por período
- [x] Página: Gráficos de evolução temporal (Recharts)
- [x] Componente: Tabela de medições com paginação
- [x] Exportação de relatório em PDF
- [x] Estados de loading, empty e error em todas as páginas
- [x] Design responsivo mobile-first

## Testes
- [x] Testes Vitest para lógica de classificação clínica
- [x] Testes Vitest para rotas tRPC de medições


## Funcionalidades Adicionais
- [x] Schema: tabela `user_goals` (metas de pressão arterial por usuário)
- [x] Schema: tabela `reminders` (lembretes de medição)
- [x] Schema: tabela `shared_links` (links de compartilhamento com médico)
- [x] Rota tRPC: `goals.get` e `goals.update`
- [x] Rota tRPC: `reminders.list`, `reminders.create`, `reminders.delete`
- [x] Rota tRPC: `sharing.createLink` e `sharing.getByToken`
- [x] Página: Perfil com metas pessoais e alertas
- [x] Página: Configuração de lembretes
- [x] Página: Compartilhamento com médico (gerar link)
- [x] Página pública: Visualização de histórico compartilhado
- [x] Integração de menu de configurações no DashboardLayout
