# webpack-post-bundle

For use in webpack builds that need commands to be run after each bundle.
Each command will be run in a child window, so it will not interrupt the foreground process.

## Getting Started

### Install with npm
```bash
npm install --save-dev webpack-post-bundle
```

### Require the module in the webpack config
```js
require('webpack-post-bundle');
```
### Add the plugin to the plugins array in the config

```js
webpackConfig.plugins = [
  new WebpackPostBundleCommands([
    'grunt karma:unit:run',
    'npm run eslint'
  ])
];
```
