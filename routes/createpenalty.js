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
  console.log("API create penalty successfully connected to the server");
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
          reason,
          starttime,
          endtime,
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
        if (starttime !== "" && starttime !== undefined && starttime !== null && endtime !== "" && endtime !== undefined && endtime !== null) {
          if (starttime < endtime && endtime > starttime) {
            let users = await GetUserData(userid);
            if (users.penalty === null) {
              if (users.userid !== response.data.userid) {
                const id = Math.round(Math.random() * 1e9);
                reason = reason == "" ? "không có lý do" : "";
                const success_createpenalt = await CreatePenalty(id, reason, starttime, endtime, response.data.userid);
                const success_addpenalt = await EditUserData(userid, id);
                if (success_createpenalt && success_addpenalt) {
                  res.status(200).json({ status: true, message: 'Trừng phạt thành công!' });
                }
                else {
                  res.status(200).json({ status: false, message: 'Lỗi khi trừng phạt!' });
                }
              }
              else {
                res.status(200).json({ status: false, message: 'Bạn không thể tự trừng phạt chính mình!' });
              }
            }
            else {
              let penalty = await GetPenaltyData(users.penalty);
              if (penalty !== null) {
                if (penalty.endtime >= Date().now) {
                  let success = DeletePenalty_All(users.penalty, users.userid)
                  if (success) {
                    if (users.userid !== response.data.userid) {
                      const id = Math.round(Math.random() * 1e9);
                      reason = reason == "" ? "không có lý do" : "";
                      const success_createpenalt = await CreatePenalty(id, reason, starttime, endtime, response.data.userid);
                      const success_addpenalt = await EditUserData(userid, id);
                      if (success_createpenalt && success_addpenalt) {
                        res.status(200).json({ status: true, message: 'Trừng phạt thành công!' });
                      }
                      else {
                        res.status(200).json({ status: false, message: 'Lỗi khi trừng phạt!' });
                      }
                    }
                    else {
                      res.status(200).json({ status: false, message: 'Bạn không thể tự trừng phạt chính mình!' });
                    }
                  }
                  else {
                    res.status(200).json({ status: false, message: 'Lỗi trong quá trình xóa hình phạt' });
                  }
                }
                else {
                  res.status(200).json({ status: false, message: 'Người dùng này đã có lệnh trường phạt rồi' });
                }
              }
              else {
                res.status(200).json({ status: false, message: 'Lỗi trong quá trình lấy dử liệu hình phạt' });
              }
            }
          }
          else {
            res.status(200).json({ status: false, message: 'Thời gian bắt đầu trừng phạt phải bé hơn thời gian kết thúc trường phạt' });
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

async function EditUserData(userid, penalty) {
  try {;
    const result = await database.query(`UPDATE Account SET penalty = ? WHERE userid = ?`, 
      [ penalty, userid ]);
      return true;
  }
  catch (e) {
    return false;
  }
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

async function GetPenaltyData(penaltyid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT penaltystart, penaltyend FROM Penalty WHERE penaltyid = ?`, [penaltyid], (err, res) => {
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

async function CreatePenalty(penaltyid, penaltyreason, penaltystart, penaltyend, penaltyby) {
  try {
    const result = await database.query(`INSERT INTO Penalty (penaltyid, penaltyreason, penaltystart, penaltyend, penaltyby) VALUE (?, ?, ?, ?, ?)`, 
      [penaltyid, penaltyreason, penaltystart, penaltyend, penaltyby]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;