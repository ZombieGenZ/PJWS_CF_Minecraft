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
  console.log("API edit evaluate successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, evaluateid, rating, comment } = req.body;

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
      if (responseUser.data.permission.acceptproductmanagementall) {
        if (evaluateid !== "" && evaluateid !== undefined && evaluateid !== null) {
          const successFindEvaluation = await GetEvaluateData(evaluateid);
          if (successFindEvaluation !== null) {
            if (rating !== "" && rating !== undefined && rating !== null) {
              const success = await EditEvaluate(evaluateid, rating, comment);
              if (success) {
                res.status(200).json({ status: true, message: "Chính sửa đánh giá thành công" });
              }
              else {
                res.status(200).json({ status: false, message: "Lỗi khi chỉnh sửa đánh giá" });
              }
            }
            else {
              res.status(200).json({ status: false, message: "Không đủ thông tin" });
            }
          }
          else {
            res.status(200).json({ status: false, message: "Không tìm thấy đánh giá được chỉ định" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Không đủ thông tin" });
        }
      }
      else {
        // const successFindEvaluation = await GetEvaluateData(evaluateid);
        if (evaluateid !== "" && evaluateid !== undefined && evaluateid !== null) {
          const successFindEvaluation = await GetEvaluateData(evaluateid);
          if (successFindEvaluation !== null) {
            if (successFindEvaluation.userid == responseUser.data.userid) {
              if (rating !== "" && rating !== undefined && rating !== null) {
                const success = await EditEvaluate(evaluateid, rating, comment);
                if (success) {
                  res.status(200).json({ status: true, message: "Chính sửa đánh giá thành công" });
                }
                else {
                  res.status(200).json({ status: false, message: "Lỗi khi chỉnh sửa đánh giá" });
                }
              }
              else {
                res.status(200).json({ status: false, message: "Không tìm thấy đánh giá được chỉ định" });
              }
            }
            else {
              res.status(200).json({ status: false, message: "Bạn không có quyền thực hiện điều này" });
            }
          }
          else {
            res.status(200).json({ status: false, message: "Không tìm thấy đánh giá được chỉ định" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Không đủ thông tin" });
        }
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

  async function GetEvaluateData(evaluateid) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT * FROM Evaluate WHERE evaluateid = ?`, [evaluateid], (err, res) => {
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

  async function EditEvaluate(evaluateid, rating, comment) {
    try {
      const result = await database.query(`UPDATE Evaluate SET rating = ?, comment = ? WHERE evaluateid = ?`, 
        [ rating, comment, evaluateid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

module.exports = routes;