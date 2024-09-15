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
  console.log("API get product data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    const { keyword } = req.body;
    try {
      let productData = await GetProductData(keyword);
      res.status(200).json({ status: true, data: productData });
    } catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString(), });
    }
});

  async function GetProductData(keyword) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT productid, sellerid, username, producttitle, productsubtitle, information, productcontent, price, quantity, producticonpath, productpath, status, Verify, totalsold, ratingstar, discount, discountcount FROM Product JOIN Account ON Product.sellerid = Account.userid WHERE status LIKE '<span class="badge text-bg-success">Đã được duyệt</span>' AND (producttitle LIKE '%${keyword}%' OR productsubtitle LIKE '%${keyword}%' OR productcontent LIKE '%${keyword}%')`, (err, res) => {
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