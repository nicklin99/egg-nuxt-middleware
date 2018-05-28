'use strict';

module.exports = app => {

  if (app.config.nuxt) {
    app.nuxts.init(app);
  }
};