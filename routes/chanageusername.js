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
  console.log("API chanaga username successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          newusername
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
      if (response.data.username === username) {
        if (newusername !== "" && newusername !== undefined && newusername !== null) {
          if (newusername.length >= 4 && newusername.length <= 20) {
            let isAccept = await checkAlphanumeric(newusername);
            if (isAccept) {
              let allowed = true;
              const allUserData = await GetAllUserData();
              allUserData.forEach(items => {
                if (items.username == newusername){
                  allowed = false;
                }
              });
              if (allowed) {
                const success = await EditUserData(response.data.userid, newusername);
                if (success) {
                  res.status(200).json({ status: true, message: 'Cập nhật dử liệu thành công!' });
                }
                else {
                  res.status(200).json({ status: false, message: 'Lỗi khi cập nhật dử liệu!' });
                }
              }
              else {
                res.status(200).json({ status: false, message: 'Tên người dùng đã tồn tại' });
              }
            }
            else {
              res.status(200).json({ status: false, message: 'Tên người dùng không đựa chứa ký tự đặt biệt' });
            }
          }
        else {
            res.status(200).json({ status: false, message: 'Tên người dùng chỉ có thể dài từ 4 đến 20 ký tự' });
          }
        }
        else {
            res.status(200).json({ status: false, message: "Bạn cần điền đầy đủ thông tin" });
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

async function EditUserData(userid, username) {
  try {;
    const result = await database.query(`UPDATE Account SET username = ? WHERE userid = ?`, 
      [ username, userid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function GetAllUserData(userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT userid, username, money, revenue, avatarpath, Verify, createtime, permissionid, bio, penalty FROM Account`, [userid], (err, res) => {
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

function checkAlphanumeric(str) {
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  return alphanumericRegex.test(str);
}

module.exports = routes;