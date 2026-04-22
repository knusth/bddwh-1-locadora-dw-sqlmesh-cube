-- =============================================================================
-- Fato: fato_ocupacao_patio
-- Granularidade: Uma linha por pátio por dia (snapshot periódico)
-- Tipo: FULL TABLE (reprocessamento diário aceitável para volume atual)
-- Propósito: Medir taxa de ocupação e disponibilidade de frota por pátio/dia
-- =============================================================================

model (
    name marts.fato_ocupacao_patio,
    kind full,
    tags ['fact', 'ocupacao', 'snapshot'],
    owner 'data_engineering@locadora.dw',
    description 'Snapshot diário de ocupação de pátios baseado em locações ativas e frota total'
);

with
-- Série de datas dentro do intervalo analisado (últimos 2 anos para performance inicial)
dias as (
    select generate_series(
        date_trunc('day', now() at time zone 'UTC' - interval '2 years'),
        date_trunc('day', now() at time zone 'UTC'),
        interval '1 day'
    )::date as data_referencia
),

-- Frota total por pátio (última versão conhecida de cada veículo)
frota_por_patio as (
    select
        id_patio_atual_source as id_patio_source,
        count(*) as total_veiculos
    from staging.stg_veiculo
    where is_deleted = false
    group by id_patio_atual_source
),

-- Locações ativas em cada dia (a locação cobre o dia se data_retirada <= dia < data_devolucao_efetiva)
locacoes_ativas as (
    select
        l.id_patio_retirada_source as id_patio_source,
        d.data_referencia,
        count(*) as veiculos_em_uso,
        count(distinct l.id_veiculo_source) as veiculos_distintos_em_uso,
        sum(l.valor_total) filter (where l.data_retirada::date = d.data_referencia) as valor_locacoes_iniciadas
    from dias as d
    cross join staging.stg_locacao as l
    where l.is_deleted = false
        and l.data_retirada::date <= d.data_referencia
        and (
            l.data_devolucao_efetiva::date > d.data_referencia
            or (l.data_devolucao_efetiva is null and l.status_locacao in ('EM_ANDAMENTO', 'ATRASADA', 'AGENDADA'))
        )
    group by l.id_patio_retirada_source, d.data_referencia
)

select
    dp.sk_patio,
    dt.sk_data,
    d.data_referencia,
    p.id_patio_source,

    coalesce(f.total_veiculos, 0) as total_veiculos,
    coalesce(la.veiculos_em_uso, 0) as veiculos_em_uso,
    coalesce(la.veiculos_distintos_em_uso, 0) as veiculos_distintos_em_uso,

    -- Taxa de ocupação (evita divisão por zero)
    case
        when coalesce(f.total_veiculos, 0) > 0
        then round(la.veiculos_em_uso::numeric / f.total_veiculos, 4)
        else 0
    end as taxa_ocupacao,

    -- Veículos disponíveis (frota - em uso)
    greatest(coalesce(f.total_veiculos, 0) - coalesce(la.veiculos_em_uso, 0), 0) as veiculos_disponiveis,

    coalesce(la.valor_locacoes_iniciadas, 0) as valor_locacoes_iniciadas,

    now() at time zone 'UTC' as dwh_loaded_at

from dias as d
cross join staging.stg_patio as p
left join frota_por_patio as f
    on p.id_patio_source = f.id_patio_source
left join locacoes_ativas as la
    on p.id_patio_source = la.id_patio_source
    and d.data_referencia = la.data_referencia
left join marts.dim_patio as dp
    on p.id_patio_source = dp.id_patio_source
left join marts.dim_tempo as dt
    on d.data_referencia = dt.data_referencia
where p.is_deleted = false
;
