const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
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
  console.log("API account authentication successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    try {
      let { username, password } = req.body;

      username = await normalizeString(username);
      password = await normalizeString(password);

      if (username === "" || password === "") {
        res.status(200).json( { status: false, message: "Bạn cần điền đầy đủ thông tin" } );
      }
      else {
          const acceptLogin = await Authentication(username, password);
          if (acceptLogin.status) {
            if (acceptLogin.user.penalty !== null) {
              const penalty = await GetPenalty(acceptLogin.user.penalty);
              if (penalty !== null) {
                const penaltyEndDate = new Date(penalty.penaltyend);
                const now = new Date();
                if (penaltyEndDate > now) {
                  const penaltyBy = await GetUser(penalty.penaltyby);
                  res.status(200).json({ status: false, message: `Tài khoản ${acceptLogin.user.username} đã bị khóa bởi ${penaltyBy.username} vì lý do ${penalty.penaltyreason} vào ${formatDate(penalty.penaltystart)} và trừng phạt sẽ kết thúc vào ${formatDate(penalty.penaltyend)}` });
                }
                else {
                  const deletefinished = await DeletePenalty_All(penalty.penaltyid, acceptLogin.user.userid);
                  if (deletefinished) {
                    res.status(200).json({ status: true, message: "Đăng nhập thành công!", username: username, password: password });
                  }
                  else {
                    res.status(200).json({ status: false, message: "Lỗi khi xóa hình phạt trước đây!" });
                  }
                }
              }
            }
            else {
              res.status(200).json({ status: true, message: "Đăng nhập thành công!", user: acceptLogin.user });
            }
          }
          else {
              res.status(200).json({ status: false, message: "Tài khoản hoặc mật khẩu không tồn tại!" });
          }
      }
    }
    catch (e) {
        res.status(200).json({ status: false, message: e.toString() });
    }
});

async function Authentication(username, password) {
    async function GetUserByUsername(username) {
        return new Promise((resolve, reject) => {
          database.query(`SELECT * FROM Account WHERE username = ?`, [username], (err, res) => {
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
    
      try {
        let user = await GetUserByUsername(username);
        if (user === null) {
            return {
                status: false
            };
        }
        else {
            if (user.username === username && user.password === password) {
                return {
                    status: true,
                    user: user
                };
            }
            return {
                status: false
            };
        }
      }
      catch (e) {
            return {
                status: false
            };;
      }
}

async function GetPenalty(penaltyid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Penalty WHERE penaltyid = ?`, [penaltyid], (err, res) => {
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

async function GetUser(userid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Account WHERE userid = ?`, [userid], (err, res) => {
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

  function formatDate(date) {
    const now = new Date(date);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
  
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  }

module.exports = routes;