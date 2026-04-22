-- =============================================================================
-- Staging: stg_grupo_veiculo
-- Fonte: locadora_dw.grupo (OLTP)
-- Propósito: Normalizar dados de grupos/categorias de veículos.
-- =============================================================================

model (
    name staging.stg_grupo_veiculo,
    kind view,
    tags ['staging', 'grupo', 'veiculo'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de grupos/categorias de veículos (econômico, SUV, luxo, etc.)'
);

select
    g.id_grupo as id_grupo_source,
    upper(trim(g.codigo_grupo)) as codigo_grupo,  -- ECN, INT, SUV, EXC, LUX, VAN, PIC
    trim(g.nome_grupo) as nome_grupo,
    trim(g.descricao) as descricao,
    g.valor_diaria_base,
    g.capacidade_passageiros,
    g.capacidade_bagagem,

    g.created_at as created_at_source,
    g.updated_at as updated_at_source,
    g.deleted_at,
    (g.deleted_at is not null) as is_deleted,

    now() at time zone 'UTC' as staged_at

from locadora_dw.grupo_veiculo as g
;
