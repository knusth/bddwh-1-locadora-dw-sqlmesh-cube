/**
 * seed.js
 * gera e insere dados estáticos de referência (empresa, patio, grupo,
 * marca, modelo, caracteristica_tipo, tipo_protecao).
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const SuperFakerBrasil = require('faker-brasil');
const db = require('../lib/database');
const logger = require('../lib/logger');

const fb = new SuperFakerBrasil();

const EMPRESAS_DATA = [
  { nome: 'Localiza Rio', patio: 'Galeão', tipo: 'AEROPORTO', endereco: 'Av. Vinte de Janeiro, S/N - Galeão, Rio de Janeiro - RJ' },
  { nome: 'Movida Rio', patio: 'Santos Dumont', tipo: 'AEROPORTO', endereco: 'Praça Sen. Salgado Filho, S/N - Centro, Rio de Janeiro - RJ' },
  { nome: 'Unidas Rio', patio: 'Rodoviária', tipo: 'RODOVIARIA', endereco: 'Av. Francisco Bicalho, 1 - Santo Cristo, Rio de Janeiro - RJ' },
  { nome: 'Foco Rio', patio: 'Rio Sul', tipo: 'SHOPPING', endereco: 'Rua Lauro Müller, 116 - Botafogo, Rio de Janeiro - RJ' },
  { nome: 'Alamo Rio', patio: 'Nova América', tipo: 'SHOPPING', endereco: 'Av. Pastor Martin Luther King Jr., 126 - Del Castilho, Rio de Janeiro - RJ' },
  { nome: 'Hertz Rio', patio: 'Barra Shopping', tipo: 'SHOPPING', endereco: 'Av. das Américas, 4666 - Barra da Tijuca, Rio de Janeiro - RJ' },
];

const GRUPOS_DATA = [
  { codigo: 'ECN', nome: 'Econômico', descricao: 'Fiat Mobi, Renault Kwid', diaria: 129.9, passageiros: 5, bagagem: 2 },
  { codigo: 'INT', nome: 'Intermediário', descricao: 'VW Polo, Hyundai HB20', diaria: 169.9, passageiros: 5, bagagem: 3 },
  { codigo: 'SUV', nome: 'SUV', descricao: 'Jeep Compass, VW T-Cross', diaria: 249.9, passageiros: 5, bagagem: 4 },
  { codigo: 'EXC', nome: 'Executivo', descricao: 'Toyota Corolla, Honda Civic', diaria: 329.9, passageiros: 5, bagagem: 3 },
  { codigo: 'LUX', nome: 'Premium', descricao: 'BMW 320i, Mercedes C180', diaria: 599.9, passageiros: 5, bagagem: 4 },
  { codigo: 'VAN', nome: 'Van', descricao: 'Chevrolet Spin, Fiat Doblò', diaria: 279.9, passageiros: 7, bagagem: 4 },
  { codigo: 'PIC', nome: 'Pick-up', descricao: 'Fiat Toro, Toyota Hilux', diaria: 359.9, passageiros: 5, bagagem: 5 },
];

const MARCAS_DATA = [
  'Fiat', 'Volkswagen', 'Chevrolet', 'Ford', 'Toyota', 'Honda', 'Hyundai',
  'Jeep', 'Renault', 'Nissan', 'Peugeot', 'Citroën', 'BMW', 'Mercedes-Benz',
  'Audi',
];

const MODELOS_DATA = [
  // Fiat
  { marca: 'Fiat', nome: 'Mobi', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Fiat', nome: 'Argo', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Fiat', nome: 'Cronos', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Fiat', nome: 'Toro', ano: 2023, combustivel: 'DIESEL' },
  { marca: 'Fiat', nome: 'Doblò', ano: 2022, combustivel: 'FLEX' },
  // Volkswagen
  { marca: 'Volkswagen', nome: 'Gol', ano: 2022, combustivel: 'FLEX' },
  { marca: 'Volkswagen', nome: 'Polo', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Volkswagen', nome: 'Virtus', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Volkswagen', nome: 'T-Cross', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Volkswagen', nome: 'Nivus', ano: 2023, combustivel: 'FLEX' },
  // Chevrolet
  { marca: 'Chevrolet', nome: 'Onix', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Chevrolet', nome: 'Onix Plus', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Chevrolet', nome: 'Tracker', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Chevrolet', nome: 'Spin', ano: 2022, combustivel: 'FLEX' },
  { marca: 'Chevrolet', nome: 'S10', ano: 2023, combustivel: 'DIESEL' },
  // Ford
  { marca: 'Ford', nome: 'Ka', ano: 2021, combustivel: 'FLEX' },
  { marca: 'Ford', nome: 'EcoSport', ano: 2022, combustivel: 'FLEX' },
  // Toyota
  { marca: 'Toyota', nome: 'Etios', ano: 2021, combustivel: 'FLEX' },
  { marca: 'Toyota', nome: 'Yaris', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Toyota', nome: 'Corolla', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Toyota', nome: 'Hilux', ano: 2023, combustivel: 'DIESEL' },
  { marca: 'Toyota', nome: 'RAV4', ano: 2023, combustivel: 'HIBRIDO' },
  // Honda
  { marca: 'Honda', nome: 'Fit', ano: 2022, combustivel: 'FLEX' },
  { marca: 'Honda', nome: 'City', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Honda', nome: 'Civic', ano: 2023, combustivel: 'GASOLINA' },
  { marca: 'Honda', nome: 'HR-V', ano: 2023, combustivel: 'FLEX' },
  // Hyundai
  { marca: 'Hyundai', nome: 'HB20', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Hyundai', nome: 'Creta', ano: 2023, combustivel: 'FLEX' },
  // Jeep
  { marca: 'Jeep', nome: 'Renegade', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Jeep', nome: 'Compass', ano: 2023, combustivel: 'DIESEL' },
  { marca: 'Jeep', nome: 'Commander', ano: 2023, combustivel: 'DIESEL' },
  // Renault
  { marca: 'Renault', nome: 'Kwid', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Renault', nome: 'Logan', ano: 2022, combustivel: 'FLEX' },
  { marca: 'Renault', nome: 'Duster', ano: 2023, combustivel: 'FLEX' },
  // Nissan
  { marca: 'Nissan', nome: 'Versa', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Nissan', nome: 'Kicks', ano: 2023, combustivel: 'FLEX' },
  // Peugeot
  { marca: 'Peugeot', nome: '208', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Peugeot', nome: '2008', ano: 2023, combustivel: 'FLEX' },
  // Citroën
  { marca: 'Citroën', nome: 'C3', ano: 2023, combustivel: 'FLEX' },
  { marca: 'Citroën', nome: 'C4 Cactus', ano: 2022, combustivel: 'FLEX' },
  // BMW
  { marca: 'BMW', nome: '320i', ano: 2023, combustivel: 'GASOLINA' },
  { marca: 'BMW', nome: 'X1', ano: 2023, combustivel: 'GASOLINA' },
  // Mercedes-Benz
  { marca: 'Mercedes-Benz', nome: 'C180', ano: 2023, combustivel: 'GASOLINA' },
  { marca: 'Mercedes-Benz', nome: 'GLA200', ano: 2023, combustivel: 'GASOLINA' },
  // Audi
  { marca: 'Audi', nome: 'A3', ano: 2023, combustivel: 'GASOLINA' },
  { marca: 'Audi', nome: 'Q3', ano: 2023, combustivel: 'GASOLINA' },
];

const CARACTERISTICAS_DATA = [
  { codigo: 'ar_condicionado', nome: 'Ar Condicionado' },
  { codigo: 'direcao_hidraulica', nome: 'Direção Hidráulica' },
  { codigo: 'direcao_eletrica', nome: 'Direção Elétrica' },
  { codigo: 'trava_eletrica', nome: 'Trava Elétrica' },
  { codigo: 'vidro_eletrico', nome: 'Vidro Elétrico' },
  { codigo: 'airbag', nome: 'Airbag' },
  { codigo: 'abs', nome: 'Freios ABS' },
  { codigo: 'cadeirinha', nome: 'Cadeirinha Infantil' },
  { codigo: 'bebe_conforto', nome: 'Bebê Conforto' },
  { codigo: 'gps', nome: 'GPS Integrado' },
  { codigo: 'bluetooth', nome: 'Bluetooth' },
  { codigo: 'sensor_estacionamento', nome: 'Sensor de Estacionamento' },
  { codigo: 'camera_re', nome: 'Câmera de Ré' },
  { codigo: 'banco_couro', nome: 'Banco de Couro' },
  { codigo: 'teto_solar', nome: 'Teto Solar' },
  { codigo: 'multimidia', nome: 'Central Multimídia' },
  { codigo: 'piloto_automatico', nome: 'Piloto Automático' },
  { codigo: 'controle_estabilidade', nome: 'Controle de Estabilidade' },
  { codigo: 'freio_disco', nome: 'Freio a Disco nas 4 Rodas' },
];

const PROTECOES_DATA = [
  { codigo: 'BAS', nome: 'Básica (Obrigatória)', diaria: 29.9, obrigatoria: true },
  { codigo: 'LDW', nome: 'LDW - Proteção de Danos', diaria: 49.9, obrigatoria: false },
  { codigo: 'PEC', nome: 'PEC - Vidros/Faróis', diaria: 34.9, obrigatoria: false },
  { codigo: 'ALI', nome: 'ALI - Proteção Total', diaria: 79.9, obrigatoria: false },
  { codigo: 'MAD', nome: 'Motorista Adicional', diaria: 25.0, obrigatoria: false },
  { codigo: 'GPS', nome: 'GPS', diaria: 19.9, obrigatoria: false },
  { codigo: 'CAD', nome: 'Cadeirinha', diaria: 29.9, obrigatoria: false },
];

async function seedEmpresas() {
  const rows = EMPRESAS_DATA.map((e) => ({
    nome_empresa: e.nome,
    cnpj: fb.cnpj(),
    telefone: faker.phone.number('021-9####-####'),
    email: faker.internet.email({ firstName: e.nome.split(' ')[0].toLowerCase(), provider: 'locadora.com.br' }),
  }));
  const res = await db.insertBatch('empresa', ['nome_empresa', 'cnpj', 'telefone', 'email'], rows);
  logger.success(`seed: ${res.rowCount} empresas inseridas`);
  return res.rows;
}

async function seedPatios(empresas) {
  const rows = empresas.map((e, i) => ({
    id_empresa: e.id_empresa,
    nome_patio: EMPRESAS_DATA[i].patio,
    tipo_patio: EMPRESAS_DATA[i].tipo,
    endereco: EMPRESAS_DATA[i].endereco,
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: faker.location.zipCode('#####-###'),
    telefone: faker.phone.number('021-3###-####'),
  }));
  const res = await db.insertBatch('patio', ['id_empresa', 'nome_patio', 'tipo_patio', 'endereco', 'cidade', 'estado', 'cep', 'telefone'], rows);
  logger.success(`seed: ${res.rowCount} pátios inseridos`);
  return res.rows;
}

async function seedGrupos() {
  const rows = GRUPOS_DATA.map((g) => ({
    codigo_grupo: g.codigo,
    nome_grupo: g.nome,
    descricao: g.descricao,
    valor_diaria_base: g.diaria,
    capacidade_passageiros: g.passageiros,
    capacidade_bagagem: g.bagagem,
  }));
  const res = await db.insertBatch('grupo_veiculo', ['codigo_grupo', 'nome_grupo', 'descricao', 'valor_diaria_base', 'capacidade_passageiros', 'capacidade_bagagem'], rows);
  logger.success(`seed: ${res.rowCount} grupos de veículo inseridos`);
  return res.rows;
}

async function seedMarcas() {
  const rows = MARCAS_DATA.map((m) => ({
    nome_marca: m,
    pais_origem: ['Itália', 'Alemanha', 'Brasil', 'EUA', 'Japão', 'França', 'Coreia do Sul'][faker.number.int({ min: 0, max: 6 })],
  }));
  const res = await db.insertBatch('marca', ['nome_marca', 'pais_origem'], rows);
  logger.success(`seed: ${res.rowCount} marcas inseridas`);
  return res.rows;
}

async function seedModelos(marcas) {
  const marcaMap = new Map(marcas.map((m) => [m.nome_marca, m.id_marca]));
  const rows = MODELOS_DATA.map((m) => ({
    id_marca: marcaMap.get(m.marca),
    nome_modelo: m.nome,
    ano_fabricacao: m.ano,
    ano_modelo: m.ano,
    tipo_combustivel: m.combustivel,
  }));
  const res = await db.insertBatch('modelo', ['id_marca', 'nome_modelo', 'ano_fabricacao', 'ano_modelo', 'tipo_combustivel'], rows);
  logger.success(`seed: ${res.rowCount} modelos inseridos`);
  return res.rows;
}

async function seedCaracteristicas() {
  const rows = CARACTERISTICAS_DATA.map((c) => ({
    codigo_caracteristica: c.codigo,
    nome_caracteristica: c.nome,
    descricao: c.nome,
  }));
  const res = await db.insertBatch('caracteristica_tipo', ['codigo_caracteristica', 'nome_caracteristica', 'descricao'], rows);
  logger.success(`seed: ${res.rowCount} características inseridas`);
  return res.rows;
}

async function seedProtecoes() {
  const rows = PROTECOES_DATA.map((p) => ({
    codigo_protecao: p.codigo,
    nome_protecao: p.nome,
    descricao: p.nome,
    valor_diaria: p.diaria,
    obrigatoria: p.obrigatoria,
  }));
  const res = await db.insertBatch('tipo_protecao', ['codigo_protecao', 'nome_protecao', 'descricao', 'valor_diaria', 'obrigatoria'], rows);
  logger.success(`seed: ${res.rowCount} proteções inseridas`);
  return res.rows;
}

/**
 * executa todas as seeds na ordem correta e retorna um objeto com
 * todos os registros inseridos para uso nos geradores dinâmicos.
 */
async function runAll(scale) {
  const empresas = await seedEmpresas();
  const patios = await seedPatios(empresas);
  const grupos = await seedGrupos();
  const marcas = await seedMarcas();
  const modelos = await seedModelos(marcas);
  const caracteristicas = await seedCaracteristicas();
  const protecoes = await seedProtecoes();

  return { empresas, patios, grupos, marcas, modelos, caracteristicas, protecoes };
}

module.exports = { runAll };
