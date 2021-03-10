/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
const minify = require('minify-stream');
const { mkdirpSync } = require('fs-extra');
const browserify = require('browserify');
const babelify = require('babelify');
const fs = require('fs');
const exorcist = require('exorcist');
const mold = require('mold-source-map');

mkdirpSync('dist');

const browserifyOptions = {
  browserField: 'browserify-browser',
  // entries: [],
  debug: true, // gen inline sourcemap to extract with exorcist
  // standalone: 'Conflux', // generate a umd file to load directly into browser
};

// use babel to remove unused lodash code
// https://www.blazemeter.com/blog/the-correct-way-to-import-lodash-libraries-a-benchmark/
const babelTransform = babelify.configure({
  presets: ['@babel/preset-env'],
  plugins: [
    'lodash',
    [
      '@babel/plugin-transform-runtime',
      {
        regenerator: true,
      },
    ],
  ],
});

const items = [{
  entry: './src/MetaSignProvider.js',
  output_file: 'MetaSignProvider',
  standalone: 'MetaSignProvider'
}, {
  entry: './src/wrapEthereumRequest.js',
  output_file: 'wrapEthereumRequest',
  standalone: 'wrapEthereumRequest'
}];

// generate bundle
for (let item of items) {
  let opts = Object.assign({}, {
    entries: [item.entry],
    standalone: item.standalone
  }, browserifyOptions);
  browserify(opts)
    .transform(babelTransform)
    .bundle()
    .pipe(minify())
    .pipe(mold.transformSourcesRelativeTo(path.resolve(__dirname, './')))
    .pipe(exorcist(`./dist/${item.output_file}.min.js.map`))
    .pipe(fs.createWriteStream(`./dist/${item.output_file}.min.js`));
}


