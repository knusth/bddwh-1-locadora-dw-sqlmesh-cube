# Guidelines do Projeto - Locadora DW

## 1. Filosofia de Modelagem

### 1.1 OLTP Orientado ao DW
O modelo transacional (OLTP) deve ser projetado considerando o futuro processo ETL para o Data Warehouse. Isso significa:
- **Rastreabilidade completa**: toda tabela deve ter `created_at` e `updated_at`
- **Soft deletes**: usar `deleted_at` ao invés de `DELETE` físico para preservar histórico
- **Chaves surrogate**: todas as tabelas possuem PK serial/auto-increment (BIGINT) além das chaves naturais (CNPJ, placa, etc.)
- **Tabelas de auditoria**: mudanças críticas (status de locação, valores) são logadas
- **Timezone consistente**: todos os campos de data/hora usam `TIMESTAMP WITH TIME ZONE` (UTC no banco, America/Sao_Paulo na aplicação)

### 1.2 Modelagem Dimensional - Preparação
Embora este seja o OLTP, aplicamos conceitos dimensionais:
- **Dimensões conformadas**: tabelas de grupo, patio, empresa, características são modeladas como dimensões enriquecidas
- **Fatos transacionais**: locação, reserva, cobrança e ocupação de vaga são modelados como fatos que alimentarão o DW
- **SCD Tipo 2 preparada**: tabelas dimensionais possuem campos `valid_from`, `valid_to`, `is_current` para facilitar SCD-2 no DW
- **Degenerate dimensions**: número da reserva, número da locação são mantidos como degenerates

## 2. Convenções de Código SQL

### 2.1 Estilo
- **Palavras-chave**: sempre minúsculas (`create table`, `not null`, `primary key`)
- **Identificadores**: snake_case, minúsculos, em português (domínio de negócio)
- **Nomes de tabelas**: substantivos no singular (`cliente`, não `clientes`)
- **Nomes de colunas**: prefixo opcional para evitar ambiguidade em joins (`id_cliente`, `nome_cliente`)
- **Chaves estrangeiras**: `id_<tabela_referenciada>`
- **Constraints nomeadas**: `pk_<tabela>`, `fk_<tabela>_<coluna>`, `uk_<tabela>_<coluna>`, `chk_<tabela>_<regra>`

### 2.2 Tipos de Dados
```sql
-- Chaves primárias
id_xxx bigserial primary key

-- Texto
varchar(n)   -- strings com limite conhecido (placa, cpf)
text         -- strings sem limite pré-definido (observacoes, descricoes)

-- Numérico
numeric(15,2) -- valores monetários
numeric(12,3) -- quilometragem, medições técnicas
integer       -- contagens, códigos pequenos
bigint        -- contadores, identificadores

-- Temporal
timestamp with time zone  -- datas/horas de eventos
date                      -- datas sem hora
time with time zone       -- horários recorrentes

-- Outros
uuid          -- identificadores externos (APIs)
jsonb         -- dados semi-estruturados flexíveis (características variantes)
boolean       -- flags

-- Auditoria
created_at timestamp with time zone not null default now(),
updated_at timestamp with time zone not null default now(),
deleted_at timestamp with time zone,  -- soft delete
```

### 2.3 Índices
- Sempre nomeados: `idx_<tabela>_<coluna(s)>`
- Índices parciais para queries frequentes em subsets (`where deleted_at is null`)
- Índices GIN para JSONB e arrays
- Índices em todas as FK para performance de JOIN

## 3. Arquitetura de Migrations

### 3.1 Versionamento
- Migrations são numeradas sequencialmente: `001_create_empresa.sql`, `002_create_patio.sql`
- Cada migration é idempotente onde possível (`create table if not exists`)
- Migrations de rollback são versionadas: `001_create_empresa_rollback.sql`

### 3.2 Ordem de Criação
1. Domínios e tipos customizados
2. Tabelas independentes (empresa, patio, grupo, marca...)
3. Tabelas dependentes (veiculo, cliente, motorista...)
4. Tabelas transacionais (reserva, locacao, cobranca)
5. Tabelas de controle e auditoria
6. Views e funções
7. Índices (após carga inicial de dados estruturais)

## 4. Restrições de Integridade

### 4.1 Nível de Coluna
- `NOT NULL` em campos obrigatórios de negócio
- `CHECK` para regras de domínio (CNH válida, placa no formato Mercosul ou antigo)
- `UNIQUE` para chaves naturais (CPF, CNPJ, placa, chassis)

### 4.2 Nível de Tabela
- `CHECK` para regras entre colunas (data_devolucao > data_retirada)
- `EXCLUDE` para prevenção de sobreposição (veículo não pode ter duas locações simultâneas)
- Triggers para regras complexas

### 4.3 Nível de Banco
- Foreign Keys com `ON DELETE RESTRICT` (padrão) ou `ON DELETE SET NULL`
- Triggers para auditoria automática de `updated_at`

## 5. Benchmarking de Locadoras Reais

### 5.1 Categorias/Grupos (Movida/Localiza/Unidas)
| Código | Nome | Exemplos |
|--------|------|----------|
| ECN | Econômico | Fiat Mobi, Renault Kwid |
| INT | Intermediário | VW Polo, Hyundai HB20 |
| SUV | SUV | Jeep Compass, VW T-Cross |
| EXC | Executivo | Corolla, Civic |
| LUX | Premium/Luxo | BMW 320i, Mercedes C180 |
| VAN | Van/Utilitário | Spin, Doblò |
| PIC | Pick-up | Toro, Hilux |

### 5.2 Proteções/Seguros
- **LDW** (Loss Damage Waiver): redução de responsabilidade em caso de dano
- **PEC** (Proteção de Encargos Complementares): proteção de vidros, faróis, retrovisores
- **ALI** (Aliança Proteção): proteção total (roubo, colisão, incêndio)
- **GPS**: navegador
- **Cadeirinha/Bebê Conforto**

### 5.3 Tarifação
- Diária base por grupo/categoria
- Taxa de retorno em outro pátio (diferente do de retirada)
- Taxa de motorista adicional
- Km livre vs Km controlada
- Diária adicional proporcional (hora excedente)

### 5.4 Ciclo de Vida da Reserva
1. `PENDENTE` → cliente iniciou reserva, não confirmou
2. `CONFIRMADA` → cliente confirmou (com ou sem garantia)
3. `EM_FILA` → grupo indisponível, cliente em lista de espera
4. `CANCELADA` → cliente ou sistema cancelou
5. `NAO_COMPARECEU` → reserva confirmada, cliente não retirou
6. `CONCLUIDA` → veículo retirado (virou locação)

### 5.5 Ciclo de Vida da Locação
1. `AGENDADA` → veículo reservado, aguardando retirada
2. `EM_ANDAMENTO` → veículo retirado, em uso
3. `ATRASADA` → ultrapassou data de devolução prevista
4. `EM_DEVOLUCAO` → cliente iniciou processo de devolução
5. `CONCLUIDA` → veículo devolvido, cobrança finalizada
6. `CANCELADA` → locação cancelada antes da retirada

## 6. Pátios e Compartilhamento

### 6.1 Os 6 Pátios do Grupo
| ID | Nome | Localização | Tipo |
|----|------|-------------|------|
| 1 | Galeão | Aeroporto Internacional Tom Jobim | Aeroporto |
| 2 | Santos Dumont | Aeroporto Santos Dumont | Aeroporto |
| 3 | Rio Sul | Shopping Rio Sul | Shopping |
| 4 | Nova América | Nova América | Shopping |
| 5 | Barra Shopping | Barra Shopping | Shopping |
| 6 | Rodoviária | Rodoviária Novo Rio | Rodoviária |

### 6.2 Movimentação entre Pátios
- Todo veículo tem um `patio_base` (pátio da empresa dona)
- Todo veículo tem um `patio_atual` (onde está fisicamente)
- A locação registra `id_patio_retirada` e `id_patio_devolucao`
- A matriz de transição (Markov) será derivada do histórico de devoluções

## 7. Documentação

- Cada tabela deve ter `COMMENT ON TABLE` e `COMMENT ON COLUMN`
- O dicionário de dados é gerado a partir dos metadados do PostgreSQL (`information_schema`, `pg_catalog`)
- Diagramas devem seguir notação Barker para MER e Crow's Foot para modelo lógico
