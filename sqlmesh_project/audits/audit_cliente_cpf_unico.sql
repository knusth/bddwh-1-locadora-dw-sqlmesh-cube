-- =============================================================================
-- Audit: cliente_cpf_unico
-- Tabela: staging.stg_cliente
-- Regra: Não deve haver CPFs duplicados entre registros ativos (não deletados)
-- Severidade: BLOCKING (impede execução do pipeline)
-- =============================================================================

audit (
    name cliente_cpf_unico,
    dialect postgres,
    blocking true
);

select
    cpf,
    count(*) as qtd
from staging.stg_cliente
where is_deleted = false
    and cpf is not null
    and cpf <> ''
group by cpf
having count(*) > 1
;
