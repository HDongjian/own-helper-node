const config = {
  production: {
    host: '47.104.69.49',
    user: 'root',
    password: 'lvchongyu521',
    database: 'helper',
    multipleStatements: true//允许多条sql同时执行
  },
  development: {
    host: '192.168.110.129',
    user: 'root',
    password: 'haodongjian123',
    database: 'classes',
    multipleStatements: true//允许多条sql同时执行
  }
}

module.exports = config[process.env.NODE_ENV || 'production'];