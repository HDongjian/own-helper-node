const mysql = require('mysql');
const config = require('../config')

let pool = mysql.createPool(config);
let db = (sql, values) => {
  values = (values) ? values:{}
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err)
      } else {
        connection.query(sql, values, (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
          // connection.end()
        })
      }
      pool.releaseConnection(connection);
    })
  })
};
module.exports = db