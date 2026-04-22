# SQLMesh no Projeto Locadora DW

## O que é SQLMesh?

SQLMesh é uma ferramenta de orquestração de transformações SQL (Transformation Layer) que substitui o dbt com abordagens mais modernas:

- **Semantic diffs**: compara o estado desejado (código) com o estado atual (banco) automaticamente
- **Virtual data environments**: cada ambiente (dev, staging, prod) é uma view layer sobre as mesmas tabelas físicas
- **Incremental models**: processa apenas o que mudou, não recria tudo
- **Built-in testing**: audits e assertions integrados ao pipeline
- **No Jinja templates**: usa SQL puro com macros reais (não string substitution)

---

## Arquitetura no Projeto

```mermaid
flowchart TB
    subgraph Fontes["Fontes de Dados"]
        OLTP["🗄️ PostgreSQL OLTP<br/>localhost:5434<br/>locadora_dw"]
    end

    subgraph DWH["Data Warehouse"]
        subgraph Raw["Schema: locadora_dw (FDW)"]
            FDW["Foreign Tables<br/>via postgres_fdw"]
        end

        subgraph Staging["Schema: staging__dev"]
            STG_V["stg_veiculo"]
            STG_C["stg_cliente"]
            STG_R["stg_reserva"]
            STG_L["stg_locacao"]
            STG_P["stg_patio"]
            STG_G["stg_grupo_veiculo"]
        end

        subgraph Marts["Schema: marts__dev"]
            subgraph Dims["Dimensões"]
                DIM_C["dim_cliente<br/>(SCD Type 2)"]
                DIM_V["dim_veiculo<br/>(SCD Type 2)"]
                DIM_P["dim_patio<br/>(SCD Type 1)"]
                DIM_G["dim_grupo_veiculo<br/>(SCD Type 1)"]
                DIM_T["dim_tempo<br/>(Full)"]
            end

            subgraph Facts["Fatoss"]
                FAT_R["fato_reserva<br/>(Full)"]
                FAT_L["fato_locacao<br/>(Full)"]
                FAT_O["fato_ocupacao_patio<br/>(Snapshot)"]
                FAT_M["fato_transicao_patio<br/>(Markov)"]
            end
        end

        subgraph SQLMesh_Internal["Internals: sqlmesh__*"]
            SNAPSHOTS["Snapshot tables<br/>(versionamento físico)"]
            STATE["State DB<br/>(planos, intervals, hashes)"]
        end
    end

    subgraph Consumers["Consumidores"]
        BI["📊 Dashboards/BI"]
        ANALYST["👩‍💻 Analistas"]
        MARKOV["🎲 Modelo Markov<br/>(Python/R)"]
    end

    OLTP -->|postgres_fdw| FDW
    FDW -->|SELECT| STG_V
    FDW -->|SELECT| STG_C
    FDW -->|SELECT| STG_R
    FDW -->|SELECT| STG_L
    FDW -->|SELECT| STG_P
    FDW -->|SELECT| STG_G

    STG_C --> DIM_C
    STG_V --> DIM_V
    STG_P --> DIM_P
    STG_G --> DIM_G

    DIM_C --> FAT_R
    DIM_C --> FAT_L
    DIM_V --> FAT_R
    DIM_V --> FAT_L
    DIM_P --> FAT_R
    DIM_P --> FAT_L
    DIM_P --> FAT_O
    DIM_P --> FAT_M
    DIM_T --> FAT_R
    DIM_T --> FAT_L
    DIM_T --> FAT_O
    DIM_T --> FAT_M

    STG_R --> FAT_R
    STG_L --> FAT_L
    STG_L --> FAT_O
    STG_L --> FAT_M

    Marts --> BI
    Marts --> ANALYST
    FAT_M --> MARKOV

    SNAPSHOTS -.->|views apontam para| Marts
    STATE -.->|gerencia| SNAPSHOTS
```

---

## Ciclo de Vida: Plan → Apply

```mermaid
sequenceDiagram
    participant Dev as 👨‍💻 Desenvolvedor
    participant CLI as sqlmesh CLI
    participant State as State DB
    participant DWH as PostgreSQL DWH
    participant OLTP as PostgreSQL OLTP

    Dev->>CLI: sqlmesh plan dev
    CLI->>State: Lê estado atual do ambiente "dev"
    State-->>CLI: Versões, hashes, intervals
    CLI->>CLI: Parseia todos os modelos .sql
    CLI->>CLI: Compara código vs estado

    alt Modelo novo
        CLI->>Dev: "Added: marts.dim_cliente"
    end

    alt Modelo modificado
        CLI->>Dev: "Modified: marts.fato_locacao"
        CLI->>Dev: Mostra diff SQL
    end

    alt Modelo precisa backfill
        CLI->>Dev: "Needs backfill: [2024-01-01 - 2026-04-22]"
    end

    Dev->>CLI: Confirma (yes)
    CLI->>DWH: Cria/altera tabelas físicas
    CLI->>OLTP: Lê dados via FDW
    OLTP-->>CLI: Dados brutos
    CLI->>DWH: INSERT INTO snapshot tables
    CLI->>DWH: Atualiza views virtuais
    CLI->>State: Persiste novo estado
    State-->>CLI: OK
    CLI-->>Dev: "Virtual layer updated"
```

---

## Estrutura do Projeto SQLMesh

```
sqlmesh_project/
├── config.yaml              # Conexões, gateways, model_defaults
├── audits/                  # Data quality checks
│   ├── audit_cliente_cpf_unico.sql
│   ├── audit_locacao_valor_positivo.sql
│   ├── audit_reserva_data_futura.sql
│   └── audit_veiculo_placa_unica.sql
├── macros/                  # Funções reutilizáveis em SQL
│   ├── data_util.sql        # trimestre_br, semestre_br, ano_mes
│   └── gerar_sk.sql         # Geração de surrogate key (MD5)
├── models/
│   ├── staging/             # Views sobre FDW
│   │   ├── stg_cliente.sql
│   │   ├── stg_grupo_veiculo.sql
│   │   ├── stg_locacao.sql
│   │   ├── stg_patio.sql
│   │   ├── stg_reserva.sql
│   │   └── stg_veiculo.sql
│   └── marts/
│       ├── dimensions/      # Dimensões SCD1/SCD2
│       │   ├── dim_cliente.sql
│       │   ├── dim_grupo_veiculo.sql
│       │   ├── dim_patio.sql
│       │   ├── dim_tempo.sql
│       │   └── dim_veiculo.sql
│       └── facts/           # Tabelas fato
│           ├── fato_locacao.sql
│           ├── fato_ocupacao_patio.sql
│           ├── fato_reserva.sql
│           └── fato_transicao_patio.sql
└── seeds/                   # Dados estáticos
    ├── dim_tempo.csv        # Calendário 2020-2030
    └── dim_tempo.sql        # Definição do seed
```

---

## Tipos de Materialização

| Tipo | Uso no Projeto | Descrição |
|------|---------------|-----------|
| `VIEW` | Staging (stg_*) | Não armazena dados; executa SELECT a cada consulta |
| `FULL` | Dimensões SCD1, Fatos | Recria a tabela inteira a cada execução |
| `SCD_TYPE_2_BY_TIME` | dim_cliente, dim_veiculo | Rastreia mudanças históricas com `valid_from`/`valid_to` |
| `INCREMENTAL_BY_TIME_RANGE` | (não usado no volume atual) | Processa apenas novos registros por intervalo de data |

### Por que usamos FULL para fatos?

Com volume médio (~1.500 reservas, ~852 locações), o custo de recriar tabelas é insignificante. O benefício:
- **Simplicidade:** não precisa gerenciar particionamento ou deduplicação
- **Consistência:** cada execução produz o mesmo resultado determinístico
- **Debug:** fácil inspecionar o snapshot table diretamente

Para produção com milhões de registros, migraríamos para `INCREMENTAL_BY_TIME_RANGE`.

---

## Virtual Layer: Como funciona?

```mermaid
graph LR
    subgraph Schema_marts["Schema: marts__dev"]
        V1["View: dim_cliente"]
        V2["View: fato_locacao"]
    end

    subgraph Schema_sqlmesh["Schema: sqlmesh__marts"]
        T1["Table: marts__dim_cliente__3542745417__dev"]
        T2["Table: marts__fato_locacao__801793824__dev"]
    end

    V1 -->|SELECT * FROM| T1
    V2 -->|SELECT * FROM| T2

    USER["SELECT * FROM marts__dev.dim_cliente"]
    USER --> V1
```

O SQLMesh mantém **múltiplas versões físicas** das tabelas (snapshot tables com hash no nome) e expõe uma **view virtual** que sempre aponta para a versão correta. Isso permite:

- **Rollback instantâneo:** trocar a view para apontar para a versão anterior
- **Testes A/B:** comparar resultados entre versões
- **Zero-downtime deploys:** a view muda atomamente

---

## Comandos do Dia a Dia

```bash
# Verificar estado do projeto
make sqlmesh-info

# Planejar mudanças (preview, não aplica)
make sqlmesh-plan
# ou interativo:
docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh plan dev

# Aplicar mudanças
make sqlmesh-apply

# Forçar recriação de um modelo específico
docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh plan dev \
  --restate-model marts.dim_cliente \
  --auto-apply

# Ver diffs entre código e banco
docker-compose --profile sqlmesh run --rm sqlmesh sqlmesh diff dev
```

---

## Auditoria (Audits)

Cada modelo pode ter assertions de qualidade:

```sql
-- audit_cliente_cpf_unico.sql
audit (
  name assert_cliente_cpf_unico,
  dialect postgres
);

select *
from marts.dim_cliente
where sk_cliente in (
  select sk_cliente
  from marts.dim_cliente
  group by sk_cliente
  having count(*) > 1
);
```

Se o audit retornar qualquer linha, o `plan` falha automaticamente, garantindo integridade antes da publicação.
