const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require('cors');
const config = require('./config');
const axios = require("axios");
const { Rcon } = require('rcon-client');

const database = mysql.createConnection({
  host: config.database_host,
  port: config.database_port,
  user: config.database_user,
  password: config.database_password,
  database: config.database_database
});

database.connect((err) => {
  if (err) throw err;
  console.log("API execute command successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          ingame,
          billid
    } = req.body;

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
        const billData = await GetBill(billid);
        if (billData !== null) {
          if (!billData.received) {
            const rcon = new Rcon({
              host: config.game_serverip,
              port: config.game_rconport,
              password: config.game_rconpassword
            });
            try {
              const executeData = await GetCommand(billid);
              const command = executeData.executecommand.replace("%player%", ingame);
              await rcon.connect();
              for (let index = 0; index < executeData.totalquantity; index++) {
                  const response = await rcon.send(command);
                }
              await rcon.end();
              const success = await EditPurchaseHistory(billid);
              if (success) {
                res.status(200).json({ status: true, message: "Thực hiện lệnh thành công" });
              }
              else {
                res.status(200).json({ status: false, message: "Lỗi khi cập nhật dử liệu" });
              }
            } catch (error) {
              console.error('RCON error:', error);
              res.status(200).json({ status: false, message: error.toString() });
            }
          }
          else {
            res.status(200).json({ status: false, message: "Bạn đã nhận hàng rồi" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Hóa đơn không tồn tại" });
        }
    }
    else {
      res.status(200).json({ status: false, message: "Lỗi xác thực người dùng" });
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

async function EditPurchaseHistory(billid) {
  try {
    const result = await database.query(`UPDATE PurchaseHistory SET received = ? WHERE historyid = ?`, 
      [ true, billid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

  
async function GetBill(billid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM PurchaseHistory WHERE historyid = ?`, [billid], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0]);
      }
    });
  });
}

async function GetCommand(billid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT Product.executecommand, PurchaseHistory.totalquantity FROM PurchaseHistory JOIN Product ON PurchaseHistory.productid = Product.productid WHERE historyid = '${billid}'`, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0]);
      }
    });
  });
}

module.exports = routes;