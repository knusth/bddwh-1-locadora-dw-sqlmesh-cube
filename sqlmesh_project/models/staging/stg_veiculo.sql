model (
    name staging.stg_veiculo,
    kind view,
    tags ['staging', 'veiculo'],
    owner 'data_engineering@locadora.dw',
    description 'Staging de veículos com normalização de placa, chassis e status'
);

select
    v.id_veiculo as id_veiculo_source,
    v.id_grupo as id_grupo_source,
    v.id_marca as id_marca_source,
    v.id_modelo as id_modelo_source,
    v.id_patio_base as id_patio_base_source,
    v.id_patio_atual as id_patio_atual_source,

    upper(trim(v.placa)) as placa,
    upper(trim(v.chassis)) as chassis,
    trim(v.renavam) as renavam,
    trim(v.cor) as cor,
    v.km_atual,
    v.status as status_veiculo,

    -- joins para nomes legíveis
    trim(m.nome_marca) as marca,
    trim(md.nome_modelo) as modelo,
    md.ano_fabricacao,
    md.ano_modelo,
    trim(md.tipo_combustivel) as tipo_combustivel,

    v.created_at as created_at_source,
    v.updated_at as updated_at_source,
    v.deleted_at,
    (v.deleted_at is not null) as is_deleted,

    now() at time zone 'UTC' as staged_at

from locadora_dw.veiculo as v
left join locadora_dw.marca as m on m.id_marca = v.id_marca
left join locadora_dw.modelo as md on md.id_modelo = v.id_modelo
;
