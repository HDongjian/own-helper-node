const http = require('http')
const koa = require('koa')
const etag = require('koa-etag')
const bodyParser = require('koa-bodyparser')
const errorHandler = require('koa-error')
const compress = require('koa-compress')
const koaBody = require('koa-body')
const serve = require('koa-static')
const app = new koa()
const Utils = require('./utils')
const router = require('./router')
const Tips = require('./utils/tip')
const log = global.console.log.bind(console)

const fnApp = function (config) {
  const PORT = config.port || 3008
  app.use(
    koaBody()
  )
  app.use(serve(__dirname)) // 设置静态文件
  app.use(async (ctx, next) => {
    let { url = '' } = ctx
    console.log(url)
    if (url.indexOf('/login') >= 0) {
      return await next()
    }
    let header = ctx.request.header
    let query = Utils.filter(ctx.request.query, ['token'])
    let token = header.token || query.token
    if (token) {
      let result = Utils.verifyToken(token)
      let { userId, studentId } = result
      if (userId || studentId) {
        ctx.state = result
        await next()
      } else {
        return Utils.handleMessage(ctx, Tips[3001])
      }
    } else {
      return Utils.handleMessage(ctx, Tips[3001])
    }
  })
  app.use(errorHandler())
  app.use(bodyParser())

  app.use(etag())

  app.use(
    compress({
      filter: (contentType) => /text|javascript/i.test(contentType),
      threshold: 2048,
    })
  )
  router(app)
  http.createServer(app.callback()).listen(PORT)

  log('server is running on port: %s', PORT)
}

module.exports = fnApp
