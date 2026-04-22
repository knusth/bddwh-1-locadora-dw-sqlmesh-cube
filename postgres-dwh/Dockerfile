# =============================================================================
# Dockerfile - PostgreSQL Data Warehouse para Locadora
# Base: PostgreSQL 16 Alpine com configurações otimizadas para analytics
# =============================================================================

FROM postgres:17-alpine

LABEL maintainer="Data Engineering Team"
LABEL description="PostgreSQL tunado para Data Warehouse da Locadora"

# Instala extensões úteis para analytics
RUN apk add --no-cache \
    postgresql17-contrib \
    && rm -rf /var/cache/apk/*

# Copia configuração customizada otimizada para workload DWH
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Cria diretório para logs
RUN mkdir -p /var/lib/postgresql/log && chown postgres:postgres /var/lib/postgresql/log

# Permite sobrescrever config via argumento (útil para dev/prod)
ENV POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale=en_US.utf8"

# Entrypoint padrão do postgres já gerencia tudo; apenas expomos a config customizada
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]

EXPOSE 5432