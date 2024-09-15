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
    console.log("API check evaluate successfully connected to the server");
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
      axios.post(config.server_url + '/API/checkbuy', {
        username: username,
        password: password,
        productid: productid
    }, {
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then(async responseCheckBuy => {
      if (responseCheckBuy.data.status) {
          const success = await CehckEvaluate(productid, responseCheckBuy.data.userid);
          if (success) {
            res.status(200).json({ status: true, message: "Người dùng này chưa đánh giá lần nào", userid: responseCheckBuy.data.userid });
          }
          else {
            res.status(200).json({ status: false, message: "Người dùng này đã đánh giá sản phẩm rồi" });
          }
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

async function CehckEvaluate(productid, userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Evaluate WHERE productid = ? AND userid = ?`, [productid, userid], (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (res.length > 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    });
  });
}

module.exports = routes;