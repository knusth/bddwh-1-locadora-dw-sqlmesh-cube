/**
 * reserva.js
 * gera reservas com ciclo de vida realista.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const db = require('../lib/database');
const logger = require('../lib/logger');

const STATUS_RESERVA = ['PENDENTE', 'CONFIRMADA', 'EM_FILA', 'CANCELADA', 'NAO_COMPARECEU', 'CONCLUIDA'];
const STATUS_PESOS = [0.10, 0.50, 0.05, 0.15, 0.05, 0.15];

function pickStatusReserva() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATUS_RESERVA.length; i++) {
    acc += STATUS_PESOS[i];
    if (r <= acc) return STATUS_RESERVA[i];
  }
  return 'CONFIRMADA';
}

function gerarDatas() {
  // 30% reservas no futuro, 70% no passado (histórico de 2 anos)
  const noFuturo = Math.random() < 0.3;
  const dataReserva = noFuturo
    ? faker.date.soon({ days: 30 })
    : faker.date.past({ years: 2 });

  const duracaoDias = faker.number.int({ min: 1, max: 14 });
  const dataRetirada = new Date(dataReserva);
  dataRetirada.setDate(dataRetirada.getDate() + faker.number.int({ min: 0, max: 7 }));

  const dataDevolucao = new Date(dataRetirada);
  dataDevolucao.setDate(dataDevolucao.getDate() + duracaoDias);

  return { dataReserva, dataRetirada, dataDevolucao };
}

async function runAll(seedData, scale, clientes, veiculos) {
  const { patios, grupos } = seedData;
  const rows = [];

  for (let i = 0; i < scale.reservas; i++) {
    const cliente = faker.helpers.arrayElement(clientes);
    const grupo = faker.helpers.arrayElement(grupos);
    const patioRetirada = faker.helpers.arrayElement(patios);
    let patioDevolucao = faker.helpers.arrayElement(patios);
    // 70% devolve no mesmo pátio
    if (Math.random() < 0.7) {
      patioDevolucao = patioRetirada;
    }

    const { dataReserva, dataRetirada, dataDevolucao } = gerarDatas();
    const status = pickStatusReserva();

    // reservas canceladas podem ter data_cancelamento
    let dataCancelamento = null;
    if (status === 'CANCELADA') {
      dataCancelamento = new Date(dataReserva);
      dataCancelamento.setDate(dataCancelamento.getDate() + faker.number.int({ min: 0, max: 5 }));
      if (dataCancelamento > dataRetirada) dataCancelamento = dataRetirada;
    }

    // valor previsto baseado no grupo
    const diarias = Math.ceil((dataDevolucao - dataRetirada) / (1000 * 60 * 60 * 24));
    const valorPrevisto = diarias * grupo.valor_diaria_base;

    // algumas reservas têm veículo específico escolhido
    const veiculoEscolhido = Math.random() < 0.3 ? faker.helpers.arrayElement(veiculos) : null;

    rows.push({
      id_cliente: cliente.id_cliente,
      id_grupo: grupo.id_grupo,
      id_veiculo: veiculoEscolhido ? veiculoEscolhido.id_veiculo : null,
      id_patio_retirada: patioRetirada.id_patio,
      id_patio_devolucao: patioDevolucao.id_patio,
      data_reserva: dataReserva,
      data_retirada_prevista: dataRetirada,
      data_devolucao_prevista: dataDevolucao,
      data_cancelamento: dataCancelamento,
      status_reserva: status,
      valor_previsto: valorPrevisto,
    });
  }

  const res = await db.insertBatch(
    'reserva',
    ['id_cliente', 'id_grupo', 'id_veiculo', 'id_patio_retirada', 'id_patio_devolucao', 'data_reserva', 'data_retirada_prevista', 'data_devolucao_prevista', 'data_cancelamento', 'status_reserva', 'valor_previsto'],
    rows
  );
  logger.success(`gerado: ${res.rowCount} reservas`);
  return res.rows;
}

module.exports = { runAll };
