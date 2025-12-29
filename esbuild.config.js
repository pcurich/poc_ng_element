/**
 * 🎯 ESBuild Configuration for Single Bundle Output
 * 
 * This configuration ensures that the output is a single, self-contained file
 * without code splitting or external imports.
 */

module.exports = {
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  format: 'iife',
  globalName: 'HttpMockManager',
  splitting: false,
  chunkNames: undefined,
  footer: {
    js: '/* End of http-mock-manager bundle */'
  },
  banner: {
    js: `/**
 * 🌐 HTTP Mock Manager - Self-Contained Custom Element
 * Version: 1.0.0
 * Built with: Angular 20 + Signals + Zoneless
 * No external dependencies required!
 */`
  }
};
