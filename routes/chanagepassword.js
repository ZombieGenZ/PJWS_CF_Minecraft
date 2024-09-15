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
  console.log("API chanaga password successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          currentPassword,
          newPassword,
          comfirmNewPassword
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
        if (currentPassword !== "" && currentPassword !== undefined && currentPassword !== null && newPassword !== "" && newPassword !== undefined && newPassword !== null && comfirmNewPassword !== "" && comfirmNewPassword !== undefined && comfirmNewPassword !== null) {
          const userData = await GetPassword(response.data.userid);
          if (userData.password == currentPassword) {
            if (newPassword == comfirmNewPassword) {
                if (newPassword.length >= 8 && newPassword.length <= 50 && comfirmNewPassword.length >= 8 && comfirmNewPassword.length <= 50) {
                  if (newPassword !== userData.password) {
                    const success = await EditUserData(response.data.userid, newPassword);
                    if (success) {
                      res.status(200).json({ status: true, message: 'Cập nhật dử liệu thành công!' });
                    }
                    else {
                      res.status(200).json({ status: false, message: 'Lỗi khi cập nhật dử liệu!' });
                    }
                  }
                  else {
                    res.status(200).json({ status: false, message: 'Mật khẩu cũ và mật khẩu mới phải khác nhau' });
                  }
                }
                else {
                  res.status(200).json({ status: false, message: 'Mật khẩu chỉ có thể dài từ 8 đến 50 ký tự' });
                }
            }
            else {
              res.status(200).json({ status: false, message: 'Hai mật khẩu không trùng nhau' });
            }
          }
          else {
            res.status(200).json({ status: false, message: 'Mật khẩu hiện tại không chính xác!' });
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

async function GetPassword(userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT password FROM Account WHERE userid = ?`, [userid], (err, res) => {
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

async function EditUserData(userid, password) {
  try {;
    const result = await database.query(`UPDATE Account SET password = ? WHERE userid = ?`, 
      [ password, userid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;