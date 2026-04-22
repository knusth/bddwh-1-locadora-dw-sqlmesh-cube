# SQLMesh Project - Locadora Data Warehouse

Projeto SQLMesh completo para o Data Warehouse analítico da locadora de veículos.

## Estrutura do Projeto

```
sqlmesh_project/
├── config.yaml                          # Configuração de gateways e conexões
├── models/
│   ├── staging/                         # Views de leitura do OLTP
│   │   ├── stg_cliente.sql
│   │   ├── stg_veiculo.sql
│   │   ├── stg_patio.sql
│   │   ├── stg_reserva.sql
│   │   ├── stg_locacao.sql
│   │   └── stg_grupo_veiculo.sql
│   └── marts/
│       ├── dimensions/                  # Dimensões (SCD1 e SCD2)
│       │   ├── dim_cliente.sql          # SCD Type 2
│       │   ├── dim_veiculo.sql          # SCD Type 2
│       │   ├── dim_patio.sql            # SCD Type 1
│       │   ├── dim_tempo.sql            # Seed-based
│       │   └── dim_grupo_veiculo.sql    # SCD Type 1
│       └── facts/                       # Tabelas fato
│           ├── fato_locacao.sql         # Incremental por data
│           ├── fato_reserva.sql         # Incremental por data
│           ├── fato_ocupacao_patio.sql  # Snapshot periódico
│           └── fato_transicao_patio.sql # Matriz Markov
├── audits/                              # Data quality checks
├── macros/                              # Funções reutilizáveis Jinja
├── seeds/                               # Dados estáticos
│   ├── dim_tempo.sql
│   └── dim_tempo.csv                    # Calendário 2020-2025
└── scripts/
    └── gerar_dim_tempo.py               # Gerador do seed de calendário
```

## Pré-requisitos

- Docker e docker-compose instalados
- Python 3.10+ (para rodar SQLMesh localmente ou via container)
- Bancos `locadora_dw` (OLTP) e `locadora_dwh` (DWH) rodando via docker-compose

## Como subir a infraestrutura

### 1. Subir os bancos de dados

```bash
# Na raiz do projeto (/Users/hygor.knust/Projects/bddwh/p1)
docker-compose up -d postgres postgres-dwh
```

O banco OLTP estará em `localhost:5432` e o DWH em `localhost:5433`.

### 2. Rodar migrations no OLTP (se necessário)

```bash
docker-compose --profile migrations run --rm migrations
```

> **Nota:** Os modelos de staging leem das tabelas `locadora_dw.*`. Certifique-se de que o schema OLTP esteja populado antes de executar o SQLMesh.

### 3. Acessar o container do SQLMesh

Um container utilitário com Python está configurado no docker-compose:

```bash
docker-compose --profile sqlmesh run --rm sqlmesh
```

Dentro do container, instale o SQLMesh (primeira vez):

```bash
pip install sqlmesh[postgres]
```

### 4. Executar o SQLMesh

Ainda dentro do container `sqlmesh`:

```bash
# Validar projeto e conexão
sqlmesh info

# Criar/validar plano de execução no ambiente dev
sqlmesh plan dev

# Aplicar mudanças no ambiente dev
sqlmesh plan dev --auto-apply

# Ou aplicar diretamente em produção (quando validado)
sqlmesh plan prod --auto-apply
```

#### Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `sqlmesh plan` | Gera plano de migração mostrando diffs |
| `sqlmesh plan --auto-apply` | Aplica automaticamente após confirmação |
| `sqlmesh apply` | Aplica o plano atual (último gerado) |
| `sqlmesh audit` | Executa audits de data quality |
| `sqlmesh test` | Roda testes unitários (se houver) |
| `sqlmesh info` | Mostra informações do projeto e conexões |
| `sqlmesh dag` | Exibe o DAG de dependências dos modelos |

## Configuração de Ambientes

O `config.yaml` usa variáveis de ambiente para conexão:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `LOCADORA_DWH_HOST` | `localhost` | Host do PostgreSQL DWH |
| `LOCADORA_DWH_PORT` | `5433` | Porta do DWH |
| `LOCADORA_DWH_USER` | `locadora_admin` | Usuário |
| `LOCADORA_DWH_PASSWORD` | `locadora_secret_2024` | Senha |
| `LOCADORA_DWH_DB` | `locadora_dwh` | Nome do banco |

### Rodando fora do Docker

Se preferir rodar SQLMesh diretamente na máquina host:

```bash
cd sqlmesh_project
export LOCADORA_DWH_HOST=localhost
export LOCADORA_DWH_PORT=5433
export LOCADORA_DWH_USER=locadora_admin
export LOCADORA_DWH_PASSWORD=locadora_secret_2024
export LOCADORA_DWH_DB=locadora_dwh

sqlmesh plan dev
```

## Modelagem Dimensional

### Staging Layer
- **stg_cliente**: Limpeza de CPF, email, telefone e normalização de endereço
- **stg_veiculo**: Normalização de placa/chassis e flags de status
- **stg_patio**: Padronização de tipo (Aeroporto/Shopping/Rodoviaria)
- **stg_reserva**: Cálculo de lead time e flags de funil (cancelada, no-show, convertida)
- **stg_locacao**: Cálculo de KM rodados, duração efetiva e flags de atraso
- **stg_grupo_veiculo**: Categorias padronizadas (ECN, INT, SUV, EXC, LUX, VAN, PIC)

### Dimensões
| Dimensão | Tipo SCD | Observação |
|----------|----------|------------|
| dim_cliente | SCD2 | Histórico completo por updated_at |
| dim_veiculo | SCD2 | Rastreia mudanças de pátio e KM |
| dim_patio | SCD1 | Overwrite completo |
| dim_grupo_veiculo | SCD1 | Overwrite completo |
| dim_tempo | Seed | Calendário 2020-2025 com feriados fixos |

### Fatos
| Fato | Tipo | Granularidade |
|------|------|---------------|
| fato_locacao | Incremental por data | 1 linha / locação |
| fato_reserva | Incremental por data | 1 linha / reserva |
| fato_ocupacao_patio | Snapshot FULL | 1 linha / pátio / dia |
| fato_transicao_patio | Snapshot FULL | 1 linha / origem / destino / mês |

## Data Quality (Audits)

Os audits são executados automaticamente durante o `sqlmesh plan/apply`:

- **cliente_cpf_unico**: Bloqueia CPFs duplicados no staging
- **veiculo_placa_unica**: Bloqueia placas duplicadas
- **locacao_valor_positivo**: Alerta locações sem valor total
- **reserva_data_futura**: Bloqueia datas de reserva no futuro
- **fato_locacao_sk_preenchidas**: Garante integridade referencial das SKs

Para executar audits manualmente:

```bash
sqlmesh audit
```

## Regenerar Seed de Calendário

Se precisar estender o período do `dim_tempo`:

```bash
python scripts/gerar_dim_tempo.py
# Edite DATA_INICIO e DATA_FIM no script conforme necessário
```

## Notas de Implementação

1. **SCD2 Lookup em Fatos**: Os fatos fazem join com a versão *atual* das dimensões SCD2 (`valid_to_dttm is null`). Para análise histórica precisa (ex: "qual o endereço do cliente no momento da locação?"), é necessário implementar lookup temporal pela `data_retirada` vs `valid_from_dttm`/`valid_to_dttm`. Isso pode ser feito via macro futura.

2. **Particionamento**: As tabelas fato incrementais no PostgreSQL podem se beneficiar de particionamento por range na `time_column` quando o volume ultrapassar alguns milhões de linhas. O SQLMesh gerencia isso via `partitioned_by` no modelo.

3. **Índices**: O PostgreSQL DWH tem `random_page_cost = 1.1` e estatísticas agressivas (`default_statistics_target = 500`), otimizando joins e scans sequenciais para workload analítico.

4. **Time Zones**: Todo o DWH opera em UTC. A camada de apresentação (BI) deve converter para `America/Sao_Paulo`.

## Troubleshooting

### Erro de conexão com DWH
Verifique se o container está saudável:
```bash
docker-compose ps
```

### Tabelas do OLTP não encontradas
Certifique-se de que o schema `locadora_dw` existe e está populado no banco OLTP (porta 5432). Os modelos staging fazem `FROM locadora_dw.<tabela>`.

### SQLMesh não encontra variáveis de ambiente
O `config.yaml` usa `env_var()` com fallback. Se estiver fora do Docker, exporte as variáveis explicitamente.

---

**Data de criação:** 2026-04-22  
**Responsável:** Data Engineering Team
