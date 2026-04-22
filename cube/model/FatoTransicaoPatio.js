cube(`FatoTransicaoPatio`, {
  sql: `SELECT * FROM marts__dev.fato_transicao_patio`,

  title: `Transições de Pátio`,
  description: `Matriz de transição entre pátios para análise de Markov e reposicionamento de frota.`,

  joins: {
    DimTempo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_mes_referencia = ${DimTempo}.sk_data`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Registros de Transição`
    },

    totalTransicoes: {
      sql: `total_transicoes`,
      type: `sum`,
      title: `Total de Transições`
    },

    totalSaidas: {
      sql: `total_saidas`,
      type: `sum`,
      title: `Total de Saídas`
    },

    probabilidadeTransicaoMedia: {
      sql: `probabilidade_transicao`,
      type: `avg`,
      title: `Prob. de Transição Média`,
      format: `percent`
    },

    mediaKmRodados: {
      sql: `media_km_rodados`,
      type: `avg`,
      title: `KM Médio Rodado`
    },

    mediaDuracaoDias: {
      sql: `media_duracao_dias`,
      type: `avg`,
      title: `Duração Média (dias)`
    },

    valorTotalTransicoes: {
      sql: `valor_total_transicoes`,
      type: `sum`,
      title: `Valor Total das Transições (R$)`,
      format: `currency`
    }
  },

  dimensions: {
    pk: {
      sql: `CONCAT(${CUBE}.sk_patio_origem, '-', ${CUBE}.sk_patio_destino, '-', ${CUBE}.mes_referencia)`,
      type: `string`,
      primaryKey: true,
      shown: false
    },

    idPatioOrigem: {
      sql: `id_patio_origem_source`,
      type: `number`,
      title: `ID Pátio Origem`
    },

    idPatioDestino: {
      sql: `id_patio_destino_source`,
      type: `number`,
      title: `ID Pátio Destino`
    },

    mesReferencia: {
      sql: `mes_referencia`,
      type: `time`,
      title: `Mês de Referência`
    },

    totalTransicoesSnapshot: {
      sql: `total_transicoes`,
      type: `number`,
      title: `Total Transições (snapshot)`
    },

    probabilidadeTransicao: {
      sql: `probabilidade_transicao`,
      type: `number`,
      title: `Probabilidade de Transição`
    }
  }
});
