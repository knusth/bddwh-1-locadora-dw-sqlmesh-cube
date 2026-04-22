# Locadora Data Generator

Gerador de dados fake em Node.js para popular o banco OLTP PostgreSQL do projeto de Data Warehouse da locadora de veículos.

## Pré-requisitos

- Node.js >= 20
- PostgreSQL rodando (via Docker Compose ou local)
- Variáveis de ambiente `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` configuradas (padrão aponta para o container Docker)

## Instalação

```bash
cd scripts/generator-js
npm install
```

## Uso

### CLI

```bash
# escala padrão (medium)
node index.js

# escalas predefinidas
node index.js --scale small    # ~100 veículos, 200 clientes, 500 reservas
node index.js --scale medium   # ~150 veículos, 500 clientes, 1500 reservas
node index.js --scale large    # ~300 veículos, 1000 clientes, 5000 reservas

# limpa todas as tabelas antes de inserir
node index.js --clean
node index.js --scale large --clean
```

### Scripts npm

```bash
npm run generate        # escala medium
npm run generate:large  # escala large
npm run clean           # trunca tabelas
```

## Arquitetura

```
generator-js/
  index.js              # entrypoint cli (commander + ora)
  lib/
    config.js           # escalas e conexão pg
    database.js         # pool, insert batch, truncate
    logger.js           # chalk logging
    validators.js       # dv de cpf/cnpj (se necessário)
  generators/
    seed.js             # dados estáticos (empresa, patio, grupo, etc.)
    veiculo.js          # veículos, características, fotos, prontuário, vagas
    cliente.js          # clientes pf/pj
    motorista.js        # motoristas vinculados a clientes
    reserva.js          # reservas com ciclo de vida
    locacao.js          # locações consistentes (sem sobreposição)
    cobranca.js         # cobranças e proteções
    ocupacao.js         # histórico de ocupação de vagas
  sql/
    truncate-all.sql    # script para limpar tabelas
```

## Consistência garantida

- CPFs, CNPJs, placas e chassis únicos (verificação em memória + UK no banco)
- Veículos não possuem duas locações com datas sobrepostas (checagem em memória)
- Clientes PJ possuem pelo menos 1 motorista
- Datas cronologicamente consistentes (reserva ≤ retirada ≤ devolução)
- Reservas canceladas não geram locação
- Quilometragem de devolução >= quilometragem de retirada

## Docker

O projeto pode ser executado via Docker Compose. Veja o `docker-compose.yml` na raiz do projeto.

```bash
make generate-data        # escala padrão
make generate-data-large  # escala large
make clean-db             # trunca dados
```
