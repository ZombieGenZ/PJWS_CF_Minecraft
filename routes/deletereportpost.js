const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require('cors');
const axios = require("axios");
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
  console.log("API delete report post successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, reportid } = req.body;

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
      if (responseUser.data.permission.acceptreportmanagement) {
        if (reportid !== "" && reportid !== undefined && reportid !== null) {
          const successFindReport = await GetReportData(reportid);
          if (successFindReport !== null) {
            const success = await DeleteReport(reportid);
            if (success) {
              res.status(200).json({ status: true, message: "Xóa tố cáo thành công!" });
            }
            else {
              res.status(200).json({ status: true, message: "Lỗi khi xóa tố cáo" });
            }
          }
          else {
            res.status(200).json({ status: false, message: "Không tìm thấy tố cáo được chỉ định" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Không đủ thông tin" });
        }
      }
      else {
        res.status(200).json({ status: false, message: "Bạn không có quyền làm điều này" });
      }
    })
    .catch(e => {
      console.error(e);
      res.status(200).json({ status: false, message: e.toString() });
    });
    }
    catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString() });
    }
});

  async function GetReportData(reportid) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT * FROM ReportPost WHERE reportid = ?`, [reportid], (err, res) => {
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

  function normalizeString(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }

  async function DeleteReport(reportid) {
    try {
      const result = await database.query(`DELETE FROM ReportPost WHERE reportid = ?`, 
        [ evaluateid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

module.exports = routes;