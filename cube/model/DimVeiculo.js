cube(`DimVeiculo`, {
  sql: `SELECT * FROM marts__dev.dim_veiculo`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [placa, marca, modelo, cor, statusVeiculo]
    }
  },

  dimensions: {
    skVeiculo: {
      sql: `sk_veiculo`,
      type: `string`,
      primaryKey: true,
      shown: true
    },

    idVeiculoSource: {
      sql: `id_veiculo_source`,
      type: `number`,
      title: `ID Veículo (Origem)`
    },

    placa: {
      sql: `placa`,
      type: `string`,
      title: `Placa`
    },

    marca: {
      sql: `marca`,
      type: `string`,
      title: `Marca`
    },

    modelo: {
      sql: `modelo`,
      type: `string`,
      title: `Modelo`
    },

    anoFabricacao: {
      sql: `ano_fabricacao`,
      type: `number`,
      title: `Ano de Fabricação`
    },

    anoModelo: {
      sql: `ano_modelo`,
      type: `number`,
      title: `Ano do Modelo`
    },

    cor: {
      sql: `cor`,
      type: `string`,
      title: `Cor`
    },

    statusVeiculo: {
      sql: `status_veiculo`,
      type: `string`,
      title: `Status do Veículo`
    },

    isDeleted: {
      sql: `is_deleted`,
      type: `boolean`,
      title: `Excluído`
    }
  }
});
