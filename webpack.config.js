/**
 * 🎯 webpack.config.js - Configuración personalizada para custom elements
 * 
 * Esta configuración asegura que todas las dependencias de Angular
 * se incluyan en el bundle final para crear un custom element autocontenido.
 */

const path = require('path');

module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js'],
    modules: ['node_modules'],
    alias: {
      '@angular/core': path.resolve(__dirname, 'node_modules/@angular/core'),
      '@angular/common': path.resolve(__dirname, 'node_modules/@angular/common'),
      '@angular/platform-browser': path.resolve(__dirname, 'node_modules/@angular/platform-browser'),
      '@angular/forms': path.resolve(__dirname, 'node_modules/@angular/forms'),
      '@angular/elements': path.resolve(__dirname, 'node_modules/@angular/elements'),
      'rxjs': path.resolve(__dirname, 'node_modules/rxjs'),
      'tslib': path.resolve(__dirname, 'node_modules/tslib')
    }
  },
  optimization: {
    minimize: true,
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  externals: {
    // No external dependencies - everything should be bundled
  },
  output: {
    library: 'HttpMockManagerElement',
    libraryTarget: 'umd',
    globalObject: 'this'
  }
};