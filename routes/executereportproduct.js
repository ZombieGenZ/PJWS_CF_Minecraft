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
  console.log("API execute report product successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          reportid,
          productid
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
      if (response.data.permission.acceptreportmanagement) {
        if (reportid != "" && reportid != undefined && reportid != null && productid != "" && productid != undefined && productid != null) {
          const success_commitReport = await EditReportData(reportid);
          const success_commitRroduct = await EditProductData(productid);
          if (success_commitReport && success_commitRroduct) {
            res.status(200).json({ status: true, message: "Xử lý thành công!" });
          }
          else {
            res.status(200).json({ status: false, message: "Lỗi trong quá trình cập nhật thông tin!" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Vui lòng điền đầy đủ thông tin" });
        }
      }
      else {
        res.status(200).json({ status: false, message: "Bạn không có quyền làm điều này" });
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

async function EditReportData(reportid) {
  try {;
    const result = await database.query(`UPDATE ReportProduct SET complete = true WHERE reportid = ?`, 
      [ reportid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function EditProductData(productid) {
  try {;
    const result = await database.query(`UPDATE Product SET status = ? WHERE productid= ?`, 
      [ `<span class="badge text-bg-danger">Bị từ chối</span>`, productid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;