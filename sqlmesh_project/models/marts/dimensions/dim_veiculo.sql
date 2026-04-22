-- =============================================================================
-- Dimensão: dim_veiculo
-- Tipo: SCD Tipo 2
-- Chave Natural: id_veiculo_source
-- Mudanças típicas: patio_atual, km_atual, status, cor (em caso de reparo/pintura)
-- =============================================================================

model (
    name marts.dim_veiculo,
    kind scd_type_2_by_time (
        unique_key id_veiculo_source,
        valid_from_name valid_from_dttm,
        valid_to_name valid_to_dttm,
        updated_at_name updated_at_source
    ),
    tags ['dimension', 'scd2', 'veiculo'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão veículo com histórico de mudanças de pátio, KM e status'
);

select
    md5(
        cast(id_veiculo_source as text)
        || '-'
        || coalesce(to_char(updated_at_source, 'YYYY-MM-DD HH24:MI:SS'), '1900-01-01')
    ) as sk_veiculo,

    id_veiculo_source,
    id_grupo_source,
    id_patio_base_source,
    id_patio_atual_source,
    placa,
    chassis,
    marca,
    modelo,
    ano_fabricacao,
    ano_modelo,
    cor,
    km_atual,
    status_veiculo,

    created_at_source,
    updated_at_source,
    is_deleted,
    staged_at,

    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_veiculo
where is_deleted = false
;
