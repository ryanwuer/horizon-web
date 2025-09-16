/**
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 */
export default {
  dev: {
    '/apis/': {
      // target: 'http://localhost:8080',
      // target: 'http://horizon.yf-dev2.netease.com',
      // target: 'https://horizon.netease.com',
      // target: 'http://horizon.yf-dev-gy1.netease.com',
      target: 'http://horizon.yf-online-gy3.service.gy.ntes',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
