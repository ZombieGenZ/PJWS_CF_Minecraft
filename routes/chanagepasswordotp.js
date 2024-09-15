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
  console.log("API chanaga password otp successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { otpcode,
          newPassword,
          comfirmNewPassword
    } = req.body;

    if (otpcode !== "" && otpcode !== undefined && otpcode !== null && newPassword !== "" && newPassword !== undefined && newPassword !== null && comfirmNewPassword !== "" && comfirmNewPassword !== undefined && comfirmNewPassword !== null) {
      if (newPassword == comfirmNewPassword) {
        if (newPassword.length >= 8 && newPassword.length <= 50 && comfirmNewPassword.length >= 8 && comfirmNewPassword.length <= 50) {
          const exitOTP = await GetOTP(otpcode)
          if (exitOTP !== null) {
            const success_chanagepassword = await EditUserData(exitOTP.email, newPassword);
            const success_deleteotp = await DeleteOTP(otpcode);
            if (success_chanagepassword && success_deleteotp) {
              res.status(200).json({ status: true, message: 'Cập nhật mật khẩu thành công!' });
            }
            else {
              res.status(200).json({ status: false, message: 'Lỗi khi cập nhật dử liệu!' });
            }
          }
          else {
            res.status(200).json({ status: false, message: 'OTP Không tồn tại!' });
          }

        }
        else {
          res.status(200).json({ status: false, message: 'Mật khẩu chỉ có thể dài từ 8 đến 50 ký tự' });
        }
    }
    else {
      res.status(200).json({ status: false, message: 'Hai mật khẩu không trùng nhau' });
    }
    }
    else {
        res.status(200).json({ status: false, message: "Bạn cần điền đầy đủ thông tin" });
    }
  }
  catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: e.toString() });
  }
});

async function GetOTP(otpcode) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT otpcode, email FROM OTP WHERE otpcode = ?`, [otpcode], (err, res) => {
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

async function EditUserData(email, password) {
  try {;
    const result = await database.query(`UPDATE Account SET password = ? WHERE email = ?`, 
      [ password, email ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function DeleteOTP(otpcode) {
  try {;
    const result = await database.query(`DELETE FROM OTP WHERE otpcode = ?`, 
      [ otpcode ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;