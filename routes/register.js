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
    console.log("API register successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, email, password, comfirmpassword } = req.body;
    username = await normalizeString(username);
    email = await normalizeString_Email(email);
    password = await normalizeString(password);
    comfirmpassword = await normalizeString(comfirmpassword);
    try {
        if (username === "" || email === "" || password === "" || comfirmpassword === "") {
            res.status(200).json( { status: false, message: "Cần điền đầy đủ thông tin" } );
        }
        else {
            if (username.length < 4 || username.length > 20) {
                res.status(200).json( { status: false, message: "Tên người dùng chỉ có thể dài từ 4 đến 20 ký tự" } );
            }
            else {
                const accpetUsername = checkAlphanumericAccept(username);
                if (accpetUsername === false) {
                    res.status(200).json( { status: false, message: "Trong tên người dùng không được có ký tự đặt biệt" } );
                }
                else {
                    const isEmail = checkEmailAccept(email);
                    if (!isEmail) {
                        res.status(200).json( { status: false, message: "Địa chỉ email không hợp lệ" } );
                    }
                    else {
                        if (password !== comfirmpassword) {
                            res.status(200).json( { status: false, message: "Hai mật khẩu không khớp nhau" } );
                        }
                        else {
                            if (password.length < 8 || password.length > 50) {
                                res.status(200).json( { status: false, message: "Mật khẩu chỉ có thể dài từ 8 đến 50 ký tự" } );
                            }
                            else {
                                const existUsername = await CheckUsername(username);
                                const existEmail = await CheckEmail(email);
                                if (existUsername || existEmail) {
                                    const error = [];
                                    if (existUsername) {
                                        error.push("Tên người dùng");
                                    }
                                    if (existEmail) {
                                        error.push("Địa chỉ email");
                                    }
                                    const message = `${error.join(" và ")} đã tồn tại`;
                                    res.status(200).json({ status: false, message: message });
                                }
                                else {
                                    const succeeded = await CreateAccount(username, email, password);
                                    await SendEmail(email, username);
                                    if (!succeeded) {
                                        res.status(200).json({ status: true, message: "Bạn đã đăng ký tài khoản thành công!", username: username, password: password });
                                    }
                                    else {
                                        res.status(200).json( { status: false, message: "Không thể thêm người dùng này" } );
                                    }
                                }
                            }
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            console.error(e);
            res.status(200).json({ status: false, message: e.toString() });
        }
});

async function CheckUsername(username) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Account WHERE username = ?`, [username], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.length > 0);
      }
    });
  });
}

async function CheckEmail(email) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Account WHERE email = ?`, [email], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res.length > 0);
      }
    });
  });
}

async function CreateAccount(username, email, password) {
    const result = database.query(`INSERT INTO Account (username, email, password) VALUE (?, ?, ?)`, [username, email, password]);
    if (result.rowsAffected > 0 || result.changedRows > 0) {
      return true;
    }
    return false;
}

function checkEmailAccept(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function checkAlphanumericAccept(str) {
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    return alphanumericRegex.test(str);
}
function normalizeString(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }
  function normalizeString_Email(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  async function SendEmail(email, username) {
    try {
      let text = `Xin chào ${username},\n\nCảm ơn bạn đã đăng ký dịch vụ của chúng tôi và chào mừng bạn đến với ${config.brandname}. Chúng tôi rất vui mừng được chào đón bạn và hy vọng bạn sẽ có trải nghiệm tuyệt vời với các sản phẩm và dịch vụ của chúng tôi.\n\nNếu bạn có bất cứ thắc mắc hoặc cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi qua email ${config.contact_email} hoặc số điện thoại ${config.contact_mobile}.\n\nTrân trọng,\n${config.brandname}\n`;
      let HTML = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.15); font-family: Arial, sans-serif;">
                    <p style="font-size: 16px; line-height: 1.8; color: #333333; margin-bottom: 20px;">Xin chào <b>${username}</b>,</p>
                    <p style="font-size: 16px; line-height: 1.8; color: #333333; margin-bottom: 20px;">Cảm ơn bạn đã đăng ký dịch vụ của chúng tôi và chào mừng bạn đến với <strong>GALAXY VIRUS STORE</strong>. Chúng tôi rất vui mừng được chào đón bạn và hy vọng bạn sẽ có trải nghiệm tuyệt vời với các sản phẩm và dịch vụ của chúng tôi.</p>
                    <p style="font-size: 16px; line-height: 1.8; color: #333333; margin-bottom: 20px;">Nếu bạn có bất cứ thắc mắc hoặc cần hỗ trợ thì đừng ngần ngại liên hệ với chúng tôi qua email <a href="mailto:${config.contact_email}" style="color: #28a745; text-decoration: none; font-weight: bold;">${config.contact_email}</a> hoặc số điện thoại <a href="tel:${config.contact_mobile}" style="color: #28a745; text-decoration: none; font-weight: bold;">${config.contact_mobile}</a>.</p>
                    <p style="font-size: 16px; line-height: 1.8; color: #333333; text-align: center; margin-top: 30px;">Trân trọng,<br><b>${config.brandname}</b></p>
                </div>`;
      axios.post(config.server_url + '/API/sendemail', {
        to: email,
        subject: `Chào mừng ${username} đến với GALAXY VIRUS STORE`,
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

module.exports = routes;