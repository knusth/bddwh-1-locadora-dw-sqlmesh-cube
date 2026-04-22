cube(`FatoLocacao`, {
  sql: `SELECT * FROM marts__dev.fato_locacao`,

  title: `Locações`,
  description: `Fato de locações de veículos com métricas de receita, KM e atrasos.`,

  joins: {
    DimCliente: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_cliente = ${DimCliente}.sk_cliente`
    },

    DimVeiculo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_veiculo = ${DimVeiculo}.sk_veiculo`
    },

    DimPatio: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_patio_retirada = ${DimPatio}.sk_patio`
    },

    DimTempo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_data_retirada = ${DimTempo}.sk_data`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Total de Locações`,
      drillMembers: [idLocacao, statusLocacao, DimCliente.nomeCliente, DimVeiculo.placa]
    },

    receitaTotal: {
      sql: `valor_total`,
      type: `sum`,
      title: `Receita Total (R$)`,
      format: `currency`
    },

    receitaMedia: {
      sql: `valor_total`,
      type: `avg`,
      title: `Receita Média (R$)`,
      format: `currency`
    },

    kmTotalRodado: {
      sql: `km_rodados`,
      type: `sum`,
      title: `KM Total Rodado`
    },

    kmMedioRodado: {
      sql: `km_rodados`,
      type: `avg`,
      title: `KM Médio Rodado`
    },

    duracaoMediaDias: {
      sql: `duracao_efetiva_dias`,
      type: `avg`,
      title: `Duração Média (dias)`
    },

    locacoesAtrasadas: {
      type: `count`,
      title: `Locações Atrasadas`,
      filters: [{
        sql: `${CUBE}.flag_atraso = true`
      }]
    },

    locacoesConcluidas: {
      type: `count`,
      title: `Locações Concluídas`,
      filters: [{
        sql: `${CUBE}.flag_concluida = true`
      }]
    },

    taxaAtraso: {
      sql: `100.0 * ${locacoesAtrasadas} / NULLIF(${count}, 0)`,
      type: `number`,
      title: `Taxa de Atraso (%)`,
      format: `percent`
    },

    taxaConclusao: {
      sql: `100.0 * ${locacoesConcluidas} / NULLIF(${count}, 0)`,
      type: `number`,
      title: `Taxa de Conclusão (%)`,
      format: `percent`
    }
  },

  dimensions: {
    idLocacao: {
      sql: `id_locacao`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    idReserva: {
      sql: `id_reserva`,
      type: `number`,
      title: `ID Reserva`
    },

    statusLocacao: {
      sql: `status_locacao`,
      type: `string`,
      title: `Status da Locação`
    },

    dataRetirada: {
      sql: `data_retirada`,
      type: `time`,
      title: `Data de Retirada`
    },

    dataDevolucaoPrevista: {
      sql: `data_devolucao_prevista`,
      type: `time`,
      title: `Data de Devolução Prevista`
    },

    dataDevolucaoEfetiva: {
      sql: `data_devolucao_efetiva`,
      type: `time`,
      title: `Data de Devolução Efetiva`
    },

    duracaoEfetivaDias: {
      sql: `duracao_efetiva_dias`,
      type: `number`,
      title: `Duração Efetiva (dias)`
    },

    kmRetirada: {
      sql: `km_retirada`,
      type: `number`,
      title: `KM na Retirada`
    },

    kmDevolucao: {
      sql: `km_devolucao`,
      type: `number`,
      title: `KM na Devolução`
    },

    flagAtraso: {
      sql: `flag_atraso`,
      type: `boolean`,
      title: `Em Atraso?`
    },

    flagConcluida: {
      sql: `flag_concluida`,
      type: `boolean`,
      title: `Concluída?`
    }
  }
});
