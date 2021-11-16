
process.env.NODE_ENV = 'development'
const app =  require('../app.js');
let config = require('../config')

app(config)


