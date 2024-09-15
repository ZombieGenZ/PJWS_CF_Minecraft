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
    console.log("API buy product cart successfully connected to the server");
});

const routes = express.Router();
routes.use(cors());
routes.use(express.json());
routes.use(bodyParser.urlencoded({ extended: true }));



routes.post("/", async (req, res) => {
    let { username, password, productid, quantity, cartid } = req.body;
    username = await normalizeString(username);
    password = await normalizeString(password);

    try {
        if (quantity > 0) {
          axios.post(config.server_url + '/API/authenticationpermission', {
            username: username,
            password: password
        }, {
            headers: {
              'Content-Type': 'application/json'
            }
        })
        .then(async responseUser => {
          if (responseUser.data.status) {
                axios.post(config.server_url + '/API/getproductdata')
                .then(async responseProduct => {
                  if (responseProduct.data.status) {
                    let success = false;
                    if (cartid !== "" && cartid !== undefined && cartid !== null) {
                      const exitsCart = GetCartData(cartid);
                      if (exitsCart) {
                        responseProduct.data.data.forEach(async items => {
                          if(items.productid == productid) {
                            if (items.discount !== 0 && (items.discountcount - quantity) >= 0) {
                              const totalPrice = (items.price - ((items.price / 100) * items.discount)) * quantity;
                              if (responseUser.data.money >= totalPrice) {
                                if ((items.quantity - quantity) >= 0) {
                                  const TAX = 15 / 100; // 15%
                                  const totalRevenue = totalPrice - (totalPrice * TAX);
                                  const success = await CreatePurchaseHistory(responseUser.data.userid, items.productid, totalPrice, quantity);
                                  const success_updatemoney = await UpdateUserMoney(responseUser.data.userid, totalPrice);
                                  const success_updateproduct = await UpdateProductData(productid, quantity);
                                  const success_updaterevenue = await UpdateUserRevenue(totalRevenue, items.sellerid);
                                  const success_deletecart = await DeleteCart(cartid);
                                  await SendEmail(responseUser.data.email, quantity, items.producttitle, totalPrice)
                                  if (success && success_updatemoney && success_updateproduct && success_updaterevenue && success_deletecart) {
                                    res.status(200).json({ status: true, message: "Mua sản phẩm thành công!" });
                                    return;
                                  }
                                  else {
                                    res.status(200).json({ status: false, message: "Lỗi khi mua sản phẩm!" });
                                    return;
                                  }
                                }
                                else {
                                  res.status(200).json({ status: false, message: "Số lượng sản phẩm còn lại không đủ!" });
                                }
                              }
                              else {
                                res.status(200).json({ status: false, message: "Số dư không đủ" });
                                return;
                              }
                            }
                            else {
                              if (items.discount == 0) {
                                const totalPrice = items.price * quantity;
                                if (responseUser.data.money >= totalPrice) {
                                  if ((items.quantity - quantity) >= 0) {
                                    const TAX = 15 / 100; // 15%
                                    const totalRevenue = totalPrice - (totalPrice * TAX);
                                    const success = await CreatePurchaseHistory(responseUser.data.userid, items.productid, totalPrice, quantity);
                                    const success_updatemoney = await UpdateUserMoney(responseUser.data.userid, totalPrice);
                                    const success_updateproduct = await UpdateProductData_NoSale(productid, quantity);
                                    const success_updaterevenue = await UpdateUserRevenue(totalRevenue, items.sellerid);
                                    const success_deletecart = await DeleteCart(cartid);
                                    await SendEmail(responseUser.data.email, quantity, items.producttitle, totalPrice)
                                    if (success && success_updatemoney && success_updateproduct && success_updaterevenue && success_deletecart) {
                                      res.status(200).json({ status: true, message: "Mua sản phẩm thành công!" });
                                      return;
                                    }
                                    else {
                                      res.status(200).json({ status: false, message: "Lỗi khi mua sản phẩm!" });
                                      return;
                                    }
                                  }
                                  else {
                                    res.status(200).json({ status: false, message: "Số lượng sản phẩm còn lại không đủ!" });
                                  }
                                }
                                else {
                                  res.status(200).json({ status: false, message: "Số dư không đủ" });
                                  return;
                                }
                              }
                              else {
                                res.status(200).json({ status: false, message: "Số lượng sản phẩm giảm giá không đủ" });
                              }
                            }
                          }
                        });
                      }
                      else {
                        res.status(200).json({ status: false, message: "Không tìm thấy thông tin của giỏ hàng" });
                      }
                    }
                    else {
                      res.status(200).json({ status: false, message: "Vui lòng điền đầy đủ thông tin" });
                    }
                  }
                  else {
                      res.status(200).json({ status: false, message: "Không thể tìm thấy sản phẩm được chỉ định" });
                  }
                })
                .catch(e => {
                  console.error(e);
                  res.status(200).json({ status: false, message: "Lỗi khi lấy dử liệu sản phẩm" });
                });
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
        else {
          res.status(200).json({ status: false, message: "Số lượng phải lớn hơn 0" });
        }
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

async function CreatePurchaseHistory(userid, productid, totalprice, totalquantity) {
  try {
    const result = await database.query(`INSERT INTO PurchaseHistory (userid, productid, totalprice, totalquantity) VALUE (?, ?, ?, ?)`, 
      [userid, productid, totalprice, totalquantity]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function UpdateProductData(productid, quantity) {
  try {
    const result = await database.query(`UPDATE Product SET quantity = quantity - ?, totalsold = totalsold + ?, discountcount = discountcount - ? WHERE productid = ?`, 
      [quantity, quantity, quantity, productid]);
      return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}
async function UpdateProductData_NoSale(productid, quantity) {
  try {
    const result = await database.query(`UPDATE Product SET quantity = quantity - ?, totalsold = totalsold + ? WHERE productid = ?`, 
      [quantity, quantity, productid]);
      return true;
  }
  catch (e) {
    console.error(e);
    return false;
  }
}

async function UpdateUserMoney(userid, total) {
  try {
    const result = await database.query(`UPDATE Account SET money = money - ? WHERE userid = ?`, 
      [total, userid]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function UpdateUserRevenue(total, userid) {
  try {
    const result = await database.query(`UPDATE Account SET revenue = revenue + ? WHERE userid = ?`, 
      [total, userid]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function GetCartData(cartid) {
  return new Promise((resolve, reject) => {
    database.query(`SELECT * FROM Cart WHERE cartid = ?`, [cartid], (err, res) => {
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

async function DeleteCart(cartid) {
  try {
    const result = await database.query(`DELETE FROM Cart WHERE cartid = ?`, 
      [cartid]);
      return true;
  }
  catch (e) {
    return false;
  }
}

async function SendEmail(email, productquantity, productname, productprice) {
  try {
    let text = `HÓA ĐƠN\n==============================\n\nTên | Giá\n------------------------------\nx${productquantity} ${productname} | ${productprice.toLocaleString('de-DE')} VND\n------------------------------\nTỔNG TIỀN: ${productprice.toLocaleString('de-DE')} VND\n\n==============================\n\nXin chân thành cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!\n\nNếu bạn có bất kỳ câu hỏi nào, xin vui lòng liên hệ:\nEmail: ${config.contact_email} | SĐT: ${config.contact_mobile}\n`;
    let HTML = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 15px; box-shadow: 0 0 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <div style="background-color: #4a154b; color: #ffffff; text-align: center; padding: 20px;">
                      <h1 style="margin: 0; font-size: 28px; letter-spacing: 2px;">HÓA ĐƠN</h1>
                  </div>
                  <div style="padding: 20px;">
                      <table style="width: 100%; border-collapse: collapse;">
                          <thead>
                              <tr>
                                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold; color: #4a154b;">Sản phẩm</th>
                                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0; background-color: #f5f5f5; font-weight: bold; color: #4a154b;">Giá</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr>
                                  <td style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">x${productquantity} ${productname}</td>
                                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">${productprice.toLocaleString('de-DE')} VND</td>
                              </tr>
                          </tbody>
                      </table>
                      <div style="text-align: right; font-weight: bold; font-size: 18px; color: #4a154b; margin-top: 20px;">
                          TỔNG TIỀN: ${productprice.toLocaleString('de-DE')} VND
                      </div>
                  </div>
                  <div style="background-color: #f5f5f5; text-align: center; padding: 15px; font-size: 14px; color: #666;">
                      <p style="margin: 5px 0;">Xin chân thành cảm ơn quý khách đã tin tưởng và ủng hộ chúng tôi!</p>
                      <p style="margin: 5px 0;">Nếu quý khách hàng có bất kỳ câu hỏi nào, xin vui lòng liên hệ:</p>
                      <p style="margin: 5px 0;">
                          Email: <a href="mailto:${config.contact_email}" style="color: #4a154b; text-decoration: none;">${config.contact_email}</a> | 
                          SĐT: <a href="tel:${config.contact_mobile}" style="color: #4a154b; text-decoration: none;">${config.contact_mobile}</a>
                      </p>
                  </div>
              </div>`;
    axios.post(config.server_url + '/API/sendemail', {
      to: email,
      subject: `Hóa đơn giao dịch khi mua sản phẩm ${productname}`,
      text: text,
      html: HTML
  }, {
      headers: {
        'Content-Type': 'application/json'
      }
  })
    .then(async responseEmail => {
    return true;
  })
  .catch(e => {
    console.error(e);
    res.status(200).json({ status: false, message: e.toString() });
  });
  }
  catch (e) {
    return false;
  }
}

module.exports = routes;