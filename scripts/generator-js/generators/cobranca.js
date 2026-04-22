/**
 * cobranca.js
 * gera cobranças e proteções adicionais por locação.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const db = require('../lib/database');
const logger = require('../lib/logger');

const STATUS_COBRANCA = ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO', 'REEMBOLSADO'];

async function runAll(seedData, scale, locacoes, veiculos) {
  const { protecoes } = seedData;
  const cobrancaRows = [];
  const locacaoProtecaoRows = [];

  for (const l of locacoes) {
    const diarias = Math.max(1, Math.ceil((l.data_devolucao_prevista - l.data_retirada) / (1000 * 60 * 60 * 24)));
    const veiculo = veiculos.find((v) => v.id_veiculo === l.id_veiculo);
    const grupo = veiculo ? seedData.grupos.find((g) => g.id_grupo === veiculo.id_grupo) : null;
    const valorDiariaGrupo = grupo ? grupo.valor_diaria_base : 150;
    const valorBase = diarias * valorDiariaGrupo;

    const taxaRetorno = l.id_patio_retirada !== l.id_patio_devolucao
      ? faker.number.float({ min: 50, max: 150, fractionDigits: 2 })
      : 0;

    // proteções adicionais (0-3)
    const qtdProtecoes = faker.number.int({ min: 0, max: 3 });
    const protecoesEscolhidas = faker.helpers.arrayElements(protecoes, qtdProtecoes);
    let valorProtecoes = 0;

    for (const p of protecoesEscolhidas) {
      const val = p.valor_diaria * diarias;
      valorProtecoes += val;
      locacaoProtecaoRows.push({
        id_locacao: l.id_locacao,
        id_tipo_protecao: p.id_tipo_protecao,
        valor_diaria: p.valor_diaria,
        quantidade_dias: diarias,
        valor_total: val,
      });
    }

    const valorTotal = valorBase + taxaRetorno + valorProtecoes;

    // status da cobrança
    let status = 'PENDENTE';
    if (l.status_locacao === 'CONCLUIDA') {
      status = Math.random() < 0.85 ? 'PAGO' : faker.helpers.arrayElement(['ATRASADO', 'CANCELADO']);
    } else if (l.status_locacao === 'CANCELADA') {
      status = 'CANCELADO';
    }

    const dataVencimento = new Date(l.data_retirada);
    dataVencimento.setDate(dataVencimento.getDate() + 1);

    let dataPagamento = null;
    if (status === 'PAGO') {
      dataPagamento = new Date(dataVencimento);
      dataPagamento.setDate(dataPagamento.getDate() + faker.number.int({ min: -1, max: 5 }));
    }

    cobrancaRows.push({
      id_locacao: l.id_locacao,
      valor_base: valorBase,
      taxa_retorno_diferente: taxaRetorno,
      valor_protecoes: valorProtecoes,
      valor_total: valorTotal,
      status_cobranca: status,
      data_vencimento: dataVencimento,
      data_pagamento: dataPagamento,
    });
  }

  const cobRes = await db.insertBatch(
    'cobranca',
    ['id_locacao', 'valor_base', 'taxa_retorno_diferente', 'valor_protecoes', 'valor_total', 'status_cobranca', 'data_vencimento', 'data_pagamento'],
    cobrancaRows
  );
  logger.success(`gerado: ${cobRes.rowCount} cobranças`);

  const lpRes = await db.insertBatch(
    'locacao_protecao',
    ['id_locacao', 'id_tipo_protecao', 'valor_diaria', 'quantidade_dias', 'valor_total'],
    locacaoProtecaoRows
  );
  logger.success(`gerado: ${lpRes.rowCount} locação_proteções`);

  return { cobrancas: cobRes.rows, locacaoProtecoes: lpRes.rows };
}

module.exports = { runAll };
