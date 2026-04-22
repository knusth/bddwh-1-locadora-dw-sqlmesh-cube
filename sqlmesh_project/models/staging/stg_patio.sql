-- =============================================================================
-- Staging: stg_patio
-- Fonte: locadora_dw.patio (OLTP)
-- Propósito: Normalizar dados de pátios/agências.
-- =============================================================================

model (
    name staging.stg_patio,
    kind view,
    tags ['staging', 'patio'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de pátios com padronização de localização e tipo'
);

select
    p.id_patio as id_patio_source,
    trim(p.nome_patio) as nome_patio,
    upper(trim(p.tipo_patio)) as tipo_patio,  -- 'AEROPORTO', 'SHOPPING', 'RODOVIARIA'
    trim(p.cidade) as cidade,
    upper(trim(p.estado)) as estado,
    regexp_replace(trim(p.cep), '[^0-9]', '', 'g') as cep_numerico,
    regexp_replace(trim(p.telefone), '[^0-9]', '', 'g') as telefone_numerico,

    p.created_at as created_at_source,
    p.updated_at as updated_at_source,
    p.deleted_at,
    (p.deleted_at is not null) as is_deleted,

    now() at time zone 'UTC' as staged_at

from locadora_dw.patio as p
;
