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
  console.log("API get all report post data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password } = req.body;

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
      if (Boolean(response.data.permission.acceptreportmanagement)) {
          let reportData = await GetAllReportData();
          res.status(200).json({ status: true, data: reportData });
      }
      else {
        res.status(200).json({ status: false, data: null });
      }
    }
    else {
      res.status(200).json({ status: false, data: null });
    }
  })
  .catch(e => {
    console.error(e);
    res.status(200).json({ status: false, data: null });
  });
});

  async function GetAllReportData() {
    return new Promise((resolve, reject) => {
      database.query(`SELECT ReportPost.reportid, ReportPost.message, ReportPost.createtime, Sender.username AS sendername, Sender.userid AS senderid, Post.posttitle AS posttitle, Post.postpath AS postpath, Post.postid AS postid, author.username AS authorname, author.userid AS authorname FROM ReportPost JOIN Account Sender ON Sender.userid = ReportPost.sender JOIN Post ON Post.postid = ReportPost.postid JOIN Account author ON author.userid = Post.userid WHERE complete = false`, (err, res) => {
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