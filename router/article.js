const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const db = require('../db');

router.get('/api/article/list', async (ctx, next) => {
  let {
    userId
  } = ctx.state || {};
  let data = Utils.filter(ctx.request.query, ['studentId'])
  let {
    studentId
  } = data
  let sql = 'SELECT * FROM article WHERE isDelect=0 and userId=' + userId;
  if (studentId) {
    sql += ' and studentId=' + studentId
  }
  await db(sql).then(async res => {
    let data = res
    Utils.handleMessage(ctx, {
      ...Tips[1000],
      data
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.get('/api/article/page', async (ctx, next) => {
  let {
    userId
  } = ctx.state || {};
  let data = Utils.filter(ctx.request.query, ['pageSize', 'pageNum', 'articleName','catalogueId'])
  let {
    pageSize,
    pageNum=1,
    articleName,
    catalogueId
  } = data
  let sql = 'SELECT articleId,articleName,catalogueId,createTime,description,subjectId,updateTime FROM article WHERE isDelect=0 and userId=' + userId;
  let totalsql = 'SELECT count(*) from article where isDelect=0 and userId=' + userId;
  if (articleName) {
    sql += ` and articleName like '%${articleName}%'`
    totalsql += ` and articleName like '%${articleName}%'`
  }
  if (catalogueId) {
    sql += ` and catalogueId like '%${catalogueId}%'`
    totalsql += ` and catalogueId like '%${catalogueId}%'`
  }
  // sql += (pageNum - 1) * pageSize + ',' + pageSize
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

router.post('/api/article/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  let {
    userId
  } = ctx.state || {};
  let {
    articleName,
    articleId,
    subjectId,
    analysis,
    catalogueId,
    answer = '',
    description = ''
  } = data
  const sqlAdd = 'INSERT INTO article (articleName, articleId,subjectId,catalogueId,analysis,answer,description, createTime, updateTime,isDelect,userId) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
  const sqlData = [articleName, articleId, subjectId, catalogueId,analysis, answer, description, now, now, 0, userId];
  await db(sqlAdd, sqlData).then(() => {
    Utils.handleMessage(ctx, Tips[1001])
  }).catch((e) => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})  

router.get('/api/article/:id', async (ctx, next) => {
  let {userId} = ctx.state || {};
  let id = ctx.request.url.replace('/api/article/', '')
  let sql = `SELECT * FROM article WHERE isDelect=0 and userId=${userId} and articleId=${id}`;
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000],
      data: res[0]||{}
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/article/update/:id', async (ctx, next) => {
  let sql = Utils.getUpdateSql(ctx.request, 'article', 'articleId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/article/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/article/delect/', '')
  const SQL = 'UPDATE article SET isDelect=1 WHERE articleId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})


module.exports = router; 