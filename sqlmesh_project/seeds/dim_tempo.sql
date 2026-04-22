-- =============================================================================
-- Seed: dim_tempo
-- Propósito: Calendário estático para análise temporal (2020-2025).
-- Origem: Gerado automaticamente via scripts/gerar_dim_tempo.py
-- =============================================================================

seed (
    name dim_tempo,
    path 'dim_tempo.csv',
    tags ['seed', 'tempo'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão tempo gerada como seed para garantir consistência entre ambientes'
);
