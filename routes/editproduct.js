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
  console.log("API edit product successfully connected to the server");
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
          productname,
          productsubtitle,
          productdescription,
          productprice,
          productquantity,
          productcommand
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
      if (response.data.permission.acceptproductmanagement || response.data.permission.acceptproductmanagementall) {
        if (productid == "" || productname === "" || productsubtitle === "" || productdescription === "" || productprice === ""  || productquantity === "" || productcommand === "") {
          res.status(200).json({ status: false, message: "Bạn cần điền đầy đủ thông tin" });
          return;
        }
        else {
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
                if (response.data.permission.acceptproductmanagementall) {
                  let productpath = "";
                  const productData = await GetProducteData(productid);
                  productpath = await productname !== productData.producttitle ? await removeDiacritics(productname.replace(" ", "-") + "-" + String(Math.round(Math.random() * 1e9))) : "";
                  let productdescriptionHTML = await parseMarkup(productdescription);
                  if (productpath !== "") {
                    const success = await EditProduct(productid, productname, productsubtitle, productdescriptionHTML, productprice, productquantity, productcommand, productpath);
                    if (success) {
                      res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                    }
                    else {
                      res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                    }
                  }
                  else {
                    const success = await EditProduct_NoPath(productid, productname, productsubtitle, productdescriptionHTML, productprice, productquantity, productcommand);
                    if (success) {
                      res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                    }
                    else {
                      res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                    }
                  }
                }
                else {
                  const isAuthor = await CheckAuthor(response.data.userid, productid);
                  if (isAuthor) {
                    let productpath = "";
                    const productData = await GetProducteData(productid);
                    productname !== productData.producttitle ? productpath =  await removeDiacritics(productname.replace(" ", "-") + "-" + String(Math.round(Math.random() * 1e9))) : "";
                    let productdescriptionHTML = await parseMarkup(productdescription);
                    if (productpath !== "") {
                      const success = await EditProduct(productid, productname, productsubtitle, productdescriptionHTML, productprice, productquantity, productcommand, productpath);
                      if (success) {
                        res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                      }
                      else {
                        res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                      }
                    }
                    else {
                      const success = await EditProduct_NoPath(productid, productname, productsubtitle, productdescriptionHTML, productprice, productquantit, productcommandy);
                      if (success) {
                        res.status(200).json({ status: true, message: `Đã cập nhật thông tin sản phẩm thành công!` });
                      }
                      else {
                        res.status(200).json({ status: false, message: `Lỗi khi cập nhật thông tin sản phẩm` });
                      }
                    }
                    }
                  else {
                    res.status(200).json({ status: false, message: `Bạn không có quyền thực hiện điều này` });
                  }
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

  async function EditProduct(productid, producttitle, productsubtitle, productcontent, productprice, productquantity, productcommand, productpath) {
    try {
      const result = await database.query(`UPDATE Product SET producttitle = ?, productsubtitle = ?, productcontent = ?, price = ?, quantity = ?, productpath = ?, executecommand = ? WHERE productid = ?`, 
        [ producttitle, productsubtitle, productcontent, productprice, productquantity, productpath, productcommand, productid ]);
        return true;
    }
    catch (e) {
      return false;
    }
}

async function EditProduct_NoPath(productid, producttitle, productsubtitle, productcontent, productprice, productquantity, productcommand) {
  try {
    const result = await database.query(`UPDATE Product SET producttitle = ?, productsubtitle = ?, productcontent = ?, price = ?, quantity = ?, executecommand = ? WHERE productid = ?`, 
      [ producttitle, productsubtitle, productcontent, productprice, productquantity, productcommand, productid ]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function CheckAuthor(userid, productid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT sellerid FROM Product WHERE productid = ?`, [productid], (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res[0].sellerid == userid);
      }
    });
  });
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

function removeDiacritics(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

async function GetProducteData(productid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Product WHERE productid = ?`, [productid], (err, res) => {
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