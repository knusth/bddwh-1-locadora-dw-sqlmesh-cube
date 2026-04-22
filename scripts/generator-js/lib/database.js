/**
 * database.js
 * pool de conexões pg e helpers para operações batch/idempotentes.
 */

'use strict';

const { Pool } = require('pg');
const { dbConfig } = require('./config');
const logger = require('./logger');

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
  logger.error(`erro inesperado no pool pg: ${err.message}`);
  process.exit(-1);
});

/**
 * executa uma query parametrizada.
 */
async function query(text, params) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}

/**
 * insere múltiplas linhas usando insert … values com unnest (mais eficiente
 * que múltiplos inserts) ou insert múltiplo tradicional para batches pequenos.
 */
async function insertBatch(table, columns, rows, batchSize = 500) {
  if (rows.length === 0) return { rowCount: 0 };

  const results = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const placeholders = [];
    const values = [];
    let idx = 1;

    for (const row of chunk) {
      const rowPlaceholders = [];
      for (const col of columns) {
        values.push(row[col] ?? null);
        rowPlaceholders.push(`$${idx++}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const sql = `insert into ${table} (${columns.join(', ')}) values ${placeholders.join(', ')} returning *`;
    const res = await query(sql, values);
    results.push(res);
  }

  const totalRowCount = results.reduce((sum, r) => sum + r.rowCount, 0);
  return { rowCount: totalRowCount, rows: results.flatMap((r) => r.rows) };
}

/**
 * trunca todas as tabelas do schema público exceto as de controle do sqlmesh.
 */
async function truncateAll() {
  const sql = `
    truncate table
      locacao_protecao,
      cobranca,
      ocupacao_vaga,
      locacao,
      reserva,
      motorista,
      cliente,
      foto_veiculo,
      prontuario_veiculo,
      veiculo_caracteristica,
      vaga_patio,
      veiculo,
      modelo,
      marca,
      caracteristica_tipo,
      tipo_protecao,
      grupo_veiculo,
      patio,
      empresa,
      schema_migrations
    restart identity cascade;
  `;
  await query(sql);
}

/**
 * fecha o pool graciosamente.
 */
async function close() {
  await pool.end();
}

module.exports = { pool, query, insertBatch, truncateAll, close };
