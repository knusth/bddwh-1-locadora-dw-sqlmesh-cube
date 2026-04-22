-- =============================================================================
-- Staging: stg_reserva
-- Fonte: locadora_dw.reserva (OLTP)
-- Propósito: Preparar reservas para fatos e análise de funil.
-- =============================================================================

model (
    name staging.stg_reserva,
    kind view,
    tags ['staging', 'reserva'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de reservas com cálculo de duração prevista e flags de no-show'
);

select
    r.id_reserva as id_reserva_source,
    r.id_cliente as id_cliente_source,
    r.id_grupo as id_grupo_source,
    r.id_patio_retirada as id_patio_retirada_source,
    r.id_patio_devolucao as id_patio_devolucao_source,

    -- Datas e horários
    r.data_reserva,
    r.data_retirada_prevista,
    r.data_devolucao_prevista,
    r.data_cancelamento,

    -- Duração prevista em dias
    (r.data_devolucao_prevista::date - r.data_retirada_prevista::date) as duracao_prevista_dias,

    -- Status e financeiro
    upper(trim(r.status_reserva)) as status_reserva,  -- PENDENTE, CONFIRMADA, CANCELADA, etc.
    r.valor_previsto,

    -- Flags de análise
    (upper(trim(r.status_reserva)) = 'NAO_COMPARECEU') as flag_no_show,
    (upper(trim(r.status_reserva)) = 'CANCELADA') as flag_cancelada,
    (upper(trim(r.status_reserva)) = 'CONCLUIDA') as flag_convertida_locacao,

    r.created_at as created_at_source,
    r.updated_at as updated_at_source,
    r.deleted_at,
    (r.deleted_at is not null) as is_deleted,

    now() at time zone 'UTC' as staged_at

from locadora_dw.reserva as r
;
