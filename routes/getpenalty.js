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
  console.log("API get penalty successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    const { penaltyid } = req.body;
    try {
      const penaltyData = await GetPenaltyData(penaltyid);
      if (penaltyData !== null) {
        res.status(200).json({ status: true, data: penaltyData });
      }
      else {
        res.status(200).json({ status: false, data: null, message: "Không thể tìm thấy hình phạt được chỉ định" });
      }
    }
    catch (e) {
      res.status(200).json({ status: false, data: null, message: e.toString() });
    }
});

  async function GetPenaltyData(penaltyid) {
    return new Promise((resolve, reject) => {
      database.query(`SELECT penaltyid, penaltyreason, penaltystart, penaltyend, Account.username FROM Penalty JOIN Account ON Account.userid = Penalty.penaltyby WHERE penaltyid = ?`, [penaltyid], (err, res) => {
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

module.exports = routes;