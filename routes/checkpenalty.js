const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require('cors');
const cron = require('node-cron');
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
  console.log("API check penalty successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));

cron.schedule('*/30 * * * * *', () => {
  CheckExpiry();
});

async function CheckExpiry() {
  const allPenalty = await GetAllPenaltyData();

  if (allPenalty !== null) {
    allPenalty.forEach(async items => {
      const penaltyendtime = new Date(items.penaltyend);
      const now = new Date();

      if (now >= penaltyendtime) {
          const success = await DeletePenalty_All(items.penaltyid);
      }
    })
  }
}

  async function GetAllPenaltyData() {
    return new Promise((resolve, reject) => {
      database.query(`SELECT * FROM Penalty`, (err, res) => {
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

  async function DeletePenalty_All(penaltyid) {
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
    async function DeletePenalty_Account(penaltyid) {
      return new Promise((resolve, reject) => {
        database.query(`UPDATE Account SET penalty = NULL WHERE penalty = ?`, [penaltyid], (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    }
    const finished_1 = await DeletePenalty_Account(penaltyid);
    const finished_2 = await DeletePenalty_Penalty(penaltyid);
    if (finished_1 && finished_2) {
      return true;
    }
    return false;
  }

module.exports = routes;