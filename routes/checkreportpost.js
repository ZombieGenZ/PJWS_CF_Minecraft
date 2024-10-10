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
    console.log("API check report post successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, postid } = req.body;
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
          if (postid !== "" && postid !== null && postid !== undefined) {
            const success = await CheckReport(postid, responseUser.data.userid);
            if (success) {
              res.status(200).json({ status: true, message: "Bạn chưa tố cáo bài viết này bao giờ", userid: responseUser.data.userid });
            }
            else {
              res.status(200).json({ status: false, message: "Người dùng này đã tố cáo bài viết này rồi" });
            }
          }
          else {
            res.status(200).json({ status: false, message: "Vui lòng nhập đầy đủ thông tin" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Bạn cần đăng nhập để tiếp tục" });
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

    if (responseCheckBuy.data.status) {

    }
    else {
      res.status(200).json({ status: false, message: "Lỗi xác thực người dùng" });
    }
});

async function CheckReport(postid, sender) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM ReportPost WHERE postid = ? AND sender = ?`, [postid, sender], (err, res) => {
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