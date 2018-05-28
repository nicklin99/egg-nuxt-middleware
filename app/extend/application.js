'use strict';

const NUXT = Symbol('Application#nuxts');

const EggNuxt = require('./../../lib/nuxt');

module.exports = {

  get nuxts() {
    if (!this[NUXT]) {
      this[NUXT] = new EggNuxt();
    }
    return this[NUXT];
  }
}