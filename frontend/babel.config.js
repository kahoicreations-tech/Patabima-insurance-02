module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-flow'
    ],
    plugins: [
      '@babel/plugin-syntax-flow',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@screens': './screens',
            '@components': './components',
            '@contexts': './contexts',
            '@services': './services',
            '@constants': './constants',
            '@theme': './theme',
            '@utils': './utils',
            '@shared': './shared'
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        }
      ]
    ]
  };
};