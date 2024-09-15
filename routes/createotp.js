const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cors = require('cors');
const { v4 } = require('uuid');
const crypto = require('crypto');
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
  console.log("API create otp successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { email } = req.body;

    email = await normalizeString_Email(email);

    if (email !== "" && email !== undefined && email !== null) {
        const isEmail = await checkEmail(email);
        if (isEmail) {
          const notOTP = await GetOTPData(email);
          if (notOTP === null) {
              let exitEmail = false;
              const userData = await GetUserData();
              await userData.forEach(async items => {
                  if (items.email === email) {
                      exitEmail = true;
                      const OTP = await GeneratorUUID() + "-" + String(Math.round(Math.random() * 1e9));
                      const url = `${config.server_url}/forgetpassword/chanagepassword/${OTP}`;
                      await CreateOTP(OTP, email);
                      await SendEmail(items.email, items.username, url);
                      res.status(200).json({ status: true, message: `Đã gửi email thành công! Vui lòng kiểm tra hộp thư của email ${email}` });
                      return;
                    }
                  });
              if (!exitEmail) {
                res.status(200).json({ status: false, message: `Không có tài khoản nào được liên kết với email ${email}` });
              }
            }
            else {
              res.status(200).json({ status: false, message: `Đã có email được gửi đến ${email} rồi` });
            }
        }
        else {
            res.status(200).json({ status: false, message: "Email không đúng định dạn" });
        }
    }
    else {
        res.status(200).json({ status: false, message: "Vui lòng điền đầy đủ thông tin" });
    }
  }
  catch (e) {
    console.error(e);
    res.status(500).json({ status: false, message: e.toString() });
  }
});

async function CreateOTP(OTPCode, email) {
  try {;
    const result = await database.query(`INSERT INTO OTP (otpcode, email) VALUE (?, ?)`, 
      [ OTPCode, email ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function GetUserData() {
  return new Promise((resolve, reject) => {
    database.query(`SELECT username, email FROM Account`, (err, res) => {
      if (err) {
        reject(err);
      } else {
        if (res.length > 0) {
          resolve(res);
        } else {
          resolve(null);
        }
      }
    });
  });
}

function checkEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function GeneratorUUID() {
  const randomBytes = crypto.randomBytes(16);
  const uuidString = v4({ uuid: randomBytes, random: randomBytes });
  return uuidString;
}

async function SendEmail(email, username, url) {
    try {
      let text = `ĐẶT LẠI MẬT KHẨU\nXin chào ${username},\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.\n\nĐể đặt lại mật khẩu, vui lòng truy cập vào liên kết sau:\n${url}\n\nVì lý do bảo mật, vui lòng không chia sẻ liên kết này với bất kỳ ai.\n\nNếu bạn gặp sự cố khi truy cập liên kết trên, hãy sao chép và dán URL vào trình duyệt của bạn.\n\nNếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ với chúng tôi:\n\nEmail: ${config.contact_email}\nĐiện thoại: ${config.contact_mobile}\n\nTrân trọng,\nĐội ngũ hỗ trợ của chúng tôi\n`;
      let HTML = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="padding: 40px 30px; text-align: center; background-color: #007bff; border-radius: 8px 8px 0 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Đặt Lại Mật Khẩu</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <p style="margin-bottom: 20px;">Xin chào ${username},</p>
                            <p style="margin-bottom: 20px;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                            <p style="margin-bottom: 20px;">Để đặt lại mật khẩu, vui lòng nhấp vào nút bên dưới:</p>
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 20px;">
                                <tr>
                                    <td align="center">
                                        <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Đặt Lại Mật Khẩu</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin-bottom: 20px;">Vì lý do bảo mật, vui lòng không chia sẻ liên kết này với bất kỳ ai.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px; background-color: #f8f8f8; border-radius: 0 0 8px 8px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; color: #666666;">Nếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ với chúng tôi:</p>
                            <p style="margin: 10px 0 0; font-size: 14px;">
                                Email: <a href="mailto:${config.contact_email}" style="color: #007bff; text-decoration: none;">${config.contact_email}</a> | 
                                Điện thoại: <a href="tel:${config.contact_mobile}" style="color: #007bff; text-decoration: none;">${config.contact_mobile}</a>
                            </p>
                        </td>
                    </tr>
                </table>`;
      axios.post(config.server_url + '/API/sendemail', {
        to: email,
        subject: `Yêu cầu đặt lại mật khẩu cho tài khoản ${username}`,
        text: text,
        html: HTML
    }, {
        headers: {
          'Content-Type': 'application/json'
        }
    })
      .then(async responseEmail => {
      return true;
    })
    .catch(e => {
      console.error(e);
      res.status(200).json({ status: false, message: e.toString() });
    });
    }
    catch (e) {
      return false;
    }
  }

  function normalizeString_Email(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  async function GetOTPData(email) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT otpcode FROM OTP WHERE email = ?`, [email], (err, res) => {
        if (err) {
          reject(err);
        } else {
          if (res.length > 0) {
            resolve(res);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

module.exports = routes;