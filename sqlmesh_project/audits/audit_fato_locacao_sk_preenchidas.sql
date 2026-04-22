-- =============================================================================
-- Audit: fato_locacao_sk_preenchidas
-- Tabela: marts.fato_locacao
-- Regra: Chaves surrogate das dimensões devem estar preenchidas (integridade)
-- Nota: Permite NULL em sk_data_devolucao pois locação pode estar em aberto
-- =============================================================================

audit (
    name fato_locacao_sk_preenchidas,
    dialect postgres,
    blocking true
);

select
    id_locacao
from marts.fato_locacao
where sk_cliente is null
    or sk_veiculo is null
    or sk_patio_retirada is null
    or sk_patio_devolucao is null
    or sk_data_retirada is null
;
