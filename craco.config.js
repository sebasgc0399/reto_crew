// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 1) Excluir react-datepicker del source-map-loader
      if (webpackConfig.module && Array.isArray(webpackConfig.module.rules)) {
        webpackConfig.module.rules.forEach(rule => {
          if (
            rule.enforce === 'pre' &&
            Array.isArray(rule.use) &&
            rule.use.some(u => u.loader && u.loader.includes('source-map-loader'))
          ) {
            rule.exclude = [/node_modules[\\/]react-datepicker/];
          }
        });
      }

      // 2) Ignorar warnings concretos de react-datepicker
      //    (webpack 5 permite esta opción)
      webpackConfig.ignoreWarnings = [
        {
          module: /react-datepicker/,
          message: /Failed to parse source map/i
        }
      ];

      return webpackConfig;
    }
  }
};
