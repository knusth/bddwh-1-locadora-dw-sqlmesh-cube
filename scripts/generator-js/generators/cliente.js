/**
 * cliente.js
 * gera clientes pessoa física (70%) e jurídica (30%) com endereços brasileiros.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const SuperFakerBrasil = require('faker-brasil');
const db = require('../lib/database');
const logger = require('../lib/logger');

const fb = new SuperFakerBrasil();

const TIPOS_CLIENTE = ['PF', 'PJ'];
const PESOS = [0.7, 0.3];

function pickTipo() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < TIPOS_CLIENTE.length; i++) {
    acc += PESOS[i];
    if (r <= acc) return TIPOS_CLIENTE[i];
  }
  return 'PF';
}

function parseDateBr(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function gerarClientePF(cpfUsados) {
  let cpf;
  do { cpf = fb.cpf(); } while (cpfUsados.has(cpf));
  cpfUsados.add(cpf);
  const person = fb.newAdultPerson();
  const endereco = fb.randomFullAddress();

  return {
    tipo_cliente: 'PF',
    nome_cliente: person.fullName,
    cpf,
    cnpj: null,
    rg: person.rg,
    email: person.email,
    telefone: person.phone ? person.phone.substring(0, 20) : null,
    endereco: `${endereco.street}, ${endereco.number} - ${endereco.neighborhood}`,
    cidade: endereco.city,
    estado: endereco.state,
    cep: endereco.cep,
    data_nascimento: parseDateBr(person.birthDate),
  };
}

function gerarClientePJ(cnpjUsados) {
  let cnpj;
  do { cnpj = fb.cnpj(); } while (cnpjUsados.has(cnpj));
  cnpjUsados.add(cnpj);

  const prefixos = ['Construtora', 'Tech Solutions', 'Logística', 'Comercial', 'Indústria', 'Serviços', 'Transportes', 'Consultoria'];
  const sufixos = ['Ltda', 'S.A.', 'MEI', 'EIRELI'];
  const nomeFantasia = `${faker.helpers.arrayElement(prefixos)} ${faker.person.lastName()} ${faker.helpers.arrayElement(sufixos)}`;
  const endereco = fb.randomFullAddress();

  return {
    tipo_cliente: 'PJ',
    nome_cliente: nomeFantasia,
    cpf: null,
    cnpj,
    rg: null,
    email: faker.internet.email({ firstName: nomeFantasia.split(' ')[0].toLowerCase(), provider: 'empresa.com.br' }),
    telefone: faker.phone.number('021-3###-####').substring(0, 20),
    endereco: `${endereco.street}, ${endereco.number} - ${endereco.neighborhood}`,
    cidade: endereco.city,
    estado: endereco.state,
    cep: endereco.cep,
    data_nascimento: null,
  };
}

async function runAll(seedData, scale) {
  const total = scale.clientes;
  const cpfUsados = new Set();
  const cnpjUsados = new Set();
  const rows = [];

  for (let i = 0; i < total; i++) {
    const tipo = pickTipo();
    if (tipo === 'PF') {
      rows.push(gerarClientePF(cpfUsados));
    } else {
      rows.push(gerarClientePJ(cnpjUsados));
    }
  }

  const res = await db.insertBatch(
    'cliente',
    ['tipo_cliente', 'nome_cliente', 'cpf', 'cnpj', 'rg', 'email', 'telefone', 'endereco', 'cidade', 'estado', 'cep', 'data_nascimento'],
    rows
  );
  logger.success(`gerado: ${res.rowCount} clientes`);
  return res.rows;
}

module.exports = { runAll };
