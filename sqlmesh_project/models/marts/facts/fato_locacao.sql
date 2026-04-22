-- =============================================================================
-- Fato: fato_locacao
-- Granularidade: Uma linha por locação (fato transacional)
-- Tipo: INCREMENTAL_BY_TIME_RANGE (particionado por data_retirada)
-- Métricas: valor_total, km_rodados, duracao_efetiva_dias
-- =============================================================================

model (
    name marts.fato_locacao,
    kind full,
    tags ['fact', 'locacao', 'transacional'],
    owner 'data_engineering@locadora.dw',
    description 'Fato transacional de locações com chaves surrogate das dimensões e métricas de negócio'
);

select
    -- Degenerate dimensions (identificadores do processo transacional)
    l.id_locacao_source as id_locacao,
    l.id_reserva_source as id_reserva,

    -- Foreign Keys para dimensões (versão atual - SCD1 ou SCD2 ativa)
    -- NOTA: Em produção robusta, usar lookup temporal pela data_retirada
    dc.sk_cliente,
    dv.sk_veiculo,
    dp_ret.sk_patio as sk_patio_retirada,
    dp_dev.sk_patio as sk_patio_devolucao,
    dt.sk_data as sk_data_retirada,
    dt_dev.sk_data as sk_data_devolucao,

    -- Atributos da locação (degenerate / descriptive)
    l.data_retirada,
    l.data_devolucao_prevista,
    l.data_devolucao_efetiva,
    l.status_locacao,

    -- Métricas
    l.duracao_efetiva_dias,
    l.km_retirada,
    l.km_devolucao,
    l.km_rodados,
    l.valor_total,

    -- Flags de qualidade/negócio
    l.flag_atraso,
    l.flag_atraso_em_aberto,
    l.flag_concluida,

    -- Auditoria
    l.staged_at,
    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_locacao as l

-- Lookup dimensão cliente (versão atual)
left join marts.dim_cliente as dc
    on l.id_cliente_source = dc.id_cliente_source
    and dc.valid_to_dttm is null  -- versão ativa no SCD2

-- Lookup dimensão veículo (versão atual)
left join marts.dim_veiculo as dv
    on l.id_veiculo_source = dv.id_veiculo_source
    and dv.valid_to_dttm is null

-- Lookup pátio retirada
left join marts.dim_patio as dp_ret
    on l.id_patio_retirada_source = dp_ret.id_patio_source

-- Lookup pátio devolução
left join marts.dim_patio as dp_dev
    on l.id_patio_devolucao_source = dp_dev.id_patio_source

-- Lookup tempo retirada
left join marts.dim_tempo as dt
    on l.data_retirada::date = dt.data_referencia

-- Lookup tempo devolução
left join marts.dim_tempo as dt_dev
    on l.data_devolucao_efetiva::date = dt_dev.data_referencia

where l.is_deleted = false
;
