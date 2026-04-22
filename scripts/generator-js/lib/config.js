/**
 * config.js
 * configurações de escala e conexão com o banco de dados.
 */

'use strict';

const scales = {
  small: {
    veiculos: 100,
    clientes: 200,
    reservas: 500,
    vagasPorPatio: 30,
  },
  medium: {
    veiculos: 150,
    clientes: 500,
    reservas: 1500,
    vagasPorPatio: 40,
  },
  large: {
    veiculos: 300,
    clientes: 1000,
    reservas: 5000,
    vagasPorPatio: 50,
  },
};

const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'locadora_admin',
  password: process.env.PGPASSWORD || 'locadora_secret_2024',
  database: process.env.PGDATABASE || 'locadora_dw',
  // pool config otimizado para carga batch
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

function getScale(name) {
  const scale = scales[name];
  if (!scale) {
    throw new Error(`escala desconhecida: ${name}. use: small, medium, large`);
  }
  return scale;
}

module.exports = { scales, dbConfig, getScale };
