const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cors = require('cors');
const fs = require('fs');
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
  console.log("API delete product successfully connected to the server");
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
        if (response.data.permission.acceptproductmanagementall) {
          const picture_path = await GetPicturePath(productid);

          const deletePromises = picture_path.map(item => {
            return new Promise((resolve, reject) => {
              fs.unlink(item.picturepath, err => {
                if (err) {
                  reject(err);
                } else {
                  resolve(true);
                }
              });
            });
          });
          
          try {
            await Promise.all(deletePromises);
            
            const icon_path = await GetIconPath(productid);
            await fs.unlink(icon_path.producticonpath, err => {
              if (err) {
                  res.status(200).json({ status: false, message: err.toString() });
                  return;
                }
            });
          
            const success_delete_picture = await DeletePicture(productid);
            const success_delete_evaluate = await DeleteEvaluate(productid);
            const success_delete_cart = await DeleteCart(productid);
            const success_delete_purchasehistory = await DeletePurchaseHistory(productid);
            const success_delete_product = await DeleteProduct(productid);
          
            if (success_delete_picture && success_delete_product && success_delete_cart && success_delete_purchasehistory && success_delete_evaluate) {
              res.status(200).json({ status: true, message: `Đã xóa sản phẩm thành công!` });
            } else {
              res.status(200).json({ status: false, message: `Lỗi khi xóa sản phẩm` });
            }
          } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: 'Lỗi khi xóa dữ liệu!' });
          }
        }
        else {
          const isAuthor = await CheckAuthor(response.data.userid, productid);
          if (isAuthor) {
            const picture_path = await GetPicturePath(productid);

            const deletePromises = picture_path.map(item => {
              return new Promise((resolve, reject) => {
                fs.unlink(item.picturepath, err => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve(true);
                  }
                });
              });
            });
            
            try {
              await Promise.all(deletePromises);
              
              const icon_path = await GetIconPath(productid);
              await fs.unlink(icon_path.producticonpath, err => {
                if (err) {
                    res.status(200).json({ status: false, message: err.toString() });
                    return;
                  }
              });
            
              const success_delete_picture = await DeletePicture(productid);
              const success_delete_evaluate = await DeleteEvaluate(productid);
              const success_delete_cart = await DeleteCart(productid);
              const success_delete_purchasehistory = await DeletePurchaseHistory(productid);
              const success_delete_product = await DeleteProduct(productid);
            
              if (success_delete_picture && success_delete_product && success_delete_cart && success_delete_purchasehistory && success_delete_evaluate) {
                res.status(200).json({ status: true, message: `Đã xóa sản phẩm thành công!` });
              } else {
                res.status(200).json({ status: false, message: `Lỗi khi xóa sản phẩm` });
              }
            } catch (error) {
              console.error(error);
              res.status(500).json({ status: false, message: 'Lỗi khi xóa dữ liệu!' });
            }
          }
          else {
            res.status(200).json({ status: false, message: `Bạn không có quyền thực hiện điều này` });
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

async function GetPicturePath(productid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT picturepath FROM Picture WHERE productid = ?`, [ productid ], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function GetIconPath(productid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT producticonpath FROM Product WHERE productid = ?`, [ productid ], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0]);
      }
    });
  });
}

  async function DeletePicture(productid) {
    try {
      const result = await database.query(`DELETE FROM Picture WHERE productid = ?`, 
        [ productid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

async function DeleteEvaluate(productid) {
  try {
    const result = await database.query(`DELETE FROM Evaluate WHERE productid = ?`, 
      [ productid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function DeleteCart(productid) {
  try {
    const result = await database.query(`DELETE FROM Cart WHERE productid = ?`, 
      [ productid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function DeletePurchaseHistory(productid) {
  try {
    const result = await database.query(`DELETE FROM PurchaseHistory WHERE productid = ?`, 
      [ productid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

  async function DeleteProduct(productid) {
    try {
      const result = await database.query(`DELETE FROM Product WHERE productid = ?`, 
        [ productid ]);
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