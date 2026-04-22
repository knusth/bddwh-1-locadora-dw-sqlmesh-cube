cube(`FatoOcupacaoPatio`, {
  sql: `SELECT * FROM marts__dev.fato_ocupacao_patio`,

  title: `Ocupação de Pátios`,
  description: `Snapshot diário de ocupação de pátios com taxas e métricas operacionais.`,

  joins: {
    DimPatio: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_patio = ${DimPatio}.sk_patio`
    },

    DimTempo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_data = ${DimTempo}.sk_data`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Registros de Ocupação`
    },

    totalVeiculos: {
      sql: `total_veiculos`,
      type: `sum`,
      title: `Total de Veículos`
    },

    veiculosEmUso: {
      sql: `veiculos_em_uso`,
      type: `sum`,
      title: `Veículos em Uso`
    },

    veiculosDisponiveis: {
      sql: `veiculos_disponiveis`,
      type: `sum`,
      title: `Veículos Disponíveis`
    },

    taxaOcupacaoMedia: {
      sql: `taxa_ocupacao`,
      type: `avg`,
      title: `Taxa de Ocupação Média`,
      format: `percent`
    },

    valorLocacoesIniciadas: {
      sql: `valor_locacoes_iniciadas`,
      type: `sum`,
      title: `Valor Locações Iniciadas (R$)`,
      format: `currency`
    },

    utilizacaoFrota: {
      sql: `100.0 * SUM(${CUBE}.veiculos_em_uso) / NULLIF(SUM(${CUBE}.total_veiculos), 0)`,
      type: `number`,
      title: `Utilização da Frota (%)`,
      format: `percent`
    }
  },

  dimensions: {
    idPatioSource: {
      sql: `id_patio_source`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    dataReferencia: {
      sql: `data_referencia`,
      type: `time`,
      title: `Data de Referência`
    },

    totalVeiculosSnapshot: {
      sql: `total_veiculos`,
      type: `number`,
      title: `Total Veículos (snapshot)`
    },

    veiculosEmUsoSnapshot: {
      sql: `veiculos_em_uso`,
      type: `number`,
      title: `Veículos em Uso (snapshot)`
    },

    veiculosDistintosEmUso: {
      sql: `veiculos_distintos_em_uso`,
      type: `number`,
      title: `Veículos Distintos em Uso`
    },

    taxaOcupacao: {
      sql: `taxa_ocupacao`,
      type: `number`,
      title: `Taxa de Ocupação`
    },

    veiculosDisponiveisSnapshot: {
      sql: `veiculos_disponiveis`,
      type: `number`,
      title: `Veículos Disponíveis (snapshot)`
    }
  }
});
