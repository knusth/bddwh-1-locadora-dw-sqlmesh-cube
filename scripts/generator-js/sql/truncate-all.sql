-- =============================================================================
-- truncate-all.sql
-- limpa todas as tabelas do schema público e reinicia as sequences.
-- =============================================================================

do $$
declare
    r record;
begin
    for r in (
        select tablename
        from pg_tables
        where schemaname = 'public'
          and tablename not like 'sqlmesh%'
          and tablename not like '_%'
    ) loop
        execute format('truncate table %I restart identity cascade', r.tablename);
    end loop;
end $$;
