-- =============================================================================
-- Staging: stg_locacao
-- Fonte: locadora_dw.locacao (OLTP)
-- Propósito: Preparar locações para fatos transacionais e ocupação.
-- =============================================================================

model (
    name staging.stg_locacao,
    kind view,
    tags ['staging', 'locacao'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de locações com cálculo de KM rodados, duração efetiva e status final'
);

select
    l.id_locacao as id_locacao_source,
    l.id_reserva as id_reserva_source,
    l.id_cliente as id_cliente_source,
    l.id_veiculo as id_veiculo_source,
    l.id_patio_retirada as id_patio_retirada_source,
    l.id_patio_devolucao as id_patio_devolucao_source,

    -- Datas do ciclo de vida
    l.data_retirada,
    l.data_devolucao_prevista,
    l.data_devolucao_efetiva,

    -- Duração efetiva (null se ainda não devolvido)
    case
        when l.data_devolucao_efetiva is not null
        then (l.data_devolucao_efetiva::date - l.data_retirada::date)
        else null
    end as duracao_efetiva_dias,

    -- Indicadores de atraso
    case
        when l.data_devolucao_efetiva is not null
             and l.data_devolucao_efetiva > l.data_devolucao_prevista
        then true
        else false
    end as flag_atraso,

    case
        when l.data_devolucao_efetiva is null
             and now() > l.data_devolucao_prevista
        then true
        else false
    end as flag_atraso_em_aberto,

    -- Quilometragem
    l.km_retirada,
    l.km_devolucao,
    (l.km_devolucao - l.km_retirada) as km_rodados,

    -- Financeiro
    l.valor_total,

    -- Status
    upper(trim(l.status_locacao)) as status_locacao,  -- AGENDADA, EM_ANDAMENTO, CONCLUIDA, etc.

    -- Flags de estado
    (upper(trim(l.status_locacao)) in ('EM_ANDAMENTO', 'ATRASADA')) as flag_em_uso,
    (upper(trim(l.status_locacao)) = 'CONCLUIDA') as flag_concluida,

    l.created_at as created_at_source,
    l.updated_at as updated_at_source,
    l.deleted_at,
    (l.deleted_at is not null) as is_deleted,

    now() at time zone 'UTC' as staged_at

from locadora_dw.locacao as l
;
