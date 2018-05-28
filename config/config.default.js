'use strict';

const path = require('path');

module.exports = appInfo => {
  return {
    root: path.join(appInfo.baseDir), // 客户端根目录,需要和 node_modules保持一个目录
  }
}