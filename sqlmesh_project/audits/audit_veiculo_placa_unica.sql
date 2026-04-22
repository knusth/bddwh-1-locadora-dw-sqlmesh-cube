-- =============================================================================
-- Audit: veiculo_placa_unica
-- Tabela: staging.stg_veiculo
-- Regra: Placas não podem estar duplicadas entre veículos ativos
-- =============================================================================

audit (
    name veiculo_placa_unica,
    dialect postgres,
    blocking true
);

select
    placa,
    count(*) as qtd
from staging.stg_veiculo
where is_deleted = false
    and placa is not null
    and placa <> ''
group by placa
having count(*) > 1
;
