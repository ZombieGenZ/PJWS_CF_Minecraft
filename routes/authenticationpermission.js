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
  console.log("API permission authentication successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password } = req.body;

    username = await normalizeString(username);
    password = await normalizeString(password);

    axios.post(config.server_url + '/API/authentication', {
      username: username,
      password: password
  }, {
      headers: {
        'Content-Type': 'application/json'
      }
  })
  .then(async response => {
    if (response.data.status) {
      const permission = await GetPermission(response.data.user.permissionid);
      res.status(200).json({ status: true, userid: response.data.user.userid, username: response.data.user.username, money: response.data.user.money, verify: response.data.user.Verify, permission: permission, email: response.data.user.email });
    }
    else {
      res.status(200).json({ status: false, data: null });
    }
  })
  .catch(e => {
    res.status(200).json({ status: false, data: null });
  });
});

function normalizeString(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }

  async function GetPermission(permissionid) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT * FROM Permission WHERE permissionname = ?`, [permissionid], (err, res) => {
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