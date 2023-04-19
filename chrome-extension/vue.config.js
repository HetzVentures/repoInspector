const path = require('path');
const fs = require('fs');

// Generate pages object
const pages = {};

function getEntryFile(entryPath) {
  const files = fs.readdirSync(entryPath);
  return files;
}

const chromeName = getEntryFile(path.resolve(`src/entry`));

function getFileExtension(filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
}
chromeName.forEach((name) => {
  const fileExtension = getFileExtension(name);
  const fileName = name.replace(`.${fileExtension}`, '');
  pages[fileName] = {
    entry: `src/entry/${name}`,
    template: 'public/index.html',
    filename: `${fileName}.html`,
  };
});

const isDevMode = process.env.NODE_ENV === 'development';

const config = {
  pages,
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugin('copy').use(require('copy-webpack-plugin'), [
      {
        patterns: [
          {
            from: path.resolve(`src/manifest.${process.env.NODE_ENV}.json`),
            to: `${path.resolve('dist')}/manifest.json`,
          },
          {
            from: path.resolve(`public/`),
            to: `${path.resolve('dist')}/`,
          },
        ],
      },
    ]);

    config.module.rule('ts');
    config.module.rule('ts').use('ts-loader');
    config.module.rule('ts').use('cache-loader');
  },
  configureWebpack: {
    output: {
      filename: `[name].js`,
      chunkFilename: `[name].js`,
    },
    devtool: isDevMode ? 'inline-source-map' : false,
  },
  css: {
    extract: false, // Make sure the css is the same
  },
};

module.exports = config;
