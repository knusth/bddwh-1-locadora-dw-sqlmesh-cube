#!/usr/bin/env node
/**
 * index.js
 * cli entrypoint do gerador de dados fake.
 */

'use strict';

const { Command } = require('commander');
const ora = require('ora');
const db = require('./lib/database');
const logger = require('./lib/logger');
const config = require('./lib/config');

const seedGen = require('./generators/seed');
const veiculoGen = require('./generators/veiculo');
const clienteGen = require('./generators/cliente');
const motoristaGen = require('./generators/motorista');
const reservaGen = require('./generators/reserva');
const locacaoGen = require('./generators/locacao');
const cobrancaGen = require('./generators/cobranca');
const ocupacaoGen = require('./generators/ocupacao');

const program = new Command();

program
  .name('locadora-data-generator')
  .description('gerador de dados fake para o banco olpt da locadora')
  .version('1.0.0')
  .option('--scale <size>', 'escala de geração: small, medium, large', 'medium')
  .option('--clean', 'trunca todas as tabelas antes de inserir', false)
  .parse();

const opts = program.opts();

async function main() {
  logger.info(`iniciando gerador | escala: ${opts.scale} | clean: ${opts.clean}`);

  if (opts.clean) {
    const spinner = ora('limpando tabelas...').start();
    await db.truncateAll();
    spinner.succeed('tabelas truncadas');
  }

  const scale = config.getScale(opts.scale);
  const totalStart = Date.now();

  // ---------------------------------------------------------------------------
  // 1. dados estáticos (seed)
  // ---------------------------------------------------------------------------
  let spinner = ora('inserindo dados estáticos...').start();
  const seedData = await seedGen.runAll(scale);
  spinner.succeed('dados estáticos inseridos');

  // ---------------------------------------------------------------------------
  // 2. veículos e infraestrutura
  // ---------------------------------------------------------------------------
  spinner = ora('gerando veículos, vagas, fotos e prontuários...').start();
  const { veiculos, vagas } = await veiculoGen.runAll(seedData, scale);
  spinner.succeed('veículos e infraestrutura gerados');

  // ---------------------------------------------------------------------------
  // 3. clientes e motoristas
  // ---------------------------------------------------------------------------
  spinner = ora('gerando clientes...').start();
  const clientes = await clienteGen.runAll(seedData, scale);
  spinner.succeed('clientes gerados');

  spinner = ora('gerando motoristas...').start();
  const motoristas = await motoristaGen.runAll(seedData, scale, clientes);
  spinner.succeed('motoristas gerados');

  // ---------------------------------------------------------------------------
  // 4. reservas
  // ---------------------------------------------------------------------------
  spinner = ora('gerando reservas...').start();
  const reservas = await reservaGen.runAll(seedData, scale, clientes, veiculos);
  spinner.succeed('reservas geradas');

  // ---------------------------------------------------------------------------
  // 5. locações
  // ---------------------------------------------------------------------------
  spinner = ora('gerando locações...').start();
  const locacoes = await locacaoGen.runAll(seedData, scale, clientes, veiculos, motoristas, reservas);
  spinner.succeed('locações geradas');

  // ---------------------------------------------------------------------------
  // 6. cobranças e proteções
  // ---------------------------------------------------------------------------
  spinner = ora('gerando cobranças...').start();
  await cobrancaGen.runAll(seedData, scale, locacoes, veiculos);
  spinner.succeed('cobranças geradas');

  // ---------------------------------------------------------------------------
  // 7. ocupação de vagas
  // ---------------------------------------------------------------------------
  spinner = ora('gerando ocupação de vagas...').start();
  await ocupacaoGen.runAll(seedData, scale, veiculos, vagas);
  spinner.succeed('ocupação de vagas gerada');

  const totalMs = Date.now() - totalStart;
  logger.success(`geração concluída em ${(totalMs / 1000).toFixed(2)}s`);

  await db.close();
  process.exit(0);
}

main().catch((err) => {
  logger.error(err.message);
  console.error(err.stack);
  db.close().then(() => process.exit(1));
});
