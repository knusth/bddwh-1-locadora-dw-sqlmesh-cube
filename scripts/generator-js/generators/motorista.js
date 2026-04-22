/**
 * motorista.js
 * gera motoristas: 1-5 por pj, 0-1 por pf.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const SuperFakerBrasil = require('faker-brasil');
const db = require('../lib/database');
const logger = require('../lib/logger');

const fb = new SuperFakerBrasil();

const CATEGORIAS = ['B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

function gerarCnh(cnhUsados) {
  let cnhNum;
  do {
    const cnhObj = fb.cnh();
    cnhNum = typeof cnhObj === 'string' ? cnhObj : (cnhObj.register || String(cnhObj));
  } while (cnhUsados.has(cnhNum));
  cnhUsados.add(cnhNum);
  return cnhNum;
}

async function runAll(seedData, scale, clientes) {
  const cnhUsados = new Set();
  const rows = [];

  for (const c of clientes) {
    if (c.tipo_cliente === 'PJ') {
      const qtd = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < qtd; i++) {
        rows.push({
          id_cliente: c.id_cliente,
          nome_motorista: faker.person.fullName(),
          cnh: gerarCnh(cnhUsados),
          categoria_cnh: faker.helpers.arrayElement(CATEGORIAS),
          validade_cnh: faker.date.future({ years: 5 }),
        });
      }
    } else {
      // pf: 50% chance de ter um motorista adicional (exceto o próprio)
      if (Math.random() < 0.5) {
        rows.push({
          id_cliente: c.id_cliente,
          nome_motorista: faker.person.fullName(),
          cnh: gerarCnh(cnhUsados),
          categoria_cnh: faker.helpers.arrayElement(CATEGORIAS),
          validade_cnh: faker.date.future({ years: 5 }),
        });
      }
    }
  }

  const res = await db.insertBatch(
    'motorista',
    ['id_cliente', 'nome_motorista', 'cnh', 'categoria_cnh', 'validade_cnh'],
    rows
  );
  logger.success(`gerado: ${res.rowCount} motoristas`);
  return res.rows;
}

module.exports = { runAll };
