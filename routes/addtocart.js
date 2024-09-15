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
    console.log("API buy product successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, productid, quantity } = req.body;
    username = await normalizeString(username);
    password = await normalizeString(password);

    try {
      if (quantity > 0) {
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
                  let success = false;
                  responseProduct.data.data.forEach(async items => {
                      if(items.productid == productid) {
                        const existCart = await GetCartData(items.productid, responseUser.data.userid);
                        if (existCart !== null) {
                          res.status(200).json({ status: true, message: "Mua sản phẩm thành công!" });
                        }
                        else {
                          const success = await CreateCart(responseUser.data.userid, items.productid);
                          if (success) {
                            res.status(200).json({ status: true, message: "Mua sản phẩm thành công!" });
                            return;
                          }
                          else {
                            res.status(200).json({ status: false, message: "Lỗi khi mua sản phẩm!" });
                            return;
                          }
                        }
                      }
                  });
                }
                else {
                    res.status(200).json({ status: false, message: "Không thể tìm thấy sản phẩm được chỉ định" });
                }
              })
              .catch(e => {
                console.error(e);
                res.status(200).json({ status: false, message: "Lỗi khi lấy dử liệu sản phẩm" });
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
      else {
        res.status(200).json({ status: false, message: "Số lượng phải lớn hơn 0" });
      }
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

async function CreateCart(userid, productid) {
  try {
    const result = await database.query(`INSERT INTO Cart (userid, productid) VALUE (?, ?)`, 
      [userid, productid]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function GetCartData(productid, userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Cart WHERE productid = ? AND userid = ?`, [productid, userid], (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (res.length > 0) {
          resolve(res[0]);
        } else {
          resolve(null);
        }
      }
    });
  });
}

module.exports = routes;