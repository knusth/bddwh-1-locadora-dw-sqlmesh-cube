#!/bin/sh
# Sistema de Migrations para Locadora DW
# Executa arquivos .sql em ordem numérica, tracking na tabela schema_migrations

set -e

MIGRATIONS_DIR="/migrations"
DB_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}"

echo "================================================"
echo "  Locadora DW - Migration Runner"
echo "  Database: ${PGDATABASE}@${PGHOST}:${PGPORT}"
echo "================================================"

# Cria tabela de controle se não existir
psql -v ON_ERROR_STOP=1 <<'EOF'
create table if not exists schema_migrations (
    migration_id varchar(255) primary key,
    applied_at timestamp with time zone not null default now(),
    checksum varchar(64) not null,
    duration_ms integer not null
);
comment on table schema_migrations is 'Controle de execução de migrations';
EOF

echo "✓ Tabela schema_migrations verificada"

# Lista arquivos de migration ordenados
for file in $(ls -1 ${MIGRATIONS_DIR}/*.sql 2>/dev/null | sort); do
    filename=$(basename "$file")
    checksum=$(sha256sum "$file" | awk '{print $1}')

    # Verifica se já foi aplicada
    already_applied=$(psql -tA -v ON_ERROR_STOP=1 <<EOF
select 1 from schema_migrations where migration_id = '${filename}';
EOF
)

    if [ "$already_applied" = "1" ]; then
        # Verifica checksum
        old_checksum=$(psql -tA -v ON_ERROR_STOP=1 <<EOF
select checksum from schema_migrations where migration_id = '${filename}';
EOF
)
        if [ "$old_checksum" != "$checksum" ]; then
            echo "⚠ WARNING: Migration ${filename} foi alterada desde a última execução!"
            echo "   Esperado: ${old_checksum}"
            echo "   Atual:    ${checksum}"
            echo "   Use rollback e reaplique, ou force com --skip-checksum"
            exit 1
        fi
        echo "  SKIP ${filename} (já aplicada)"
        continue
    fi

    echo "  APPLY ${filename} ..."
    start_ms=$(date +%s%3N)

    psql -v ON_ERROR_STOP=1 -f "$file"

    end_ms=$(date +%s%3N)
    duration=$((end_ms - start_ms))

    psql -v ON_ERROR_STOP=1 <<EOF
insert into schema_migrations (migration_id, checksum, duration_ms)
values ('${filename}', '${checksum}', ${duration});
EOF

    echo "  ✓ OK (${duration}ms)"
done

echo "================================================"
echo "  Migrations concluídas com sucesso!"
echo "================================================"

# Resumo
psql -v ON_ERROR_STOP=1 <<'EOF'
select
    migration_id as migration,
    applied_at::timestamp(0) as applied,
    duration_ms || 'ms' as duration
from schema_migrations
order by migration_id;
EOF
