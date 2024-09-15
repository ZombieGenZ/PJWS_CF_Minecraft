const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cors = require('cors');
const path = require('path');
const multer = require("multer");
const fs = require('fs');
const config = require('./config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/image/upload/user');
  },
  filename: function (req, file, cb) {
   const uniquSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
   cb(null, file.fieldname + '-' + uniquSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const database = mysql.createConnection({
  host: config.database_host,
  port: config.database_port,
  user: config.database_user,
  password: config.database_password,
  database: config.database_database
});

database.connect((err) => {
  if (err) throw err;
  console.log("API chanaga avatar successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", upload.fields([
    { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
  try {
    let { username, 
          password
    } = req.body;
    let { avatar } = req.files;

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
        if (avatar !== "" && avatar !== undefined && avatar !== null) {
          const user = await GetUserData(response.data.userid);
          if (user.avatarpath !== "public\\image\\system\\default_user.png") {
            try {
              const avatar_path = user.avatarpath;
              await fs.unlink(avatar_path, err => {
                if (err) {
                    res.status(200).json({ status: false, message: err.toString() });
                    return;
                  }
              });
            } catch (error) {
              console.error(error);
              res.status(200).json({ status: false, message: 'Lỗi khi xóa dữ liệu!' });
              return;
            }
          }
          const success = await EditUserData(response.data.userid, avatar[0].path);
          if (success) {
            res.status(200).json({ status: true, message: 'Cập nhật dử liệu thành công!' });
          }
          else {
            res.status(200).json({ status: false, message: 'Lỗi khi cập nhật dử liệu!' });
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

async function GetUserData(userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT userid, username, money, revenue, avatarpath, Verify, createtime, permissionid, bio, penalty FROM Account WHERE userid = ?`, [userid], (err, res) => {
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

async function EditUserData(userid, userAvatarPath) {
  try {;
    const result = await database.query(`UPDATE Account SET avatarpath = ? WHERE userid = ?`, 
      [ userAvatarPath, userid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;