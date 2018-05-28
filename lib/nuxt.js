'use strict';

const {
  Nuxt,
  Builder,
} = require('nuxt');

const path = require('path');

const assert = require('assert');

module.exports = class EggNuxt {

  init(app, config) {
    this.sites = new Map();
    const mconfig = config || app.config.nuxt;
    app.logger.info('nuxt init with config', mconfig);

    this.config = app.config.nuxt;
    this.app = app;

    const create = (config, app) => this.create(config, app);
    app.addSingleton('nuxt', create);
  }

  /**
   * 客户端一般多个，多个配置clients，一个配置client
   * create nuxt client
   * 1. load root_path/nuxt.config.js
   * 2. get new Nuxt instance
   * @example 配置参考
   * client = {
   *   root:'h5',  // 站点目录h5/site_a,h5/site_b 都可以
   *   path:'', 路由支持字符串与正则，由 koat-router 决定
   * }
   * h5比如移动端admin后台管理
   * clients = {
   *   h5:{
   *   },
   *   admin:{
   *   }
   * }
   * @example 读取client实例
   * 一个客户端
   * app.nuxt
   *
   * 多个客户端
   * app.nuxt.get('h5')
   * app.nuxt.get('admin')
   *
   * @param {object} config client设置 client = {} | clients = {}
   * @param {object} app 启动app实例
   * @return {Nuxt} nuxt实例
   */
  create(config, app) {
    const rootDir = path.join(process.cwd(), config.root);
    const config_filepath = path.join(rootDir, 'nuxt.config.js');

    app.logger.info('nuxt.create.config', config);

    const setting = require(config_filepath);
    setting.srcDir = rootDir;

    // setting.head.meta = setting.meta;
    const client = new Nuxt(setting);

    if (app.config.env === 'local') {
      app.beforeStart(async () => {
        const builder = new Builder(client);
        await builder.build();
      });
    }

    app.vhost.nuxt(client, config, this.middleware(client));

    return client;
  }

  /**
   * ctx 动态注册 router 拦截动态注册router中间返回渲染页面给客户端
   * 只需自定义符合的路由规则即可自动注册路由
   * 当前请求site
   * @param {app|ctx} match | ctx http请求get
   * @param {Function} routes 自定义匹配规则
   * @example
   * this.ready(ctx,ctx=>{
   *  ctx.url.indexOf('client prefix')==0
   * })
   * @todo 每个site还是需要配置各自的自定义中间件的
   * 注册绑定client site中间件,GET 拦截客户端请求，由客户端中间件处理，不走 koa-router
   */
  ready(match) {
    this.app.use(async ctx => {
      assert.equal(ctx.method, 'GET');

      if (ctx.method === 'GET') {
        return this.dispatch(ctx, match);
      }
    });
  }

  // 返回middleware给app
  middleware(client) {
    return async ctx => {
      if (ctx.method === 'GET') {
        return this.get_render_middleware(ctx, client);
      }
    };
  }

  /**
   * 获取对应的中间件
   * @description 注册路由到nuxt render中间件
   * @param {ctx} ctx 路径
   * @param {Function} match 自定义匹配处理
   * @return {promise} promise
   */
  dispatch(ctx, match) {
    let path;
    let current_site;
    let matched = false;

    const site = this.app.nuxt;

    const is_match = match || this.is_match;

    if (site instanceof Nuxt) {
      current_site = site;
      path = this.config.client.path;
      matched = is_match.call(this, ctx, path);
    } else {

      for (const [key, _site] of site) {
        matched = is_match.call(this, ctx, this.config.clients[key].path);
        if (matched) {
          current_site = _site;
          break;
        }
      }
    }

    this.app.logger.info('matched', matched);
    return matched && this.get_render_middleware(ctx, current_site);
  }

  /**
   * 匹配逻辑
   * @param {ctx} ctx 请求上下文
   * @param {string|reg|Function} path 匹配path配置
   * @return {boolean} true 匹配成功 false 不匹配
   */
  is_match(ctx, path) {
    this.app.logger.info('match ctx url host', ctx);
    const url = ctx.url;
    const host = ctx.host;

    this.app.logger.info('ctx.url', url);
    this.app.logger.info('ctx.host', host);
    this.app.logger.info('nuxt site path', path);
    // 字符串path处理match=='/h5'则/h5会匹配到
    if (typeof path === 'string') {
      if (path.indexOf('/') === 0) {
        return url.indexOf(path) === 0 && true;
      }

      return host.indexOf(path) === 0 && true;
    }

    // 正则处理 http https 可能需要这个处理
    // if (match instanceof RegExp && (match.test(ctx.protocol))) {
    //   return true;
    // }
    // function 自定义实现 返回 true 匹配  false 不匹配
    if (typeof path === 'function') {
      return path(ctx) && true;
    }

    return false;
  }

  /**
   * 创建nuxt render中间件
   * - wrap return egg middleware function
   * - use nuxt api:nuxt.render
   * @description nuxt render中间件将直接处理你 web 应用的页面渲染,不会再调用 next() 方法
   * @todo 如果render失败暂时记录日志，未做处理nuxt直接404了
   * @param {ctx} ctx nuxt实例
   * @param {site} site 站点
   * @return {middleware} nuxt渲染中间件
   */
  get_render_middleware(ctx, site) {
    return new Promise(() => {
      ctx.status = 200;
      site.render(ctx.req, ctx.res);
    });
  }

};