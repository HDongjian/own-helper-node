const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/menu/list', async (ctx, next) => {
  let sql = 'SELECT * FROM menu WHERE isDelect=0 order by orderNo asc';
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000], data: res
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/menu/add', async (ctx, next) => {
  let data = ctx.request.body
  let now = Utils.formatCurrentTime()
  const sql = 'SELECT * FROM menu WHERE menuName=' + JSON.stringify(data.menuName);
  const sqlAdd = 'INSERT INTO menu (menuName, menuIcon, parentId, path, orderNo, description, createTime, updateTime,isDelect) VALUES (?,?,?,?,?,?,?,?,?)';
  const sqlData = [data.menuName, data.menuIcon || '', data.parentId, data.path, data.orderNo, data.description, now, now, 0];
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

router.post('/api/menu/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'menu', 'menuId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/menu/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/menu/delect/', '')
  let sql_ = 'SELECT * FROM menu WHERE isDelect=0 and parentId=' + id
  let sql__ = "SELECT * FROM role WHERE isDelect=0 and INSTR(menuIds,'" + id + "')>0"
  let result = await db(sql_).then(res => { return res })
  let result_ = await db(sql__).then(res => { return res })
  if (result.length > 0) {
    return Utils.handleMessage(ctx, Tips[2003])
  }
  if (result_.length > 0) {
    return Utils.handleMessage(ctx, {
      code: 300,
      message: `该菜单与${result_[0].roleName}角色有绑定，不能删除`
    })
  }
  const SQL = 'UPDATE menu SET isDelect=1 WHERE menuId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

module.exports = router;