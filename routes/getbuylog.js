const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
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
  console.log("API get picture data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    try {
      const buyLogData = await GetPurchaseHistoryData();
      res.status(200).json({ status: true, data: buyLogData });
    }
    catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString() });
    }
});

  async function GetPurchaseHistoryData() {
    return new Promise((resolve, reject) => {
      database.query(`SELECT Account.username, Product.producttitle, Product.productpath, PurchaseHistory.totalquantity, PurchaseHistory.totalprice FROM PurchaseHistory JOIN Account ON Account.userid = PurchaseHistory.userid JOIN Product ON Product.productid = PurchaseHistory.productid ORDER BY PurchaseHistory.createtime DESC`, (err, res) => {
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