const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/order/list', async (ctx, next) => {
  let {
    userId
  } = ctx.state || {};
  let data = Utils.filter(ctx.request.query, ['studentId', 'orderType'])
  let {
    studentId,
    orderType
  } = data
  let sql = 'SELECT * FROM orders WHERE isDelect=0 and userId=' + userId;
  if (orderType) {
    sql += ' and orderType=' + orderType
  }
  if (studentId) {
    sql += ' and studentId=' + studentId
  }
  await db(sql).then(async res => {
    let data = []
    for (const item of res) {
      let course = await Utils.getCourser(db, '', item.orderId)
      let courseTotal = Utils.countCouseTotal(course)
      let hh = item.classMinute * item.classCount / 60
      data.push({
        surplusHour: hh - courseTotal,
        ...item
      })
    }
    Utils.handleMessage(ctx, {
      ...Tips[1000],
      data
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.get('/api/order/page', async (ctx, next) => {
  let {
    userId
  } = ctx.state || {};
  let data = Utils.filter(ctx.request.query, ['pageSize', 'studentName', 'pageNum', 'studentId', 'orderStartDate', 'orderStartDate', 'orderEndDate', 'orderType', 'orderType'])
  let {
    studentId,
    pageSize,
    pageNum,
    orderStartDate,
    orderEndDate,
    studentName,
    orderType,
    orderNumber
  } = data
  let sql = 'SELECT * FROM orders WHERE isDelect=0 and userId=' + userId;
  let totalsql = 'SELECT count(*) from orders where isDelect=0 and userId=' + userId;
  // if (studentName) {
  //   sql += ` and studentName like '%${studentName}%'`
  //   totalsql += ` and studentName like '%${studentName}%'`
  // }
  if (studentId) {
    sql += ' and studentId=' + studentId
    totalsql += ' and studentId=' + studentId
  }
  if (orderType) {
    sql += ' and orderType=' + orderType
    totalsql += ' and orderType=' + orderType
  }
  if (studentId) {
    sql += ' and studentId=' + studentId
    totalsql += ' and studentId=' + studentId
  }
  if (orderNumber) {
    sql += ' and orderNumber=' + orderNumber
    totalsql += ' and orderNumber=' + orderNumber
  }
  if (orderStartDate) {
    sql += " and order.orderDate>='" + orderStartDate + "'"
  }
  if (orderEndDate) {
    sql += " and order.orderDate<='" + orderEndDate + "'"
  }
  sql += ' order by orderDate desc limit ' + (pageNum - 1) * pageSize + ',' + pageSize
  let total = await db(totalsql).then(res => {
    return res
  })
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000],
      data: {
        data: res,
        total: total[0] ? total[0]['count(*)'] : 0,
        pageNum: Number(pageNum),
        pageSize: Number(pageSize)
      }
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/order/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  let {
    userId
  } = ctx.state || {};
  let {
    studentId,
    classCount,
    classMinute = 60,
    orderDate,
    orderAmount,
    orderNumber = '',
    orderType,
    description = ''
  } = data
  // const sql = 'SELECT * FROM orders WHERE isDelect=0 and studentId=' + JSON.stringify(data.studentId);
  const sqlAdd = 'INSERT INTO orders (studentId, classCount,classMinute,orderDate,orderAmount,orderNumber,orderType,description, createTime, updateTime,isDelect,userId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
  const sqlData = [studentId, classCount, classMinute, orderDate, orderAmount, orderNumber, orderType, description, now, now, 0, userId];
  console.log(sqlData)
  // let result = await db(sql).then(res => { return res })
  await db(sqlAdd, sqlData).then(() => {
    Utils.handleMessage(ctx, Tips[1001])
  }).catch((e) => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})  

router.post('/api/order/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'orders', 'orderId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/order/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/order/delect/', '')
  const SQL = 'UPDATE orders SET isDelect=1 WHERE orderId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})


module.exports = router; 