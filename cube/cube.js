// Cube.js configuration file
module.exports = {
  // Orchestration options
  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 30,
    },
  },
  // Pre-aggregations schema
  preAggregationsSchema: ({ securityContext }) =>
    `pre_aggregations_${securityContext && securityContext.tenantId ? securityContext.tenantId : 'main'}`,
};
