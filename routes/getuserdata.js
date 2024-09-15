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
  console.log("API get user data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    const { username, password } = req.body;
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
          if (responseUser.status) {
            const success = await GetUserData(responseUser.data.userid);
            res.status(200).json({ status: true, data: success });
          }
          else {
            res.status(200).json({ status: false, message: "Bạn không có quyền truy cập vào dử liệu này" });
          }
      })
      .catch(e => {
        console.error(e);
        res.status(200).json({ status: false, message: e.toString() });
      });
    } catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString(), });
    }
});

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

module.exports = routes;