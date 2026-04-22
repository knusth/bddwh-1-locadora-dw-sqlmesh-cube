cube(`FatoReserva`, {
  sql: `SELECT * FROM marts__dev.fato_reserva`,

  title: `Reservas`,
  description: `Fato de reservas com métricas de conversão, no-show e lead time.`,

  joins: {
    DimCliente: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_cliente = ${DimCliente}.sk_cliente`
    },

    DimGrupoVeiculo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_grupo_veiculo = ${DimGrupoVeiculo}.sk_grupo_veiculo`
    },

    DimPatio: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_patio_retirada = ${DimPatio}.sk_patio`
    },

    DimTempo: {
      relationship: `many_to_one`,
      sql: `${CUBE}.sk_data_reserva = ${DimTempo}.sk_data`
    }
  },

  measures: {
    count: {
      type: `count`,
      title: `Total de Reservas`,
      drillMembers: [idReserva, statusReserva, DimCliente.nomeCliente, DimGrupoVeiculo.nomeGrupo]
    },

    valorPrevistoTotal: {
      sql: `valor_previsto`,
      type: `sum`,
      title: `Valor Previsto Total (R$)`,
      format: `currency`
    },

    valorPrevistoMedio: {
      sql: `valor_previsto`,
      type: `avg`,
      title: `Valor Previsto Médio (R$)`,
      format: `currency`
    },

    leadTimeMedio: {
      sql: `lead_time_dias`,
      type: `avg`,
      title: `Lead Time Médio (dias)`
    },

    duracaoPrevistaMedia: {
      sql: `duracao_prevista_dias`,
      type: `avg`,
      title: `Duração Prevista Média (dias)`
    },

    reservasCanceladas: {
      type: `count`,
      title: `Reservas Canceladas`,
      filters: [{
        sql: `${CUBE}.flag_cancelada = true`
      }]
    },

    reservasNoShow: {
      type: `count`,
      title: `Reservas No-Show`,
      filters: [{
        sql: `${CUBE}.flag_no_show = true`
      }]
    },

    reservasConvertidas: {
      type: `count`,
      title: `Reservas Convertidas`,
      filters: [{
        sql: `${CUBE}.flag_convertida_locacao = true`
      }]
    },

    taxaCancelamento: {
      sql: `100.0 * ${reservasCanceladas} / NULLIF(${count}, 0)`,
      type: `number`,
      title: `Taxa de Cancelamento (%)`,
      format: `percent`
    },

    taxaConversao: {
      sql: `100.0 * ${reservasConvertidas} / NULLIF(${count}, 0)`,
      type: `number`,
      title: `Taxa de Conversão (%)`,
      format: `percent`
    },

    taxaNoShow: {
      sql: `100.0 * ${reservasNoShow} / NULLIF(${count}, 0)`,
      type: `number`,
      title: `Taxa de No-Show (%)`,
      format: `percent`
    }
  },

  dimensions: {
    idReserva: {
      sql: `id_reserva`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    statusReserva: {
      sql: `status_reserva`,
      type: `string`,
      title: `Status da Reserva`
    },

    dataReserva: {
      sql: `data_reserva`,
      type: `time`,
      title: `Data da Reserva`
    },

    dataRetiradaPrevista: {
      sql: `data_retirada_prevista`,
      type: `time`,
      title: `Data de Retirada Prevista`
    },

    dataDevolucaoPrevista: {
      sql: `data_devolucao_prevista`,
      type: `time`,
      title: `Data de Devolução Prevista`
    },

    dataCancelamento: {
      sql: `data_cancelamento`,
      type: `time`,
      title: `Data de Cancelamento`
    },

    duracaoPrevistaDias: {
      sql: `duracao_prevista_dias`,
      type: `number`,
      title: `Duração Prevista (dias)`
    },

    leadTimeDias: {
      sql: `lead_time_dias`,
      type: `number`,
      title: `Lead Time (dias)`
    },

    flagNoShow: {
      sql: `flag_no_show`,
      type: `boolean`,
      title: `No-Show?`
    },

    flagCancelada: {
      sql: `flag_cancelada`,
      type: `boolean`,
      title: `Cancelada?`
    },

    flagConvertida: {
      sql: `flag_convertida_locacao`,
      type: `boolean`,
      title: `Convertida p/ Locação?`
    }
  }
});
