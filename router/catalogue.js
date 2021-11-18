const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/catalogue/list', async (ctx, next) => {
  let sql = 'SELECT * FROM catalogue WHERE isDelect=0 order by updateTime desc';
  await db(sql).then(async res => {
    let data = []
    for (const item of res) {
      let sql2 =  `SELECT * FROM article WHERE isDelect=0 and catalogueId = ${item.catalogueId}`
      let result2 = await db(sql2).then(res => { return res })
      data.push({...item,articleCount:result2?result2.length:0})
    }
    Utils.handleMessage(ctx, {
      ...Tips[1000], data
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/catalogue/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  const sql = 'SELECT * FROM catalogue WHERE catalogueName=' + JSON.stringify(data.catalogueName);
  const sqlAdd = 'INSERT INTO catalogue (catalogueParentId,catalogueName, createTime, updateTime,isDelect) VALUES (?,?,?,?,?)';
  const sqlData = [data.catalogueParentId||'0',data.catalogueName, now, now, 0];
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

router.post('/api/catalogue/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'catalogue', 'catalogueId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/catalogue/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/catalogue/delect/', '')
  let sql1 =  `SELECT * FROM catalogue WHERE isDelect=0  and catalogueParentId = ${id}`
  let result = await db(sql1).then(res => { return res })
  if(result.length>0){
    Utils.handleMessage(ctx, Tips[2003])
    return
  }
  let sql2 =  `SELECT * FROM article WHERE isDelect=0 and catalogueId = ${id}`
  let result2 = await db(sql2).then(res => { return res })
  if(result2.length>0){
    Utils.handleMessage(ctx, Tips[2004])
    return
  }
  const SQL = 'UPDATE catalogue SET isDelect=1 WHERE catalogueId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

module.exports = router;