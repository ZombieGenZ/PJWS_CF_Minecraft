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
  console.log("API search product management successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, keyword } = req.body;

    username = await normalizeString(username);
    password = await normalizeString(password);

    axios.post(config.server_url + '/API/authenticationpermission', {
      username: username,
      password: password
  }, {
      headers: {
        'Content-Type': 'application/json'
      }
  })
  .then(async response => {
    if (response.data.status) {
      if (Boolean(response.data.permission.acceptproductmanagementall)) {
          let productData = await SearchGetAllProductData(keyword);
          res.status(200).json({ status: true, data: productData });
        }
        else if (Boolean(response.data.permission.acceptproductmanagement)) {
          let productData = await SearchGetProductData(response.data.userid, keyword);
        res.status(200).json({ status: true, data: productData });
      }
      else {
        res.status(200).json({ status: false, data: null });
      }
    }
    else {
      res.status(200).json({ status: false, data: null });
    }
  })
  .catch(e => {
    console.error(e);
    res.status(200).json({ status: false, data: null, message: e.toString() });
  });
});

function normalizeString(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }

  async function SearchGetProductData(userid, keyword) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT DISTINCT productid, sellerid, username, producttitle, productsubtitle, information, productcontent, price, quantity, producticonpath, productpath, status, Verify, discount, discountcount, executeCommand FROM Product JOIN Account ON Product.sellerid = Account.userid WHERE sellerid = ? AND (producttitle LIKE "%${keyword}%" OR producttitle LIKE "%${keyword}%" OR productcontent LIKE "%${keyword}%")`, [userid], (err, res) => {
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

  async function SearchGetAllProductData(keyword) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT DISTINCT productid, sellerid, username, producttitle, productsubtitle, information, productcontent, price, quantity, producticonpath, productpath, status, Verify, discount, discountcount, executeCommand FROM Product JOIN Account ON Product.sellerid = Account.userid WHERE (producttitle LIKE "%${keyword}%" OR producttitle LIKE "%${keyword}%" OR productcontent LIKE "%${keyword}%")`, (err, res) => {
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