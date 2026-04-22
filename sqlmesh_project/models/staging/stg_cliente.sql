-- =============================================================================
-- Staging: stg_cliente
-- Fonte: locadora_dw.cliente (OLTP)
-- Propósito: Normalizar e limpar dados de cliente para o DWH.
-- =============================================================================

model (
    name staging.stg_cliente,
    kind view,
    tags ['staging', 'cliente'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de clientes extraído do OLTP com padronização de formato e soft-delete flag'
);

select
    -- Chave natural do OLTP
    c.id_cliente as id_cliente_source,

    -- Dados demográficos padronizados
    trim(c.nome_cliente) as nome_cliente,
    trim(c.cpf) as cpf,
    trim(lower(c.email)) as email,
    regexp_replace(trim(c.telefone), '[^0-9]', '', 'g') as telefone_numerico,
    trim(c.endereco) as endereco,
    trim(c.cidade) as cidade,
    upper(trim(c.estado)) as estado,
    regexp_replace(trim(c.cep), '[^0-9]', '', 'g') as cep_numerico,
    c.data_nascimento as data_nascimento,
    c.tipo_cliente as tipo_cliente,  -- 'PF' ou 'PJ'

    -- Auditoria e controle de carga
    c.created_at as created_at_source,
    c.updated_at as updated_at_source,
    c.deleted_at,
    (c.deleted_at is not null) as is_deleted,

    -- Metadados do staging
    now() at time zone 'UTC' as staged_at

from locadora_dw.cliente as c
where true
    -- Filtra registros que ainda não existiam no início do DWH se necessário
    -- c.created_at >= '2020-01-01'
;
