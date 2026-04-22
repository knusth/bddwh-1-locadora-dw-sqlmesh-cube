/**
 * ocupacao.js
 * gera histórico de ocupação de vagas nos pátios.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const db = require('../lib/database');
const logger = require('../lib/logger');

async function runAll(seedData, scale, veiculos, vagas) {
  const rows = [];
  // para cada veículo, cria 1-3 registros de ocupação (histórico)
  for (const v of veiculos) {
    const qtd = faker.number.int({ min: 1, max: 3 });
    let dataCursor = faker.date.past({ years: 2 });

    for (let i = 0; i < qtd; i++) {
      const vaga = faker.helpers.arrayElement(vagas);
      const duracaoDias = faker.number.int({ min: 7, max: 120 });
      const dataEntrada = new Date(dataCursor);
      const dataSaida = new Date(dataEntrada);
      dataSaida.setDate(dataSaida.getDate() + duracaoDias);

      rows.push({
        id_vaga: vaga.id_vaga,
        id_veiculo: v.id_veiculo,
        origem_frota: faker.helpers.arrayElement(['FROTA_PROPRIA', 'FROTA_ASSOCIADA']),
        data_entrada: dataEntrada,
        data_saida: i === qtd - 1 ? null : dataSaida, // último pode ser ocupação atual
      });

      dataCursor = new Date(dataSaida);
      dataCursor.setDate(dataCursor.getDate() + faker.number.int({ min: 0, max: 3 }));
    }
  }

  const res = await db.insertBatch(
    'ocupacao_vaga',
    ['id_vaga', 'id_veiculo', 'origem_frota', 'data_entrada', 'data_saida'],
    rows
  );
  logger.success(`gerado: ${res.rowCount} ocupações de vaga`);
  return res.rows;
}

module.exports = { runAll };
