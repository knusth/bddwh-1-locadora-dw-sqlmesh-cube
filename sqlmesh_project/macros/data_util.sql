{# =============================================================================
   Macro: hoje_utc
   Propósito: Retorna a data atual em UTC (padrão do DWH).
   ============================================================================= #}
{% macro hoje_utc() %}
    current_date at time zone 'UTC'
{% endmacro %}

{# =============================================================================
   Macro: agora_utc
   Propósito: Retorna o timestamp atual em UTC.
   ============================================================================= #}
{% macro agora_utc() %}
    now() at time zone 'UTC'
{% endmacro %}

{# =============================================================================
   Macro: trimestre_br
   Propósito: Retorna o trimestre brasileiro (1 a 4) para uma data.
   ============================================================================= #}
{% macro trimestre_br(col) %}
    extract(quarter from {{ col }})
{% endmacro %}

{# =============================================================================
   Macro: semestre_br
   Propósito: Retorna o semestre (1 ou 2) para uma data.
   ============================================================================= #}
{% macro semestre_br(col) %}
    case when extract(month from {{ col }}) <= 6 then 1 else 2 end
{% endmacro %}

{# =============================================================================
   Macro: ano_mes
   Propósito: Retorna o ano-mês no formato YYYYMM (inteiro).
   ============================================================================= #}
{% macro ano_mes(col) %}
    extract(year from {{ col }}) * 100 + extract(month from {{ col }})
{% endmacro %}

{# =============================================================================
   Macro: is_feriado_nacional_placeholder
   Propósito: Placeholder para lógica de feriados (pode ser substituída por seed).
   ============================================================================= #}
{% macro is_feriado_nacional(data_col) %}
    false  -- TODO: integrar com seed de feriados
{% endmacro %}