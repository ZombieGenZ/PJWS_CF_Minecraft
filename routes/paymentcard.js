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
    console.log("API payment card successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password,  } = req.body;
    username = await normalizeString(username);
    password = await normalizeString(password);

    try {
      axios.post(config.server_url + '/API/checkevaluate', {
        username: username,
        password: password,
        productid: productid
    }, {
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then(async responseCheckEvaluate => {
      if (responseCheckEvaluate.data.status) {
        const success = await CreateEvaluate(responseCheckEvaluate.data.userid, productid, Evaluate_Star, Evaluate_Comment);
        if (success) {
          res.status(200).json({ status: true, message: "Đánh giá thành công!" });
        }
        else {
          res.status(200).json({ status: false, message: "Lỗi trong quá trình đánh giá" });
        }
      }
      else {  
        res.status(200).json({ status: false, message: "Bạn đã đánh giá rồi" });
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

async function CreateEvaluate(userid, productid, rating, comment) {
  try {
    const result = await database.query(`INSERT INTO Evaluate (userid, productid, rating, comment) VALUE (?, ?, ?, ?)`, 
      [userid, productid, Number(rating), comment]);
      return true;
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;