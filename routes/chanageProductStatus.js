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
  console.log("API chanage product status successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
  try {
    let { username, 
          password,
          productid,
          status
    } = req.body;

    username = await normalizeString(username);
    password = await normalizeString(password);

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
      if (response.data.permission.acceptcensorproduct) {
        if (productid !== "" && status !== "") {
          let status_text = "";
          switch (status) {
            case 1:
              status_text = `<span class="badge text-bg-success">Đã được duyệt</span>`
              break;
            case 2:
              status_text = `<span class="badge text-bg-danger">Bị từ chối</span>`
              break;
            default:
              res.status(200).json({ status: false, message: "Vui lòng không thay đổi dử liệu" });
              return;
          }
          const success = await EditStatus(productid, status_text);
          if (success) {
            res.status(200).json({ status: true, message: "Đã kiễm duyệt sản phẩm thành công" });
          }
          else {
            res.status(200).json({ status: false, message: "Lỗi khi kiểm duyệt sản phẩm" });
          }
        }
        else {
          res.status(200).json({ status: false, message: "Không đủ thông tin để thực thi" });
        }
      }
      else {
        res.status(200).json({ status: false, message: "Bạn không có quyền thực hiện điều này" });
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

function normalizeString(str) {
    return String(str)
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");
  }

  async function EditStatus(productid, status) {
    try {
      const result = await database.query(`UPDATE Product SET status = ? WHERE productid = ?`, 
        [ status, productid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

module.exports = routes;