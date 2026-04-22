cube(`DimPatio`, {
  sql: `SELECT * FROM marts__dev.dim_patio`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [nomePatio, tipoPatio, cidade]
    }
  },

  dimensions: {
    skPatio: {
      sql: `sk_patio`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    idPatioSource: {
      sql: `id_patio_source`,
      type: `number`,
      title: `ID Pátio (Origem)`
    },

    nomePatio: {
      sql: `nome_patio`,
      type: `string`,
      title: `Nome do Pátio`
    },

    tipoPatio: {
      sql: `tipo_patio`,
      type: `string`,
      title: `Tipo de Pátio`
    },

    cidade: {
      sql: `cidade`,
      type: `string`,
      title: `Cidade`
    },

    estado: {
      sql: `estado`,
      type: `string`,
      title: `Estado`
    },

    isDeleted: {
      sql: `is_deleted`,
      type: `boolean`,
      title: `Excluído`
    }
  }
});
