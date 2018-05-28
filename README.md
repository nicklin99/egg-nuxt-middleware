# egg-nuxt-middleware

需要结合 egg-vhost一起使用,提供路由中间件注册与拦截请求

### 设置

config.default.js

一个客户端

```javascript
exports.nuxt = {
    client: {
      root: 'ui/elementui', // nuxt 根目录
      path: '/chat',        // url path
    },
  };
```

多个客户端
```javascript
exports.nuxt = {
    clients:{
      test:{
        root: 'ui/elementui', // nuxt 根目录
        path: '/test',        // url path
      },
    } 
  };
```