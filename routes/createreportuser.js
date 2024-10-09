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
    console.log("API create report user successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, userid, message } = req.body;
    username = await normalizeString(username);
    password = await normalizeString(password);

    try {
      axios.post(config.server_url + '/API/checkreportuser', {
        username: username,
        password: password,
        userid: userid
    }, {
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then(async responseCheckReport => {
      if (responseCheckReport.data.status) {
        const success = await CreateReport(responseCheckReport.data.userid, userid, message);
        if (success) {
          res.status(200).json({ status: true, message: "Tố cáo thành công!" });
        }
        else {
          res.status(200).json({ status: false, message: "Lỗi trong quá trình tố cáo" });
        }
      }
      else {  
        res.status(200).json({ status: false, message: "Bạn đã tố cáo rồi" });
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

async function CreateReport(sender, userid, messgae) {
  try {
    const result = await database.query(`INSERT INTO ReportUser (userid, sender, message) VALUE (?, ?, ?)`, 
      [userid, sender, messgae]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;