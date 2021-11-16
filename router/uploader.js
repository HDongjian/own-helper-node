const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const formidable = require('koa-formidable');
const fs = require('fs');

router.post('/api/files', async (ctx, next) => {
  let form = formidable.parse(ctx.request);
  let uploadDir = 'static/';
  form.encoding = 'utf-8';
  form.keepExtensions = true;
  Utils.mkdirs('../' + uploadDir);
  let imgPlay = new Promise((resolve, reject) => {
    form((opt, { fields, files }) => {
      let articleId = fields.articleId;
      let filename = files.file.name;
      let avatarName = Date.now() + '_' + filename;
      let readStream = fs.createReadStream(files.file.path)
      let writeStream = fs.createWriteStream('../' + uploadDir + avatarName);
      readStream.pipe(writeStream);
      resolve(uploadDir + avatarName)
    })
  });
  let url = await imgPlay
  Utils.handleMessage(ctx, {
    ...Tips[1000], data: url
  })
})

module.exports = router;