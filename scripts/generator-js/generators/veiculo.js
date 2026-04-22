/**
 * veiculo.js
 * gera veículos, características, fotos, prontuário e vagas de pátio.
 */

'use strict';

const { faker } = require('@faker-js/faker/locale/pt_BR');
const SuperFakerBrasil = require('faker-brasil');
const db = require('../lib/database');
const logger = require('../lib/logger');

const fb = new SuperFakerBrasil();

const CORES = [
  'Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Marrom',
  'Bege', 'Verde', 'Amarelo', 'Laranja', 'Roxo', 'Bronze',
];

const STATUS_VEICULO = ['DISPONIVEL', 'EM_MANUTENCAO', 'EM_LOCACAO', 'INATIVO'];
const STATUS_PESOS = [0.55, 0.15, 0.20, 0.10]; // disponível é o mais comum

function pickStatus() {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < STATUS_VEICULO.length; i++) {
    acc += STATUS_PESOS[i];
    if (r <= acc) return STATUS_VEICULO[i];
  }
  return STATUS_VEICULO[0];
}

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMEROS = '0123456789';

function gerarPlacaMercosul() {
  // formato: ABC1D23
  let placa = '';
  for (let i = 0; i < 3; i++) placa += ALFABETO[Math.floor(Math.random() * 26)];
  placa += NUMEROS[Math.floor(Math.random() * 10)];
  placa += ALFABETO[Math.floor(Math.random() * 26)];
  placa += NUMEROS[Math.floor(Math.random() * 10)];
  placa += NUMEROS[Math.floor(Math.random() * 10)];
  return placa;
}

function gerarPlacaAntiga() {
  return fb.licensePlate(false);
}

function gerarPlaca() {
  // mistura placas mercosul (~70%) e antigas (~30%)
  if (Math.random() < 0.7) {
    return gerarPlacaMercosul();
  }
  return gerarPlacaAntiga();
}

function gerarFotos(idVeiculo) {
  const qtd = faker.number.int({ min: 2, max: 4 });
  const fotos = [];
  for (let i = 0; i < qtd; i++) {
    fotos.push({
      id_veiculo: idVeiculo,
      url_foto: `https://cdn.locadora.fake/veiculos/${idVeiculo}/foto_${i + 1}.jpg`,
      descricao: [' frontal', ' traseira', ' lateral', ' interior'][i],
      ordem: i + 1,
    });
  }
  return fotos;
}

function gerarProntuario(idVeiculo, kmAtual) {
  const qtd = faker.number.int({ min: 3, max: 10 });
  const tipos = ['REVISAO', 'MANUTENCAO', 'SINISTRO', 'TROCA_PECA', 'LIMPEZA', 'VISTORIA'];
  const registros = [];
  // distribuir ao longo dos últimos 3 anos
  for (let i = 0; i < qtd; i++) {
    const km = faker.number.int({ min: Math.max(0, kmAtual - 50000), max: kmAtual });
    registros.push({
      id_veiculo: idVeiculo,
      tipo_registro: tipos[faker.number.int({ min: 0, max: tipos.length - 1 })],
      descricao: `registro de ${tipos[i % tipos.length].toLowerCase()} #${i + 1}`,
      data_registro: faker.date.past({ years: 3 }),
      km_registro: km,
      custo: faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }),
    });
  }
  return registros;
}

async function runAll(seedData, scale) {
  const { patios, grupos, marcas, modelos, caracteristicas } = seedData;

  // gera veículos
  const veiculosRows = [];
  const placasUsadas = new Set();
  const chassisUsados = new Set();

  for (let i = 0; i < scale.veiculos; i++) {
    const grupo = faker.helpers.arrayElement(grupos);
    const modelo = faker.helpers.arrayElement(modelos);
    const patioBase = faker.helpers.arrayElement(patios);
    let placa;
    do { placa = gerarPlaca(); } while (placasUsadas.has(placa));
    placasUsadas.add(placa);
    let chassis;
    do { chassis = fb.chassi().replace(/\s/g, ''); } while (chassisUsados.has(chassis));
    chassisUsados.add(chassis);

    const km = faker.number.int({ min: 0, max: 150000 });

    veiculosRows.push({
      id_grupo: grupo.id_grupo,
      id_marca: modelo.id_marca,
      id_modelo: modelo.id_modelo,
      id_patio_base: patioBase.id_patio,
      id_patio_atual: patioBase.id_patio,
      placa,
      chassis,
      renavam: fb.renavam(),
      cor: faker.helpers.arrayElement(CORES),
      km_atual: km,
      status: pickStatus(),
    });
  }

  const veiculosRes = await db.insertBatch(
    'veiculo',
    ['id_grupo', 'id_marca', 'id_modelo', 'id_patio_base', 'id_patio_atual', 'placa', 'chassis', 'renavam', 'cor', 'km_atual', 'status'],
    veiculosRows
  );
  logger.success(`gerado: ${veiculosRes.rowCount} veículos`);
  const veiculos = veiculosRes.rows;

  // características por veículo
  const vcRows = [];
  for (const v of veiculos) {
    const qtd = faker.number.int({ min: 3, max: 8 });
    const escolhidas = faker.helpers.arrayElements(caracteristicas, qtd);
    for (const c of escolhidas) {
      vcRows.push({ id_veiculo: v.id_veiculo, id_caracteristica: c.id_caracteristica });
    }
  }
  await db.insertBatch('veiculo_caracteristica', ['id_veiculo', 'id_caracteristica'], vcRows);
  logger.success(`gerado: ${vcRows.length} veículo_característica`);

  // fotos
  const fotosRows = veiculos.flatMap((v) => gerarFotos(v.id_veiculo));
  await db.insertBatch('foto_veiculo', ['id_veiculo', 'url_foto', 'descricao', 'ordem'], fotosRows);
  logger.success(`gerado: ${fotosRows.length} fotos`);

  // prontuários
  const prontRows = veiculos.flatMap((v) => gerarProntuario(v.id_veiculo, v.km_atual));
  await db.insertBatch('prontuario_veiculo', ['id_veiculo', 'tipo_registro', 'descricao', 'data_registro', 'km_registro', 'custo'], prontRows);
  logger.success(`gerado: ${prontRows.length} prontuários`);

  // vagas de pátio
  const vagaRows = [];
  for (const p of patios) {
    const qtd = scale.vagasPorPatio;
    for (let i = 0; i < qtd; i++) {
      const letra = String.fromCharCode(65 + (i % 26));
      const numero = String(Math.floor(i / 26) * 100 + (i % 26) + 1).padStart(2, '0');
      vagaRows.push({
        id_patio: p.id_patio,
        codigo_vaga: `${letra}${numero}`,
        status: 'LIVRE',
      });
    }
  }
  const vagasRes = await db.insertBatch('vaga_patio', ['id_patio', 'codigo_vaga', 'status'], vagaRows);
  logger.success(`gerado: ${vagasRes.rowCount} vagas de pátio`);

  return { veiculos, vagas: vagasRes.rows };
}

module.exports = { runAll };
