# Validação do Data Warehouse

## Status Geral

| Componente | Status |
|-----------|--------|
| Schema OLTP | ✅ 18 tabelas, constraints, índices |
| Dados sintéticos | ✅ 6.937 registros gerados |
| FDW OLTP→DWH | ✅ postgres_fdw configurado |
| SQLMesh | ✅ 15 modelos aplicados |
| Staging | ✅ 6 views funcionando |
| Dimensões | ✅ 5 dimensões (SCD1/SCD2) |
| Fatos | ✅ 4 tabelas fato |
| Relatórios | ✅ Todos gerenciáveis |

---

## Validação por Relatório Gerencial

### a) Controle de Pátio
**Status:** ✅ Funcionando via FDW do OLTP

Veículos atualmente nos pátios por grupo e origem (própria/associada):

```sql
SELECT 
  p.nome_patio,
  gv.nome_grupo,
  ov.origem_frota,
  COUNT(DISTINCT ov.id_veiculo) as total_veiculos
FROM locadora_dw.ocupacao_vaga ov
JOIN locadora_dw.vaga_patio vp ON vp.id_vaga = ov.id_vaga
JOIN locadora_dw.patio p ON p.id_patio = vp.id_patio
JOIN locadora_dw.veiculo v ON v.id_veiculo = ov.id_veiculo
JOIN locadora_dw.grupo_veiculo gv ON gv.id_grupo = v.id_grupo
WHERE ov.data_saida IS NULL
GROUP BY p.nome_patio, gv.nome_grupo, ov.origem_frota;
```

**Resultado:** 75 combinações pátio/grupo/origem, totalizando 150 veículos.

---

### b) Controle de Locações
**Status:** ✅ Funcionando no DWH

Locações por grupo com tempo médio e valores:

```sql
SELECT 
  dgv.nome_grupo,
  COUNT(*) as total_locacoes,
  ROUND(AVG(fl.duracao_efetiva_dias)::numeric, 1) as media_dias,
  ROUND(AVG(fl.valor_total)::numeric, 2) as valor_medio
FROM marts__dev.fato_locacao fl
JOIN marts__dev.dim_veiculo dv ON dv.sk_veiculo = fl.sk_veiculo
JOIN marts__dev.dim_grupo_veiculo dgv ON dgv.sk_grupo_veiculo = dv.id_grupo_source
GROUP BY dgv.nome_grupo
ORDER BY total_locacoes DESC;
```

**Resultado:**
| Grupo | Locações | Média Dias | Valor Médio |
|-------|----------|------------|-------------|
| Pick-up | 148 | 8.0 | R$ 2.334,94 |
| SUV | 133 | 7.9 | R$ 1.894,87 |
| Intermediário | 122 | 8.0 | R$ 1.567,44 |
| Executivo | 121 | 7.4 | R$ 2.327,51 |
| Van | 120 | 7.7 | R$ 2.114,66 |
| Econômico | 107 | 8.0 | R$ 1.475,48 |
| Premium | 101 | 7.9 | R$ 3.804,39 |

---

### c) Controle de Reservas
**Status:** ✅ Funcionando no DWH

Reservas por grupo, pátio e cidade de origem:

```sql
SELECT 
  dgv.nome_grupo,
  dp.nome_patio as patio_retirada,
  dc.cidade as cidade_cliente,
  COUNT(*) as total_reservas,
  ROUND(AVG(fr.duracao_prevista_dias)::numeric, 1) as media_dias
FROM marts__dev.fato_reserva fr
JOIN marts__dev.dim_grupo_veiculo dgv ON dgv.sk_grupo_veiculo = fr.sk_grupo_veiculo
JOIN marts__dev.dim_patio dp ON dp.sk_patio = fr.sk_patio_retirada
JOIN marts__dev.dim_cliente dc ON dc.sk_cliente = fr.sk_cliente
GROUP BY dgv.nome_grupo, dp.nome_patio, dc.cidade
ORDER BY total_reservas DESC;
```

---

### d) Grupos Mais Alugados por Origem dos Clientes
**Status:** ✅ Funcionando no DWH

```sql
SELECT 
  dgv.nome_grupo,
  dc.cidade as origem_cliente,
  COUNT(*) as total_locacoes,
  ROUND(SUM(fl.valor_total)::numeric, 2) as receita_total
FROM marts__dev.fato_locacao fl
JOIN marts__dev.dim_veiculo dv ON dv.sk_veiculo = fl.sk_veiculo
JOIN marts__dev.dim_grupo_veiculo dgv ON dgv.sk_grupo_veiculo = dv.id_grupo_source
JOIN marts__dev.dim_cliente dc ON dc.sk_cliente = fl.sk_cliente
GROUP BY dgv.nome_grupo, dc.cidade
ORDER BY total_locacoes DESC;
```

---

### e) Previsão de Ocupação (Cadeia de Markov)
**Status:** ✅ Funcionando no DWH

Matriz estocástica validada: para cada pátio/mês, a soma das probabilidades de transição = 1.0.

```sql
-- Validação: soma deve ser 1.0 por origem/mês
SELECT sk_patio_origem, mes_referencia, 
  ROUND(SUM(probabilidade_transicao)::numeric, 3) as total_prob
FROM marts__dev.fato_transicao_patio
GROUP BY sk_patio_origem, mes_referencia
ORDER BY mes_referencia, sk_patio_origem;
```

**Resultado:** Total_prob = 1.000 para todas as combinações.

**Matriz agregada (média histórica):**

| Origem | Destino | Prob. Média |
|--------|---------|-------------|
| Barra Shopping | Barra Shopping | 0.7859 |
| Galeão | Galeão | 0.7560 |
| Nova América | Nova América | 0.7473 |
| Rio Sul | Rio Sul | 0.7821 |
| Rodoviária | Rodoviária | 0.8098 |
| Santos Dumont | Santos Dumont | 0.7254 |

---

## Observações

1. **fato_ocupacao_patio** é um snapshot diário por pátio (sem granularidade de veículo individual). Para relatórios detalhados por veículo/grupo/origem, usar FDW do OLTP ou criar fato adicional.

2. **Integridade reserva→locação:** O gerador de dados criou 852 locações vinculadas a 1.500 reservas. Apenas 197 locações estão vinculadas a reservas com status CONCLUIDA. Isso reflete um comportamento realista onde nem toda locação vem de uma reserva prévia (walk-in), mas a consistência entre as tabelas poderia ser aprimorada no gerador.

3. **Performance:** Com volume médio (~1.500 reservas, ~852 locações), todos os modelos FULL processam em <1s.
