model (
    name marts.dim_tempo,
    kind full,
    tags ['dimension', 'tempo'],
    owner 'data_engineering@locadora.dw',
    description 'Dimensão tempo gerada via SQL (calendário 2020-2030)'
);

with datas as (
    select generate_series(
        '2020-01-01'::date,
        '2030-12-31'::date,
        '1 day'::interval
    )::date as data_referencia
)
select
    data_referencia as sk_data,
    data_referencia,
    extract(year from data_referencia)::int as ano,
    extract(month from data_referencia)::int as mes,
    extract(day from data_referencia)::int as dia,
    extract(quarter from data_referencia)::int as trimestre,
    case when extract(month from data_referencia) <= 6 then 1 else 2 end as semestre,
    extract(dow from data_referencia)::int as dia_semana,
    case extract(dow from data_referencia)
        when 0 then 'Domingo'
        when 1 then 'Segunda'
        when 2 then 'Terça'
        when 3 then 'Quarta'
        when 4 then 'Quinta'
        when 5 then 'Sexta'
        when 6 then 'Sábado'
    end as nome_dia_semana,
    case extract(month from data_referencia)
        when 1 then 'Janeiro'
        when 2 then 'Fevereiro'
        when 3 then 'Março'
        when 4 then 'Abril'
        when 5 then 'Maio'
        when 6 then 'Junho'
        when 7 then 'Julho'
        when 8 then 'Agosto'
        when 9 then 'Setembro'
        when 10 then 'Outubro'
        when 11 then 'Novembro'
        when 12 then 'Dezembro'
    end as nome_mes,
    extract(year from data_referencia)::int * 100 + extract(month from data_referencia)::int as ano_mes,
    extract(dow from data_referencia) in (0, 6) as eh_final_de_semana,
    false as eh_feriado_nacional_fixo,
    extract(dow from data_referencia) not in (0, 6) as eh_dia_util,

    now() at time zone 'UTC' as dwh_loaded_at

from datas
;
