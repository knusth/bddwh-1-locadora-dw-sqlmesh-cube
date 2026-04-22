-- =============================================================================
-- init: 02_setup_fdw.sql
-- Configura postgres_fdw para o DWH acessar o banco OLTP em tempo real.
-- =============================================================================

-- Extensão FDW
create extension if not exists postgres_fdw;

-- Servidor FDW apontando para o container postgres (OLTP)
create server if not exists oltp_server
    foreign data wrapper postgres_fdw
    options (
        host 'postgres',
        port '5432',
        dbname 'locadora_dw'
    );

-- Mapeamento de usuário: DWH admin → OLTP admin
create user mapping if not exists for locadora_admin
    server oltp_server
    options (
        user 'locadora_admin',
        password 'locadora_secret_2024'
    );

-- Cria schema para mirror das tabelas OLTP (fora do bloco de exceção para persistir)
create schema if not exists locadora_dw;

-- Importa tabelas do OLTP com tratamento de erro (pode falhar se OLTP ainda não está pronto)
do $$
begin
    import foreign schema public
        from server oltp_server
        into locadora_dw;
exception
    when others then
        raise notice 'import foreign schema falhou (OLTP pode não estar pronto): %', sqlerrm;
end $$;

comment on schema locadora_dw is 'Foreign tables do OLTP acessíveis via postgres_fdw';
