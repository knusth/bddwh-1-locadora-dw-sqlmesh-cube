cube(`DimTempo`, {
  sql: `SELECT * FROM marts__dev.dim_tempo`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [ano, mes, trimestre]
    }
  },

  dimensions: {
    skData: {
      sql: `sk_data`,
      type: `time`,
      primaryKey: true,
      shown: true
    },

    ano: {
      sql: `ano`,
      type: `number`,
      title: `Ano`
    },

    mes: {
      sql: `mes`,
      type: `number`,
      title: `Mês`
    },

    dia: {
      sql: `dia`,
      type: `number`,
      title: `Dia`
    },

    trimestre: {
      sql: `trimestre`,
      type: `number`,
      title: `Trimestre`
    },

    semestre: {
      sql: `semestre`,
      type: `number`,
      title: `Semestre`
    },

    nomeMes: {
      sql: `nome_mes`,
      type: `string`,
      title: `Nome do Mês`
    },

    nomeDiaSemana: {
      sql: `nome_dia_semana`,
      type: `string`,
      title: `Dia da Semana`
    },

    anoMes: {
      sql: `ano_mes`,
      type: `number`,
      title: `Ano-Mês (AAAAMM)`
    },

    ehFinalDeSemana: {
      sql: `eh_final_de_semana`,
      type: `boolean`,
      title: `Final de Semana?`
    },

    ehFeriadoNacionalFixo: {
      sql: `eh_feriado_nacional_fixo`,
      type: `boolean`,
      title: `Feriado Nacional?`
    },

    ehDiaUtil: {
      sql: `eh_dia_util`,
      type: `boolean`,
      title: `Dia Útil?`
    }
  }
});
