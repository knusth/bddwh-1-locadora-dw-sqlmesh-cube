-- =============================================================================
-- Fato: fato_transicao_patio
-- Granularidade: Uma linha por pátio origem, pátio destino, período (mês)
-- Tipo: FULL TABLE
-- Propósito: Alimentar modelo de Cadeia de Markov para previsão de ocupação e
--            reposição de frota entre pátios.
-- =============================================================================

model (
    name marts.fato_transicao_patio,
    kind full,
    tags ['fact', 'markov', 'transicao', 'patio'],
    owner 'data_engineering@locadora.dw',
    description 'Matriz de transição de devoluções entre pátios para modelagem de Cadeia de Markov'
);

with
transicoes as (
    select
        l.id_patio_retirada_source,
        l.id_patio_devolucao_source,
        date_trunc('month', l.data_retirada)::date as mes_referencia,
        count(*) as total_transicoes,
        avg(l.km_rodados) as media_km_rodados,
        avg(l.duracao_efetiva_dias) as media_duracao_dias,
        sum(l.valor_total) as valor_total_transicoes
    from staging.stg_locacao as l
    where l.is_deleted = false
        and l.status_locacao = 'CONCLUIDA'
        and l.id_patio_devolucao_source is not null
    group by
        l.id_patio_retirada_source,
        l.id_patio_devolucao_source,
        date_trunc('month', l.data_retirada)::date
),

-- Total de locações por pátio de origem e mês (para cálculo de probabilidade)
totais_origem as (
    select
        id_patio_retirada_source,
        mes_referencia,
        sum(total_transicoes) as total_saidas
    from transicoes
    group by id_patio_retirada_source, mes_referencia
)

select
    dp_origem.sk_patio as sk_patio_origem,
    dp_destino.sk_patio as sk_patio_destino,
    dt.sk_data as sk_mes_referencia,
    t.mes_referencia,
    t.id_patio_retirada_source as id_patio_origem_source,
    t.id_patio_devolucao_source as id_patio_destino_source,

    t.total_transicoes,
    to.total_saidas,

    -- Probabilidade de transição P(destino | origem, mês)
    round(t.total_transicoes::numeric / nullif(to.total_saidas, 0), 4) as probabilidade_transicao,

    -- Métricas de negócio associadas à transição
    round(t.media_km_rodados::numeric, 2) as media_km_rodados,
    round(t.media_duracao_dias::numeric, 2) as media_duracao_dias,
    t.valor_total_transicoes,

    now() at time zone 'UTC' as dwh_loaded_at

from transicoes as t
left join totais_origem as to
    on t.id_patio_retirada_source = to.id_patio_retirada_source
    and t.mes_referencia = to.mes_referencia
left join marts.dim_patio as dp_origem
    on t.id_patio_retirada_source = dp_origem.id_patio_source
left join marts.dim_patio as dp_destino
    on t.id_patio_devolucao_source = dp_destino.id_patio_source
left join marts.dim_tempo as dt
    on t.mes_referencia = dt.data_referencia
;
