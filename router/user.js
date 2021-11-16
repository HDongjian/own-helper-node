const router = require('koa-router')();
const Utils = require('../utils');
const Tips = require('../utils/tip');
const md5 = require('md5');
const db = require('../db');

router.post('/api/login', async (ctx, next) => {
  let data = Utils.filter(ctx.request.body, ['userName', 'password']);
  let res = Utils.formatData(data, [
    { key: 'userName', type: 'string' },
    { key: 'password', type: 'string' }
  ]);
  if (!res) return ctx.body = Utils.handleMessage(ctx, Tips[2002])
  let { userName, password } = data;
  let sql = 'SELECT userName,roleId,avatar,name,mobile,email,gender,userId FROM user WHERE userName=? and password=? and isDelect=0', userValue = [userName, password];
  let studentSql = 'SELECT studentName,studentId,roleId,subjectIds,companyId,targetScore,currentScore,gradeList,description,userId FROM student WHERE studentName=? and password=? and isDelect=0', studentValue = [userName, password];
  let user = await db(sql,userValue).then(res => { return res }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
  let result = []
  if (user.length == 0) {
    result = await db(studentSql,studentValue).then(res => { return res }).catch(e => {
      Utils.handleMessage(ctx, Tips[2000], e)
    });
  }else{
    result = user
  }
  if (result && result.length > 0) {
  let val = result[0];
  // let userId = val['userId']
  let tokenInfo = { userId:val['userId'],studentId:val['studentId'] }
  console.log(tokenInfo)
  let token = Utils.generateToken(tokenInfo);
  Utils.handleMessage(ctx, {
    ...Tips[1004], data: { token, ...val }
  })
  } else {
    Utils.handleMessage(ctx, Tips[1100])
  }
});

router.get('/api/menus', async (ctx, next) => {
  let { userId,studentId } = ctx.state || {};
  let sqlRole = studentId?'SELECT roleId FROM student WHERE studentId=' + studentId:'SELECT roleId FROM user WHERE userId=' + userId
  let roleRes = await db(sqlRole).then(res => { return res })
  if (roleRes.length > 0) {
    let roleId = roleRes[0].roleId
    let sqlMenu = 'SELECT menuIds FROM role WHERE roleId=' + roleId
    let menuRes = await db(sqlMenu).then(res => { return res })
    if (menuRes.length > 0) {
      let menuIds = menuRes[0].menuIds
      let sql = 'select * from menu where menuId in (' + menuIds + ') order by orderNo asc'
      await db(sql).then(res => {
        Utils.handleMessage(ctx, {
          ...Tips[1000], data: res
        })
      }).catch(e => {
        Utils.handleMessage(ctx, Tips[2000], e)
      })
    } else {
      Utils.handleMessage(ctx, Tips[2005])
    }
  } else {
    Utils.handleMessage(ctx, Tips[2005])
  }
});
//退出登录
router.post('/api/layout', async (ctx, next) => {
  ctx.state = null;
  Utils.handleMessage(ctx, Tips[1005]);
})


router.get('/api/user/list', async (ctx, next) => {
  let sql = 'SELECT userName,roleId,name,avatar,mobile,email,gender,createTime,userId FROM user where isDelect=0 order by updateTime desc';
  await db(sql).then(res => {
    Utils.handleMessage(ctx, {
      ...Tips[1000], data: res
    })
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  });
})

router.post('/api/user/add', async (ctx, next) => {
  const data = ctx.request.body;
  let now = Utils.formatCurrentTime()
  const sql = 'SELECT * FROM user WHERE isDelect=0 and userName=' + JSON.stringify(data.userName);
  const sqlAdd = 'INSERT INTO user (userName, roleId,password,name,mobile,email,gender, avatar, createTime, updateTime,isDelect) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
  const sqlData = [data.userName, data.roleId, md5(data.password), data.name, data.mobile, data.email, data.gender, data.avatar, now, now, 0];
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

router.post('/api/user/update/:id', async (ctx, next) => {
  let data = Utils.filter(ctx.request.body, ['name', 'userName', 'roleId', 'avatar', 'mobile', 'email', 'userName', 'gender'])
  let sql = Utils.getUpdateSql({ body: data, url: ctx.request.url }, 'user', 'userId')
  await db(sql).then(results => {
    Utils.handleMessage(ctx, Tips[1003])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/user/delect/:id', async (ctx, next) => {
  let id = ctx.request.url.replace('/api/user/delect/', '')
  const SQL = 'UPDATE user SET isDelect=1 WHERE userId=' + id
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

router.post('/api/user/password/:id', async (ctx, next) => {
  const SQL = Utils.getUpdateSql(ctx.request, 'user', 'userId')
  await db(SQL).then(results => {
    Utils.handleMessage(ctx, Tips[1002])
  }).catch(e => {
    Utils.handleMessage(ctx, Tips[2000], e)
  })
})

module.exports = router;