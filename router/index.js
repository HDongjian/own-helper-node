const user = require('./user');
const menu = require('./menu');
const role = require('./role');
const subject = require('./subject');
const uploader = require('./uploader');
const catalogue = require('./catalogue');
const article = require('./article');
module.exports = function (app) {
  app.use(user.routes()).use(user.allowedMethods());
  app.use(menu.routes()).use(menu.allowedMethods());
  app.use(role.routes()).use(role.allowedMethods());
  app.use(subject.routes()).use(subject.allowedMethods());
  app.use(uploader.routes()).use(uploader.allowedMethods());
  app.use(catalogue.routes()).use(catalogue.allowedMethods());
  app.use(article.routes()).use(article.allowedMethods());
}