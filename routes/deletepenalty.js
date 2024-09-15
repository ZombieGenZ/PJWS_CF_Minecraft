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
  console.log("API delete penalty successfully connected to the server");
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
          penaltyid
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
        if (userid !== "" && userid !== undefined && userid !== null && penaltyid !== "" && penaltyid !== undefined && penaltyid !== null) {
          let users = await GetUserData(userid);
          if (users.penalty !== null) {
              const success = await DeletePenalty_All(penaltyid, userid);
              if (success) {
                res.status(200).json({ status: true, message: "Xóa lệnh trừng phạt thành công!" });
              }
              else {
                res.status(200).json({ status: false, message: "Lỗi khi xóa lệnh trừng phạt!" });
              }
          }
          else {
            res.status(200).json({ status: false, message: "Người dùng này không có lệnh trừng phạt nào" });
          } 
        }
        else {
          res.status(200).json({ status: false, message: "Vui lòng điền đầy đủ thông tin" });
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
    database.query(`SELECT userid, penalty FROM Account WHERE userid = ?`, [userid], (err, res) => {
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

async function DeletePenalty_All(penaltyid, userid) {
  async function DeletePenalty_Penalty(penaltyid) {
    return new Promise((resolve, reject) => {
      database.query(`DELETE FROM Penalty WHERE penaltyid = ?`, [penaltyid], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
  async function DeletePenalty_Account(userid) {
    return new Promise((resolve, reject) => {
      database.query(`UPDATE Account SET penalty = NULL WHERE userid = ?`, [userid], (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }
  const finished_1 = await DeletePenalty_Account(userid);
  const finished_2 = await DeletePenalty_Penalty(penaltyid);
  if (finished_1 && finished_2) {
    return true;
  }
  return false;
}

module.exports = routes;