-- =============================================================================
-- Audit: locacao_valor_positivo
-- Tabela: staging.stg_locacao
-- Regra: Locações concluídas ou em andamento devem ter valor_total > 0
-- Exceção: Canceladas podem ter valor 0
-- =============================================================================

audit (
    name locacao_valor_positivo,
    dialect postgres,
    blocking false  -- WARNING apenas, não bloqueia
);

select
    id_locacao_source,
    valor_total,
    status_locacao
from staging.stg_locacao
where is_deleted = false
    and status_locacao not in ('CANCELADA')
    and (valor_total is null or valor_total <= 0)
;
