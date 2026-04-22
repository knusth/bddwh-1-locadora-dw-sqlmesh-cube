-- =============================================================================
-- Dimensão: dim_patio
-- Tipo: SCD Tipo 1 (overwrite)
-- Justificativa: Pátios raramente mudam nome/localização; se mudar, overwrite é aceitável
-- =============================================================================

model (
    name marts.dim_patio,
    kind full,
    tags ['dimension', 'scd1', 'patio'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão pátios/agências da locadora (SCD Tipo 1 - overwrite)'
);

select
    -- Surrogate key simples baseada na chave natural
    id_patio_source as sk_patio,
    id_patio_source,
    nome_patio,
    tipo_patio,
    cidade,
    estado,
    cep_numerico,
    telefone_numerico,

    is_deleted,
    staged_at,
    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_patio
;
