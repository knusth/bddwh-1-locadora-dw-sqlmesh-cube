-- =============================================================================
-- Inicialização do Banco DWH: locadora_dwh
-- Propósito: Criar schemas, roles e extensões necessárias para o SQLMesh
-- Executado automaticamente na primeira inicialização do container postgres-dwh
-- =============================================================================

-- Extensões úteis para analytics
create extension if not exists pg_stat_statements;
create extension if not exists pg_trgm;        -- busca textual em dimensões
create extension if not exists btree_gin;      -- índices compostos GIN

-- Schemas do Data Warehouse
-- staging: dados brutos/normalizados vindos do OLTP
-- marts: dimensões e fatos prontos para consumo analítico
-- raw: (opcional) landing zone para dados externos
-- audit: logs e métricas de qualidade

create schema if not exists staging;
comment on schema staging is 'Camada de staging - dados extraídos e levemente transformados do OLTP';

create schema if not exists marts;
comment on schema marts is 'Camada semântica - dimensões e fatos para BI e analytics';

create schema if not exists raw;
comment on schema raw is 'Landing zone para dados brutos e externos';

create schema if not exists audit;
comment on schema audit is 'Logs de auditoria, data quality e lineage';

-- Permissões para o usuário administrativo (herdado do POSTGRES_USER)
-- O SQLMesh criará objetos com este usuário
grant all privileges on schema staging, marts, raw, audit to current_user;

-- Configuração de search_path para facilitar acesso via SQLMesh
alter database locadora_dwh set search_path to staging, marts, public;
