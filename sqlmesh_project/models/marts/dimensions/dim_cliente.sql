-- =============================================================================
-- Dimensão: dim_cliente
-- Tipo: SCD Tipo 2 (Slowly Changing Dimension Type 2)
-- Chave Natural: id_cliente_source (do OLTP)
-- Chave Surrogate: sk_cliente (hash MD5 da chave natural + valid_from)
-- Rastreamento: updated_at_source determina quando um registro mudou
-- =============================================================================

model (
    name marts.dim_cliente,
    kind scd_type_2_by_time (
        unique_key id_cliente_source,
        valid_from_name valid_from_dttm,
        valid_to_name valid_to_dttm,
        updated_at_name updated_at_source
    ),
    tags ['dimension', 'scd2', 'cliente'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão cliente com histórico completo de alterações (SCD2)'
);

select
    -- Surrogate Key: hash da chave natural + timestamp de início de validade
    -- SQLMesh gerencia valid_from_dttm internamente no SCD2, mas geramos SK
    md5(
        cast(id_cliente_source as text)
        || '-'
        || coalesce(to_char(updated_at_source, 'YYYY-MM-DD HH24:MI:SS'), '1900-01-01')
    ) as sk_cliente,

    -- Chave natural e atributos descritivos
    id_cliente_source,
    nome_cliente,
    cpf,
    email,
    telefone_numerico,
    endereco,
    cidade,
    estado,
    cep_numerico,
    data_nascimento,
    tipo_cliente,

    -- Controle de auditoria do staging
    created_at_source,
    updated_at_source,
    is_deleted,
    staged_at,

    -- Controle SCD2 gerenciado pelo SQLMesh (as colunas valid_from_dttm e valid_to_dttm
    -- são preenchidas automaticamente pelo kind scd_type_2_by_time)
    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_cliente
where is_deleted = false
;
