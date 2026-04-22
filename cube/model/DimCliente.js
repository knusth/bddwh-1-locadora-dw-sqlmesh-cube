cube(`DimCliente`, {
  sql: `SELECT * FROM marts__dev.dim_cliente`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [idClienteSource, nomeCliente, cidade, estado, tipoCliente]
    }
  },

  dimensions: {
    skCliente: {
      sql: `sk_cliente`,
      type: `string`,
      primaryKey: true,
      shown: true
    },

    idClienteSource: {
      sql: `id_cliente_source`,
      type: `number`,
      title: `ID Cliente (Origem)`
    },

    nomeCliente: {
      sql: `nome_cliente`,
      type: `string`,
      title: `Nome do Cliente`
    },

    cpf: {
      sql: `cpf`,
      type: `string`,
      title: `CPF`
    },

    email: {
      sql: `email`,
      type: `string`,
      title: `E-mail`
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

    tipoCliente: {
      sql: `tipo_cliente`,
      type: `string`,
      title: `Tipo de Cliente`
    },

    dataNascimento: {
      sql: `data_nascimento`,
      type: `time`,
      title: `Data de Nascimento`
    },

    validFrom: {
      sql: `valid_from_dttm`,
      type: `time`,
      title: `Válido Desde`
    },

    validTo: {
      sql: `valid_to_dttm`,
      type: `time`,
      title: `Válido Até`
    },

    isDeleted: {
      sql: `is_deleted`,
      type: `boolean`,
      title: `Excluído`
    }
  }
});
