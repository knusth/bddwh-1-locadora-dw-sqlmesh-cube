-- =============================================================================
-- migration: 001_create_schema
-- descrição: cria o schema completo do oltp da locadora de veículos
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. tabelas de domínio / dimensões independentes
-- -----------------------------------------------------------------------------

-- empresa ----------------------------------------------------------------------
create table if not exists empresa (
    id_empresa bigserial primary key,
    nome_empresa text not null,
    cnpj varchar(18) not null,
    telefone varchar(20),
    email varchar(255),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_empresa_cnpj unique (cnpj)
);

comment on table empresa is 'empresas locadoras do grupo (localiza, movida, unidas, etc.)';
comment on column empresa.id_empresa is 'chave surrogate da empresa';
comment on column empresa.cnpj is 'cnpj único da empresa';

-- patio ------------------------------------------------------------------------
create table if not exists patio (
    id_patio bigserial primary key,
    id_empresa bigint not null references empresa(id_empresa),
    nome_patio text not null,
    tipo_patio varchar(20) not null check (tipo_patio in ('AEROPORTO', 'RODOVIARIA', 'SHOPPING')),
    endereco text not null,
    cidade text not null default 'Rio de Janeiro',
    estado varchar(2) not null default 'RJ',
    cep varchar(9),
    telefone varchar(20),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone
);

comment on table patio is 'pátios/agências onde os veículos ficam estacionados';

-- grupo_veiculo ----------------------------------------------------------------
create table if not exists grupo_veiculo (
    id_grupo bigserial primary key,
    codigo_grupo varchar(3) not null,
    nome_grupo text not null,
    descricao text,
    valor_diaria_base numeric(15,2) not null,
    capacidade_passageiros integer,
    capacidade_bagagem integer,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_grupo_codigo unique (codigo_grupo)
);

comment on table grupo_veiculo is 'categorias/grupos de veículos (econômico, suv, luxo, etc.)';

-- marca ------------------------------------------------------------------------
create table if not exists marca (
    id_marca bigserial primary key,
    nome_marca text not null,
    pais_origem varchar(50),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_marca_nome unique (nome_marca)
);

comment on table marca is 'marcas de veículos disponíveis na frota';

-- modelo -----------------------------------------------------------------------
create table if not exists modelo (
    id_modelo bigserial primary key,
    id_marca bigint not null references marca(id_marca),
    nome_modelo text not null,
    ano_fabricacao integer not null,
    ano_modelo integer not null,
    tipo_combustivel varchar(20) not null check (tipo_combustivel in ('FLEX', 'GASOLINA', 'ALCOOL', 'DIESEL', 'ELETRICO', 'HIBRIDO')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone
);

comment on table modelo is 'modelos de veículos vinculados às marcas';

-- caracteristica_tipo ----------------------------------------------------------
create table if not exists caracteristica_tipo (
    id_caracteristica bigserial primary key,
    codigo_caracteristica varchar(30) not null,
    nome_caracteristica text not null,
    descricao text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_caracteristica_codigo unique (codigo_caracteristica)
);

comment on table caracteristica_tipo is 'lista de acessórios e características dos veículos';

-- tipo_protecao ----------------------------------------------------------------
create table if not exists tipo_protecao (
    id_tipo_protecao bigserial primary key,
    codigo_protecao varchar(10) not null,
    nome_protecao text not null,
    descricao text,
    valor_diaria numeric(15,2) not null default 0,
    obrigatoria boolean not null default false,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_tipo_protecao_codigo unique (codigo_protecao)
);

comment on table tipo_protecao is 'tipos de proteções/seguros adicionais oferecidos';

-- -----------------------------------------------------------------------------
-- 2. tabelas de veículos
-- -----------------------------------------------------------------------------

-- veiculo ----------------------------------------------------------------------
create table if not exists veiculo (
    id_veiculo bigserial primary key,
    id_grupo bigint not null references grupo_veiculo(id_grupo),
    id_marca bigint not null references marca(id_marca),
    id_modelo bigint not null references modelo(id_modelo),
    id_patio_base bigint not null references patio(id_patio),
    id_patio_atual bigint references patio(id_patio),
    placa varchar(8) not null,
    chassis varchar(17) not null,
    renavam varchar(11),
    cor varchar(30) not null,
    km_atual numeric(12,3) not null default 0,
    status varchar(20) not null check (status in ('DISPONIVEL', 'EM_MANUTENCAO', 'EM_LOCACAO', 'INATIVO')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_veiculo_placa unique (placa),
    constraint uk_veiculo_chassis unique (chassis)
);

comment on table veiculo is 'frota de veículos disponíveis para locação';

-- veiculo_caracteristica -------------------------------------------------------
create table if not exists veiculo_caracteristica (
    id_veiculo_caracteristica bigserial primary key,
    id_veiculo bigint not null references veiculo(id_veiculo),
    id_caracteristica bigint not null references caracteristica_tipo(id_caracteristica),
    created_at timestamp with time zone not null default now(),
    constraint uk_veiculo_caracteristica unique (id_veiculo, id_caracteristica)
);

comment on table veiculo_caracteristica is 'relação n:n entre veículos e características';

-- foto_veiculo -----------------------------------------------------------------
create table if not exists foto_veiculo (
    id_foto_veiculo bigserial primary key,
    id_veiculo bigint not null references veiculo(id_veiculo),
    url_foto text not null,
    descricao text,
    ordem integer not null default 0,
    created_at timestamp with time zone not null default now()
);

comment on table foto_veiculo is 'fotos ilustrativas dos veículos';

-- prontuario_veiculo -----------------------------------------------------------
create table if not exists prontuario_veiculo (
    id_prontuario bigserial primary key,
    id_veiculo bigint not null references veiculo(id_veiculo),
    tipo_registro varchar(30) not null check (tipo_registro in ('REVISAO', 'MANUTENCAO', 'SINISTRO', 'TROCA_PECA', 'LIMPEZA', 'VISTORIA')),
    descricao text not null,
    data_registro timestamp with time zone not null,
    km_registro numeric(12,3),
    custo numeric(15,2),
    created_at timestamp with time zone not null default now()
);

comment on table prontuario_veiculo is 'histórico de manutenções e ocorrências da frota';

-- vaga_patio -------------------------------------------------------------------
create table if not exists vaga_patio (
    id_vaga bigserial primary key,
    id_patio bigint not null references patio(id_patio),
    codigo_vaga varchar(10) not null,
    status varchar(20) not null check (status in ('LIVRE', 'OCUPADA', 'RESERVADA', 'MANUTENCAO')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_vaga_patio_codigo unique (id_patio, codigo_vaga)
);

comment on table vaga_patio is 'vagas de estacionamento dentro de cada pátio';

-- -----------------------------------------------------------------------------
-- 3. tabelas de cliente e motorista
-- -----------------------------------------------------------------------------

-- cliente ----------------------------------------------------------------------
create table if not exists cliente (
    id_cliente bigserial primary key,
    tipo_cliente varchar(2) not null check (tipo_cliente in ('PF', 'PJ')),
    nome_cliente text not null,
    cpf varchar(14),
    cnpj varchar(18),
    rg varchar(20),
    email varchar(255),
    telefone varchar(20),
    endereco text,
    cidade text,
    estado varchar(2),
    cep varchar(9),
    data_nascimento date,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_cliente_cpf unique (cpf),
    constraint uk_cliente_cnpj unique (cnpj),
    constraint chk_cliente_documento check (
        (tipo_cliente = 'PF' and cpf is not null) or
        (tipo_cliente = 'PJ' and cnpj is not null)
    )
);

comment on table cliente is 'cadastro de clientes pessoa física e jurídica';

-- motorista --------------------------------------------------------------------
create table if not exists motorista (
    id_motorista bigserial primary key,
    id_cliente bigint not null references cliente(id_cliente),
    nome_motorista text not null,
    cnh varchar(11) not null,
    categoria_cnh varchar(2) not null check (categoria_cnh in ('B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE')),
    validade_cnh date not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint uk_motorista_cnh unique (cnh)
);

comment on table motorista is 'motoristas autorizados vinculados aos clientes pj ou pf';

-- -----------------------------------------------------------------------------
-- 4. tabelas transacionais
-- -----------------------------------------------------------------------------

-- reserva ----------------------------------------------------------------------
create table if not exists reserva (
    id_reserva bigserial primary key,
    id_cliente bigint not null references cliente(id_cliente),
    id_grupo bigint not null references grupo_veiculo(id_grupo),
    id_veiculo bigint references veiculo(id_veiculo),
    id_patio_retirada bigint not null references patio(id_patio),
    id_patio_devolucao bigint not null references patio(id_patio),
    data_reserva timestamp with time zone not null,
    data_retirada_prevista timestamp with time zone not null,
    data_devolucao_prevista timestamp with time zone not null,
    data_cancelamento timestamp with time zone,
    status_reserva varchar(20) not null check (status_reserva in ('PENDENTE', 'CONFIRMADA', 'EM_FILA', 'CANCELADA', 'NAO_COMPARECEU', 'CONCLUIDA')),
    valor_previsto numeric(15,2),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint chk_reserva_datas check (data_devolucao_prevista > data_retirada_prevista)
);

comment on table reserva is 'reservas realizadas pelos clientes';

-- locacao ----------------------------------------------------------------------
create table if not exists locacao (
    id_locacao bigserial primary key,
    id_reserva bigint references reserva(id_reserva),
    id_cliente bigint not null references cliente(id_cliente),
    id_veiculo bigint not null references veiculo(id_veiculo),
    id_motorista bigint references motorista(id_motorista),
    id_patio_retirada bigint not null references patio(id_patio),
    id_patio_devolucao bigint not null references patio(id_patio),
    data_retirada timestamp with time zone not null,
    data_devolucao_prevista timestamp with time zone not null,
    data_devolucao_efetiva timestamp with time zone,
    km_retirada numeric(12,3) not null,
    km_devolucao numeric(12,3),
    valor_total numeric(15,2),
    status_locacao varchar(20) not null check (status_locacao in ('AGENDADA', 'EM_ANDAMENTO', 'ATRASADA', 'EM_DEVOLUCAO', 'CONCLUIDA', 'CANCELADA')),
    estado_entrega text,
    estado_devolucao text,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint chk_locacao_datas check (data_devolucao_prevista >= data_retirada),
    constraint chk_locacao_km check (km_devolucao is null or km_devolucao >= km_retirada)
);

comment on table locacao is 'locações efetivadas a partir das reservas confirmadas';

-- cobranca ---------------------------------------------------------------------
create table if not exists cobranca (
    id_cobranca bigserial primary key,
    id_locacao bigint not null references locacao(id_locacao),
    valor_base numeric(15,2) not null,
    taxa_retorno_diferente numeric(15,2) not null default 0,
    valor_protecoes numeric(15,2) not null default 0,
    valor_total numeric(15,2) not null,
    status_cobranca varchar(20) not null check (status_cobranca in ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO', 'REEMBOLSADO')),
    data_vencimento date not null,
    data_pagamento timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone
);

comment on table cobranca is 'cobranças financeiras vinculadas às locações';

-- locacao_protecao -------------------------------------------------------------
create table if not exists locacao_protecao (
    id_locacao_protecao bigserial primary key,
    id_locacao bigint not null references locacao(id_locacao),
    id_tipo_protecao bigint not null references tipo_protecao(id_tipo_protecao),
    valor_diaria numeric(15,2) not null,
    quantidade_dias integer not null,
    valor_total numeric(15,2) not null,
    created_at timestamp with time zone not null default now()
);

comment on table locacao_protecao is 'proteções adicionais contratadas em cada locação';

-- ocupacao_vaga ----------------------------------------------------------------
create table if not exists ocupacao_vaga (
    id_ocupacao bigserial primary key,
    id_vaga bigint not null references vaga_patio(id_vaga),
    id_veiculo bigint not null references veiculo(id_veiculo),
    origem_frota varchar(20) not null check (origem_frota in ('FROTA_PROPRIA', 'FROTA_ASSOCIADA')),
    data_entrada timestamp with time zone not null,
    data_saida timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    deleted_at timestamp with time zone,
    constraint chk_ocupacao_datas check (data_saida is null or data_saida >= data_entrada)
);

comment on table ocupacao_vaga is 'histórico de ocupação de vagas nos pátios';

-- -----------------------------------------------------------------------------
-- 5. índices de apoio
-- -----------------------------------------------------------------------------

create index if not exists idx_veiculo_status on veiculo(status);
create index if not exists idx_veiculo_patio_atual on veiculo(id_patio_atual);
create index if not exists idx_cliente_tipo on cliente(tipo_cliente);
create index if not exists idx_reserva_cliente on reserva(id_cliente);
create index if not exists idx_reserva_status on reserva(status_reserva);
create index if not exists idx_locacao_veiculo on locacao(id_veiculo);
create index if not exists idx_locacao_status on locacao(status_locacao);
create index if not exists idx_cobranca_locacao on cobranca(id_locacao);
create index if not exists idx_ocupacao_vaga on ocupacao_vaga(id_vaga);
create index if not exists idx_ocupacao_veiculo on ocupacao_vaga(id_veiculo);
