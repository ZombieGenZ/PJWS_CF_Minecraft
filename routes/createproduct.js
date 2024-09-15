const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const axios = require("axios");
const cors = require('cors');
const path = require('path');
const multer = require("multer");
const { v4 } = require('uuid');
const crypto = require('crypto');
const config = require('./config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/image/upload/product');
  },
  filename: function (req, file, cb) {
   const uniquSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
   cb(null, file.fieldname + '-' + uniquSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const database = mysql.createConnection({
  host: config.database_host,
  port: config.database_port,
  user: config.database_user,
  password: config.database_password,
  database: config.database_database
});

database.connect((err) => {
  if (err) throw err;
  console.log("API create product successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'picture', maxCount: 100 }
]), async (req, res) => {
  try {
    let { username, 
          password,
          productname,
          productsubtitle,
          productdescription,
          productprice,
          productquantity,
          productcommand,
          productinformation
    } = req.body;
    let { icon, 
          picture
    } = req.files;

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
      if (response.data.permission.acceptproductmanagement || response.data.permission.acceptvouchermanagementall) {
        if (productname === "" || productsubtitle === "" || productdescription === "" || productprice === ""  || productquantity === "" || productcommand === "" || productinformation === "" || productinformation === undefined || productinformation == "[]" || icon === undefined || picture === undefined) {
          res.status(200).json({ status: false, message: "Bạn cần điền đầy đủ thông tin" });
          return;
        }
        else {
          const productInfo = JSON.parse(productinformation);
          if (Number(productprice) < 1000) {
              res.status(200).json({ status: false, message: `Giá sản phẩm phải lớn hơn ${Number(1000).toLocaleString('de-DE')}đ` });
              return;
            }
            else {
              if (Number(productquantity) < 1) {
                res.status(200).json({ status: false, message: `Số lượng sản phẩm phải lớn hơn ${Number(1).toLocaleString('de-DE')}` });
                return;
              }
              else {
                  let productdescriptionHTML = await parseMarkup(productdescription);
                  let productinformationHTML = "";
                  for (const items of productInfo) {
                      const { title, value } = items;
                      const HTML = `<div class="main-right-header-content-center-center-center-items"><div class="main-right-header-content-center-center-center-items-left"><h class="overflow-1">${title}</h></div><div class="main-right-header-content-center-center-center-items-right"><p class="overflow-1">${value}</p></div></div>`;
                      productinformationHTML += HTML; 
                  }
                  const productpath = await removeDiacritics(productname.replace(" ", "-") + "-" + String(Math.round(Math.random() * 1e9)));
                  const UUID = await GeneratorUUID();
                  const success = await CreateProduct(UUID, response.data.userid, productname, productsubtitle, productinformationHTML, productdescriptionHTML, productprice, productquantity, productcommand, req.files.icon[0].path, productpath);
                  if (success) {
                    const full_success = true;
                    Array.from(req.files.picture).forEach(async items => {
                      const picture_upload_success = await CreatePicture(UUID, items.path);
                      if (!picture_upload_success) {
                          full_success = false;
                      }
                    });
                    if (full_success) {
                      res.status(200).json({ status: true, message: `Đã tạo sản phẩm thành công! Sản phẩm đã được gửi đến quản trị viên chờ duyệt` });
                    }
                    else {
                      res.status(200).json({ status: false, message: `Lỗi trong quá trình lưu ảnh` });
                    }
                  }
                  else {
                    res.status(200).json({ status: false, message: `Lỗi khi tạo sản phẩm` });
                  }
              }
          }
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

  async function CreateProduct(productid, sellerid, producttitle, productsubtitle, productinformation, productcontent, productprice, productquantity , productcommand, producticonpath, productpath) {
    try {
      const result = await database.query(`INSERT INTO Product (productid, sellerid, producttitle, productsubtitle, information, productcontent, price, quantity, executeCommand, producticonpath, productpath, status) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [productid, sellerid, producttitle, productsubtitle, productinformation, productcontent, productprice, productquantity, productcommand, producticonpath, productpath, `<span class="badge text-bg-primary">Đang chờ duyệt</span>`]);
        return true;
    }
    catch (e) {
      return false;
    }
}

async function CreatePicture(productid, picturepath) {
  try {
    const result = await database.query(`INSERT INTO Picture (productid, picturepath) VALUE (?, ?)`, 
      [productid, picturepath]);
      return true;
  }
  catch (e) {
    return false;
  }
}

function parseMarkup(text) {
  const tags = {
    header: content => `<h4>${content}</h4>`,
    subheader: content => `<h5>${content}</h5>`,
    list: content => `<li>${content}</li>`,
    red: content => `<span class="red">${content}</span>`,
    green: content => `<span class="green">${content}</span>`,
    blue: content => `<span class="blue">${content}</span>`,
    aqua: content => `<span class="aqua">${content}</span>`,
    pink: content => `<span class="pink">${content}</span>`,
    yellow: content => `<span class="yellow">${content}</span>`,
    black: content => `<span class="black">${content}</span>`,
  };

  function processNestedTags(input) {
    const regex = /\[(\w+)\]((?:[^\[\]]|\[(?:(?!\]).)*\])*)\[\/\1\]/g;
    return input.replace(regex, (match, tag, content) => {
      if (tags[tag]) {
        return tags[tag](processNestedTags(content));
      }
      return match;
    });
  }

  const lines = text.split('\n');
  const processedLines = lines.map(line => processNestedTags(line.trim()));
  return processedLines.join('<br>\n');
}

function GeneratorUUID() {
  const randomBytes = crypto.randomBytes(16);
  const uuidString = v4({ uuid: randomBytes, random: randomBytes });
  return uuidString;
}

function removeDiacritics(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

module.exports = routes;