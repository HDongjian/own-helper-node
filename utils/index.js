const Tips = require('./tip')
const IS = require('is')
const php_date = require('locutus/php/datetime/date')
const strtotime = require('locutus/php/datetime/strtotime')
const fs = require('fs')
const path = require('path')
const jwt = require('jsonwebtoken')
const _ = require('lodash')
const nodeExcel = require('excel-export')

let util = {
  //formatData 必须为 {key,type}的格式,可以不传type
  formatData(params, valids) {
    let res = true
    if (!IS.object(params)) return false
    if (!IS.array(valids)) return false
    for (let i = 0; i < valids.length; i++) {
      let e = valids[i]
      let {
        key,
        type
      } = e
      if (!key) {
        res = false
        break
      }
      let value = params[key] || ''
      if (type === 'not_empty') {
        if (IS.empty(value)) {
          res = false
          break
        }
      } else if (type === 'number') {
        value = Number(value)
        if (!IS.number(value) || IS.nan(value)) {
          res = false
          break
        }
      } else if (type === 'reg') {
        let reg = e['reg']
        if (!reg || !reg.test(value)) {
          res = false
          break
        }
      } else {
        if (!IS[type](value)) {
          res = false
          break
        }
      }
    }
    return res
  },
  filter(params, filterArr) {
    if (IS.object(params) && IS.array(filterArr)) {
      let data = {}
      filterArr.forEach((e) => {
        let val = params[e]
        if (
          (!IS.undefined(val) && !IS.null(val) && !IS.empty(val)) ||
          IS.array.empty(val)
        ) {
          data[e] = val
        }
      })
      return data
    } else {
      return params
    }
  },
  queryData(params, queryArr) {
    //仅适用于列
    let data = {}
    if (this.type(params) == 'object' && this.type(queryArr) == 'array') {
      queryArr.forEach((e) => {
        let val = params[e]
        if (!!val || val == 0) {
          data[e] = params[e]
        }
      })
    }
    return data
  },
  //创建当前时间
  formatCurrentTime(create_time) {
    let time = create_time ? strtotime(create_time) * 1000 : Date.now()
    return php_date('Y-m-d H:i:s', time / 1000)
  },
  myMoment(date = new Date().getTime()) {
    this.date = new Date(date)
    return this
  },
  formate(formatStr = 'YYYY-MM-DD HH:mm:ss') {
    const date = this.date
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const week = date.getDay()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()
    const weeks = ['日', '一', '二', '三', '四', '五', '六']
    return formatStr.replace(
      /Y{2,4}|M{1,2}|D{1,2}|d{1,4}|H{1,2}|m{1,2}|s{1,2}/g,
      (match) => {
        switch (match) {
          case 'YY':
            return String(year).slice(-2)
          case 'YYY':
          case 'YYYY':
            return String(year)
          case 'M':
            return String(month)
          case 'MM':
            return String(month).padStart(2, '0')
          case 'D':
            return String(day)
          case 'DD':
            return String(day).padStart(2, '0')
          case 'd':
            return String(week)
          case 'dd':
            return weeks[week]
          case 'ddd':
            return '周' + weeks[week]
          case 'dddd':
            return '星期' + weeks[week]
          case 'H':
            return String(hour)
          case 'HH':
            return String(hour).padStart(2, '0')
          case 'm':
            return String(minute)
          case 'mm':
            return String(minute).padStart(2, '0')
          case 's':
            return String(second)
          case 'ss':
            return String(second).padStart(2, '0')
          default:
            return match
        }
      }
    )
  },
  checkLogin(ctx) {
    let uid = ctx.cookies.get('uid')
    if (!uid) {
      return Tips[1005]
    } else {
      return Tips[0]
    }
  },
  generateToken(data) {
    let created = Math.floor(Date.now() / 1000)
    let cert = fs.readFileSync(path.join(__dirname, '../pem/pri.pem'))
    let token = jwt.sign({
        data,
        exp: created + 3600 * 24,
      },
      cert, {
        algorithm: 'RS256'
      }
    )
    return token
  },
  verifyToken(token) {
    let cert = fs.readFileSync(path.join(__dirname, '../pem/pub.pem')),
      res = {}
    try {
      let result = jwt.verify(token, cert, {
        algorithms: ['RS256']
      }) || {}
      let {
        exp = 0
      } = result,
      current = Math.floor(Date.now() / 1000)
      if (current <= exp) {
        res = result.data || {}
      }
    } catch (e) {}
    return res
  },
  handleMessage1(response, data, error) {
    response.end(JSON.stringify(data))
    if (error) {
      console.log(error)
    }
  },
  handleMessage(ctx, data, error) {
    ctx.body = data
    if (error) {
      console.log(error)
    }
  },
  getUpdateSql(request, tableName, index) {
    const data = request.body
    let id = data.id ? data.id : request.url.replace(/\/api\/.*\/.*\//, '')
    data.updateTime = this.formatCurrentTime()
    let sql = 'UPDATE ' + tableName + ' SET '
    _.forEach(data, (val, key) => {
      val = JSON.stringify(val)
      if (key !== index && key !== 'id') {
        sql = sql + key + '=' + val + ','
      }
    })
    sql = sql.substring(0, sql.length - 1)
    sql = sql + ' WHERE ' + index + ' = ' + id
    return sql
  },
  getParams(ctx) {
    let url = ctx.request.url,
      params = {}
    if (url.indexOf('?') >= 0) {
      let paramUrl = url.replace(/.*\?/, '')
      for (const param of paramUrl.split('&')) {
        ;
        /(.*)(=)(.*)/.test(param)
        params[RegExp.$1] = RegExp.$3
      }
    }

    return params
  },
  mkdirs(dirname, callback) {
    let self = this
    fs.exists(dirname, function (exists) {
      if (exists) {
        callback && callback()
      } else {
        self.mkdirs(path.dirname(dirname), function () {
          fs.mkdir(dirname, callback)
        })
      }
    })
  },
  getMinutes(start, end) {
    let sec = new Date(end).getTime() - new Date(start).getTime()
    return sec / 1000 / 60
  },
  async exportdata(config, ctx, name) {
    let result = nodeExcel.execute(config)
    if (Buffer.from && Buffer.from !== Uint8Array.from) {
      data = Buffer.from(result, 'binary')
    } else {
      data = new Buffer(result, 'binary')
    }
    ctx.set('Content-Type', 'application/vnd.openxmlformats')
    ctx.set(
      'Content-Disposition',
      'attachment; filename=' + (name || 'total') + '.xlsx'
    )
    ctx.body = data
  },
  async getAllCompany(userId, db, isMap) {
    let sql = `SELECT * FROM company WHERE isDelect=0 and userId= ${userId}`

    return db(sql).then((res) => {
      if (isMap) {
        let result = {}
        for (const item of res) {
          result[item.companyId] = item.companyName
        }
        return result
      } else {
        return res
      }
    }).catch((e) => {
      return isMap ? {} : []
    })
  },
  async getAllSubject(userId, db, isMap) {
    let sql = `SELECT * FROM subject WHERE isDelect=0`

    return db(sql).then((res) => {
      if (isMap) {
        let result = {}
        for (const item of res) {
          result[item.subjectId] = item.subjectName
        }
        return result
      } else {
        return res
      }
    }).catch((e) => {
      console.log(e)
      return isMap ? {} : []
    })
  },
  async getSurplusCount(db, studentId) {
    let orderSql = `SELECT * FROM orders WHERE isDelect=0 and studentId=${studentId}`
    let course = await this.getCourser(db, studentId);
    let courseHour = this.countCouseTotal(course)
    return db(orderSql).then(res => {
      let orderHour = 0
      for (const item of res) {
        let hh = item.classMinute * item.classCount / 60
        orderHour += Number(hh)
      }
      return {
        orderHour,
        courseHour,
        surplusHour: orderHour - courseHour>0?orderHour - courseHour:0
      }
    })
  },
  async getCourser(db, studentId, orderId) {
    let courserSql = `SELECT * FROM course WHERE isDelect=0${(studentId||orderId)?' and':''}${studentId?` studentId=${studentId}`:''}${orderId?` orderId=${orderId}`:''}`
    return db(courserSql).then(res => {
      return res
    })
  },
  countCouseTotal(course){
    let courseHour = 0
    for (const item of course) {
      let second = new Date(item.endTime).getTime() - new Date(item.startTime).getTime()
      courseHour += (second / 1000 / 60 / 60)
    }
    return courseHour
  }
}

module.exports = util