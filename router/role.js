const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/role/list', async (ctx, next) => {
  let sql = 'SELECT * FROM role WHERE isDelect=0 order by updateTime desc';
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000], data: res
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/role/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  const sql = 'SELECT * FROM role WHERE roleName=' + JSON.stringify(data.roleName);
  const sqlAdd = 'INSERT INTO role (roleName, menuIds, description, createTime, updateTime,isDelect) VALUES (?,?,?,?,?,?)';
  const sqlData = [data.roleName, data.menuIds, data.description, now, now, 0];
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

router.post('/api/role/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'role', 'roleId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/role/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/role/delect/', '')
  let sql_ = 'SELECT * FROM user WHERE isDelect=0 and roleId=' + id
  let result = await db(sql_).then(res => { return res })
  if (result.length <= 0) {
    const SQL = 'UPDATE role SET isDelect=1 WHERE roleId=' + id
    await db(SQL).then(results => {
      Utils.handleMessage(ctx, Tips[1002])
    }).catch(e => {
      Utils.handleMessage(ctx, Tips[2000], e)
    })
  } else {
    Utils.handleMessage(ctx, Tips[2004])
  }

})

module.exports = router;