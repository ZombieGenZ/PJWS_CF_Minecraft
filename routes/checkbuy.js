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
    console.log("API check buy successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, productid } = req.body;
    username = await normalizeString(username);
    password = await normalizeString(password);

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
      if (responseUser.data.status) {
          axios.post(config.server_url + '/API/getproductdata')
          .then(async responseProduct => {
            if (responseProduct.data.status) {
                const success = await GetPurchaseHistoryData(productid, responseUser.data.userid);
                if (success !== null) {
                  res.status(200).json({ status: true, message: "Người dùng đã mua sản phẩm", userid: responseUser.data.userid });
                }
                else {
                  res.status(200).json({ status: false, message: "Người dùng chưa mua sản phẩm" });
                }
            }
            else {
                res.status(200).json({ status: false, message: "Không thể tìm thấy sản phẩm được chỉ định" });
            }
          })
          .catch(e => {
            console.error(e);
            res.render("404notfound");
          });
      }
      else {
        res.status(200).json({ status: false, message: "Lỗi xác thực người dùng" });
      }
    })
    .catch(e => {
      console.error(e);
      res.status(200).json({ status: false, message: e.toString() });
    });
    }
    catch (e) {
      console.error(e);
      res.status(500).json({ status: false, message: e.toString() });
    }
});

function normalizeString(str) {
  return String(str)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

async function GetPurchaseHistoryData(productid, userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM PurchaseHistory WHERE productid = ? AND userid = ?`, [productid, userid], (err, res) => {
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