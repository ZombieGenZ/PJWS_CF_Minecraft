const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require('cors');
const nodemailer = require('nodemailer');
const config = require('./config');

const email = config.email_email;
const pass = config.email_password;

const database = mysql.createConnection({
    host: config.database_host,
    port: config.database_port,
    user: config.database_user,
    password: config.database_password,
    database: config.database_database
});

database.connect((err) => {
    if (err) throw err;
    console.log("API buy product successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));

let transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false,
  auth: {
      user: email,
      pass: pass
  }
});



routes.post("/", async (req, res) => {
    let { to, subject, text, html } = req.body;
    
    try {
        if (to !== "" && to !== undefined && to !== null) {
            let info = await transporter.sendMail({
                from: `"GALAXY VIRUS TEAM" <${email}>`,
                to: `${to}`,
                subject: `${subject}`,
                text: `${text}`,
                html: `${html}`
            });
      
            res.status(200).json({ status: true, message: `Gửi email thành công!`, messageid: info.messageId });
        }
        else {
            res.status(200).json({ status: false, message: `Vui lòng điền đầy đủ thông tin!` });
        }
    } catch (error) {
        console.error(error);
        res.status(200).json({ status: false, message: `Gửi email thấy bại!`, message: error.toString(), messageid: null })
      }
});

module.exports = routes;