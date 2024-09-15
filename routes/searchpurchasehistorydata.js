const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cors = require('cors');
const config = require('./config');

const database = mysql.createConnection({
  host: config.database_host,
  port: config.database_port,
  user: config.database_user,
  password: config.database_password,
  database: config.database_database
});

database.connect((err) => {
  if (err) throw err;
  console.log("API search purchase history data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    const { username, password, keyword } = req.body;
    try {
        axios.post(config.server_url + '/API/authenticationpermission', {
          username: username,
          password: password
      }, {
          headers: {
            'Content-Type': 'application/json'
          }
      })
        .then(async responseUser => {
          if (responseUser.status) {
            const success = await GetPurchaseHistoryData(responseUser.data.userid, keyword);
            res.status(200).json({ status: true, data: success });
          }
          else {
            res.status(200).json({ status: false, message: "Bạn không có quyền truy cập vào dử liệu này" });
          }
      })
      .catch(e => {
        console.error(e);
        res.status(200).json({ status: false, message: e.toString() });
      });
    } catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString(), });
    }
});

  async function GetPurchaseHistoryData(userid, keywork) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT historyid, PurchaseHistory.productid, totalprice, totalquantity, price, productpath, producttitle, received FROM PurchaseHistory JOIN Product ON Product.productid = PurchaseHistory.productid WHERE userid = ? AND (Product.producttitle LIKE '%${keywork}%' OR Product.productsubtitle LIKE '%${keywork}%' OR Product.productsubtitle LIKE '%${keywork}%')`, [userid], (err, res) => {
        if (err) {
          reject(err);
        } else {
          if (res.length > 0) {
            resolve(res);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

module.exports = routes;