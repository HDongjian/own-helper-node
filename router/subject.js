const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/subject/list', async (ctx, next) => {
  let sql = 'SELECT * FROM subject WHERE isDelect=0 order by updateTime desc';
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000], data: res
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/subject/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  const sql = 'SELECT * FROM subject WHERE subjectName=' + JSON.stringify(data.subjectName);
  const sqlAdd = 'INSERT INTO subject (subjectName, description, createTime, updateTime,isDelect) VALUES (?,?,?,?,?)';
  const sqlData = [data.subjectName, data.description, now, now, 0];
  let result = await db(sql).then(res => { return res })
  if (result.length == 0) {
    await db(sqlAdd, sqlData).then(() => {
      Utils.handleMessage(ctx, Tips[1001])
    }).catch((e) => {
      Utils.handleMessage(ctx, Tips[2000], e)
    });
  } else {
    Utils.handleMessage(ctx, Tips[2001])
  }
})

router.post('/api/subject/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'subject', 'subjectId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/subject/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/subject/delect/', '')
  const SQL = 'UPDATE subject SET isDelect=1 WHERE subjectId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

module.exports = router;