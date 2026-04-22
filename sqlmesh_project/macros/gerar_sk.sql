{# =============================================================================
   Macro: gerar_sk
   Propósito: Gera surrogate key (hash) a partir de uma ou mais colunas.
   Uso: {{ gerar_sk('nome_coluna1', 'nome_coluna2', ...) }}
   Retorna: MD5 concatenado com '-' das colunas fornecidas.
   ============================================================================= #}

{% macro gerar_sk(cols) %}
    md5(
        {% for col in cols -%}
            coalesce(cast({{ col }} as text), '_null_')
            {%- if not loop.last %} || '-' || {% endif -%}
        {%- endfor %}
    )
{% endmacro %}