-- =============================================================================
-- Fato: fato_reserva
-- Granularidade: Uma linha por reserva
-- Tipo: INCREMENTAL_BY_TIME_RANGE (particionado por data_reserva)
-- Métricas: valor_previsto, duracao_prevista_dias, taxas de conversão/cancelamento
-- =============================================================================

model (
    name marts.fato_reserva,
    kind full,
    tags ['fact', 'reserva', 'transacional'],
    owner 'data_engineering@locadora.dw',
    description 'Fato transacional de reservas com funil de conversão e taxas de cancelamento/no-show'
);

select
    -- Degenerate dimension
    r.id_reserva_source as id_reserva,

    -- Foreign Keys
    dc.sk_cliente,
    dg.sk_grupo_veiculo,
    dp_ret.sk_patio as sk_patio_retirada,
    dp_dev.sk_patio as sk_patio_devolucao,
    dt.sk_data as sk_data_reserva,

    -- Datas do ciclo de vida
    r.data_reserva,
    r.data_retirada_prevista,
    r.data_devolucao_prevista,
    r.data_cancelamento,

    -- Status e métricas
    r.status_reserva,
    r.duracao_prevista_dias,
    r.valor_previsto,

    -- Flags de análise de funil
    r.flag_no_show,
    r.flag_cancelada,
    r.flag_convertida_locacao,

    -- Calculado: dias entre reserva e retirada prevista (lead time)
    (r.data_retirada_prevista::date - r.data_reserva::date) as lead_time_dias,

    -- Auditoria
    r.staged_at,
    now() at time zone 'UTC' as dwh_loaded_at

from staging.stg_reserva as r

left join marts.dim_cliente as dc
    on r.id_cliente_source = dc.id_cliente_source
    and dc.valid_to_dttm is null

left join marts.dim_grupo_veiculo as dg
    on r.id_grupo_source = dg.id_grupo_source

left join marts.dim_patio as dp_ret
    on r.id_patio_retirada_source = dp_ret.id_patio_source

left join marts.dim_patio as dp_dev
    on r.id_patio_devolucao_source = dp_dev.id_patio_source

left join marts.dim_tempo as dt
    on r.data_reserva::date = dt.data_referencia

where r.is_deleted = false
;
