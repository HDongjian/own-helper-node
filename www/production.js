process.env.NODE_ENV = 'production'

const app =  require('../app.js');
let config = require('../config')

app(config)