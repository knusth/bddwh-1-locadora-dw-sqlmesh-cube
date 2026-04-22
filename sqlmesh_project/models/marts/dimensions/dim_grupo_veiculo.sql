-- =============================================================================
-- Dimensão: dim_grupo_veiculo
-- Tipo: SCD Tipo 1
-- Propósito: Classificação de veículos em categorias conforme benchmark locadoras
-- =============================================================================

model (
    name marts.dim_grupo_veiculo,
    kind full,
    tags ['dimension', 'scd1', 'grupo', 'veiculo'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão de grupos/categorias de veículos com tarifa base'
);

select
    id_grupo_source as sk_grupo_veiculo,
    id_grupo_source,
    codigo_grupo,
    nome_grupo,
    descricao,
    valor_diaria_base,
    capacidade_passageiros,
    capacidade_bagagem,

    is_deleted,
    staged_at,
    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_grupo_veiculo
;
