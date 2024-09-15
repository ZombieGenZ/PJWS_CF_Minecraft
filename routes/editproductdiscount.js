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
  console.log("API edit product successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          productid,
          discount,
          discountCount,
    } = req.body;

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
      if (response.data.permission.acceptproductmanagement || response.data.permission.acceptproductmanagementall) {
        if (productid === "" || discount === "" || discountCount === "") {
          res.status(200).json({ status: false, message: "Bạn cần điền đầy đủ thông tin" });
          return;
        }
        else {
          if (discount !== 0) {
            if (discount >= 0 && discount <= 100) {
              if (discountCount >= 0) {
                if (response.data.permission.acceptproductmanagementall) {
                    const success = await EditProduct(productid, discount, discountCount);
                    if (success) {
                      res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                    }
                    else {
                      res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                    }
                }
                else {
                  const isAuthor = await CheckAuthor(response.data.userid, productid);
                  if (isAuthor) {
                    const success = await EditProduct(productid, discount, discountCount);
                    if (success) {
                      res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                    }
                    else {
                      res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                    }
                  }
                  else {
                    res.status(200).json({ status: false, message: `Bạn không có quyền thực hiện điều này` });
                  }
                }
              }
              else {
                res.status(200).json({ status: false, message: "Số lượt giảm giá không được bé hơn 0" });                     
              }
            }
            else {
              res.status(200).json({ status: false, message: "% giảm giá chỉ có thể từ 0% đến 100%" });
            }
        }
        else {
            if (discount === 0) {
              if (response.data.permission.acceptproductmanagementall) {
                const success = await EditProduct(productid, 0, 0);
                if (success) {
                  res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                }
                else {
                  res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                }
            }
            else {
              const isAuthor = await CheckAuthor(response.data.userid, productid);
              if (isAuthor) {
                const success = await EditProduct(productid, 0, 0);
                if (success) {
                  res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                }
                else {
                  res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                }
              }
              else {
                res.status(200).json({ status: false, message: `Bạn không có quyền thực hiện điều này` });
              }
            }
            }
            else {
                  res.status(200).json({ status: false, message: "% giảm giá chỉ có thể từ 0% đến 100%" });
            }
          }
        }
      }
      else {
        res.status(200).json({ status: false, message: "Bạn không có quyền thực hiện điều này" });
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

  async function EditProduct(productid, discount, discountCounth) {
    try {
      const result = await database.query(`UPDATE Product SET discount = ?, discountcount = ? WHERE productid = ?`, 
        [ discount, discountCounth, productid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

async function CheckAuthor(userid, productid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT sellerid FROM Product WHERE productid = ?`, [productid], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0].sellerid == userid);
      }
    });
  });
}

module.exports = routes;