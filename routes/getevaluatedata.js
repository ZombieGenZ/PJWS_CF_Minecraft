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
  console.log("API get evaluate data successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { productid } = req.body;

    try {
      const evaluateData = await GetEvaluateData(productid);
      res.status(200).json({ status: true, data: evaluateData });
    }
    catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString() });
    }
});

  async function GetEvaluateData(productid) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT evaluateid, Evaluate.userid, productid, rating, comment, Evaluate.createtime, username, Verify, avatarpath FROM Evaluate JOIN Account ON Account.userid = Evaluate.userid WHERE productid = ?`, [productid], (err, res) => {
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