/**
 * locacao.js
 * gera locações a partir das reservas confirmadas, garantindo consistência
 * de datas e não sobreposição de veículos.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const db = require('../lib/database');
const logger = require('../lib/logger');

const STATUS_LOCACAO = ['AGENDADA', 'EM_ANDAMENTO', 'ATRASADA', 'EM_DEVOLUCAO', 'CONCLUIDA', 'CANCELADA'];

function pickStatusLocacao(dataRetirada, dataDevolucaoPrevista, dataDevolucaoEfetiva) {
  const agora = new Date();
  if (dataDevolucaoEfetiva) return 'CONCLUIDA';
  if (dataRetirada > agora) return 'AGENDADA';
  if (dataDevolucaoPrevista < agora) return 'ATRASADA';
  if (Math.random() < 0.1) return 'EM_DEVOLUCAO';
  return 'EM_ANDAMENTO';
}

async function runAll(seedData, scale, clientes, veiculos, motoristas, reservas) {
  // filtra apenas reservas confirmadas ou concluídas (que geram locação)
  const reservasElegiveis = reservas.filter(
    (r) => r.status_reserva === 'CONFIRMADA' || r.status_reserva === 'CONCLUIDA'
  );

  // número alvo de locações: ~80% das reservas elegíveis
  const alvo = Math.min(
    Math.floor(scale.reservas * 0.8),
    reservasElegiveis.length
  );

  // embaralha e pega um subconjunto
  const shuffled = faker.helpers.shuffle(reservasElegiveis).slice(0, alvo);

  // controle de ocupação de veículo por período
  const ocupacaoVeiculo = new Map(); // veiculoId -> [{inicio, fim}]

  const rows = [];

  for (const r of shuffled) {
    // encontra veículo disponível no grupo (ou o da reserva)
    let veiculoId = r.id_veiculo;
    if (!veiculoId) {
      const candidatos = veiculos.filter((v) => v.id_grupo === r.id_grupo);
      if (candidatos.length === 0) continue;
      veiculoId = faker.helpers.arrayElement(candidatos).id_veiculo;
    }

    const retirada = new Date(r.data_retirada_prevista);
    const devolucaoPrevista = new Date(r.data_devolucao_prevista);

    // ajusta retirada real (±1 dia)
    const ajuste = faker.number.int({ min: -1, max: 1 });
    retirada.setDate(retirada.getDate() + ajuste);

    // verifica sobreposição
    const historico = ocupacaoVeiculo.get(veiculoId) || [];
    const conflita = historico.some((h) => {
      return retirada < h.fim && devolucaoPrevista > h.inicio;
    });
    if (conflita) continue;

    // determina se já foi devolvido (reservas passadas)
    const agora = new Date();
    let devolucaoEfetiva = null;
    if (devolucaoPrevista < agora || r.status_reserva === 'CONCLUIDA') {
      const atraso = faker.number.int({ min: -1, max: 2 });
      devolucaoEfetiva = new Date(devolucaoPrevista);
      devolucaoEfetiva.setDate(devolucaoEfetiva.getDate() + atraso);
    }

    const status = pickStatusLocacao(retirada, devolucaoPrevista, devolucaoEfetiva);

    // km consistente
    const veiculo = veiculos.find((v) => v.id_veiculo === veiculoId);
    const kmRetirada = veiculo ? faker.number.int({ min: Math.max(0, veiculo.km_atual - 5000), max: veiculo.km_atual }) : faker.number.int({ min: 0, max: 100000 });
    const kmRodados = devolucaoEfetiva
      ? faker.number.int({ min: 50, max: 5000 })
      : null;
    const kmDevolucao = kmRodados !== null ? kmRetirada + kmRodados : null;

    // motorista
    const motoristasCliente = motoristas.filter((m) => m.id_cliente === r.id_cliente);
    let motoristaId = null;
    if (motoristasCliente.length > 0) {
      motoristaId = faker.helpers.arrayElement(motoristasCliente).id_motorista;
    }

    const diarias = Math.max(1, Math.ceil((devolucaoPrevista - retirada) / (1000 * 60 * 60 * 24)));
    const grupo = seedData.grupos.find((g) => g.id_grupo === r.id_grupo);
    const valorBase = diarias * (grupo ? grupo.valor_diaria_base : 150);
    const taxaRetorno = r.id_patio_retirada !== r.id_patio_devolucao
      ? faker.number.float({ min: 50, max: 150, fractionDigits: 2 })
      : 0;
    const valorTotal = valorBase + taxaRetorno;

    rows.push({
      id_reserva: r.id_reserva,
      id_cliente: r.id_cliente,
      id_veiculo: veiculoId,
      id_motorista: motoristaId,
      id_patio_retirada: r.id_patio_retirada,
      id_patio_devolucao: r.id_patio_devolucao,
      data_retirada: retirada,
      data_devolucao_prevista: devolucaoPrevista,
      data_devolucao_efetiva: devolucaoEfetiva,
      km_retirada: kmRetirada,
      km_devolucao: kmDevolucao,
      valor_total: valorTotal,
      status_locacao: status,
      estado_entrega: 'veículo entregue em boas condições',
      estado_devolucao: devolucaoEfetiva ? 'veículo devolvido sem observações' : null,
    });

    historico.push({ inicio: retirada, fim: devolucaoEfetiva || devolucaoPrevista });
    ocupacaoVeiculo.set(veiculoId, historico);
  }

  const res = await db.insertBatch(
    'locacao',
    ['id_reserva', 'id_cliente', 'id_veiculo', 'id_motorista', 'id_patio_retirada', 'id_patio_devolucao', 'data_retirada', 'data_devolucao_prevista', 'data_devolucao_efetiva', 'km_retirada', 'km_devolucao', 'valor_total', 'status_locacao', 'estado_entrega', 'estado_devolucao'],
    rows
  );
  logger.success(`gerado: ${res.rowCount} locações`);
  return res.rows;
}

module.exports = { runAll };
