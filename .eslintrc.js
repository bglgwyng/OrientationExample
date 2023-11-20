module.exports = {
  root: true,
  extends: 'gwyng',
  ignorePatterns: ['metro.config.js'],
  rules: {
    'react-hooks/exhaustive-deps': [
      'warn',
      {additionalHooks: '(useFrameProcessor|useRunInJsCallback)'},
    ],
  },
};
