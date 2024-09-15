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
          userid,
          permissionid,
          verify
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
      if (response.data.permission.acceptaccountmanagement) {
        if (permissionid !== "" && permissionid !== undefined && permissionid !== null && userid !== "" && userid !== undefined && userid !== null && verify !== "" && verify !== undefined && verify !== null) {
          let permissions = await GetAllPermissonData(permissionid);
          if (permissions !== null) {
            const success = await EditUserData(userid, permissionid, verify);
            if (success) {
              res.status(200).json({ status: true, message: 'Cập nhật dử liệu thành công!' });
            }
            else {
              res.status(200).json({ status: false, message: 'Lỗi khi cập nhật dử liệu!' });
            }
          }
        else {
            res.status(200).json({ status: false, message: 'Quyền hạn không tồn tại' });
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

async function EditUserData(userid, permissionid, verify) {
  try {;
    const result = await database.query(`UPDATE Account SET permissionid = ?, verify = ? WHERE userid = ?`, 
      [ permissionid, verify, userid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function GetAllPermissonData(permissonid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT permissionname FROM Permission WHERE permissionname = ?`, [permissonid], (err, res) => {
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