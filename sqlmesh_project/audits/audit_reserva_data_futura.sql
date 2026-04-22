-- =============================================================================
-- Audit: reserva_data_futura
-- Tabela: staging.stg_reserva
-- Regra: data_reserva não pode estar no futuro (indica problema de carga ou timezone)
-- =============================================================================

audit (
    name reserva_data_futura,
    dialect postgres,
    blocking true
);

select
    id_reserva_source,
    data_reserva
from staging.stg_reserva
where is_deleted = false
    and data_reserva > now() at time zone 'UTC'
;
