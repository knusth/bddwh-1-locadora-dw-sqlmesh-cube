cube(`DimGrupoVeiculo`, {
  sql: `SELECT * FROM marts__dev.dim_grupo_veiculo`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [codigoGrupo, nomeGrupo]
    },

    mediaDiariaBase: {
      sql: `valor_diaria_base`,
      type: `avg`,
      title: `Média Diária Base`
    }
  },

  dimensions: {
    skGrupoVeiculo: {
      sql: `sk_grupo_veiculo`,
      type: `number`,
      primaryKey: true,
      shown: true
    },

    idGrupoSource: {
      sql: `id_grupo_source`,
      type: `number`,
      title: `ID Grupo (Origem)`
    },

    codigoGrupo: {
      sql: `codigo_grupo`,
      type: `string`,
      title: `Código do Grupo`
    },

    nomeGrupo: {
      sql: `nome_grupo`,
      type: `string`,
      title: `Nome do Grupo`
    },

    descricao: {
      sql: `descricao`,
      type: `string`,
      title: `Descrição`
    },

    capacidadePassageiros: {
      sql: `capacidade_passageiros`,
      type: `number`,
      title: `Capacidade de Passageiros`
    },

    capacidadeBagagem: {
      sql: `capacidade_bagagem`,
      type: `number`,
      title: `Capacidade de Bagagem`
    },

    isDeleted: {
      sql: `is_deleted`,
      type: `boolean`,
      title: `Excluído`
    }
  }
});
