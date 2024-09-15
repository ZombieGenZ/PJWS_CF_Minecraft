const express = require("express");
const bodyParser = require("body-parser");
const path = require('path');
const axios = require("axios");
const config = require('./routes/config');

const port = 3000;

const app = express();

app.use(express.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.status(200);
    res.render("store");
});
app.get("/productpanagement", (req, res) => {
    res.status(200);
    res.render("productpanagement");
});
app.get("/censorproduct", (req, res) => {
    res.status(200);
    res.render("censorproduct");
});
app.get("/product", (req, res) => {
    res.status(200);
    res.render("store");
});
app.get("/product/:id", (req, res) => {
    res.status(200);
    axios.post(config.server_url + '/API/getproductdata')
    .then(async response => {
      if (response.data.status) {
        if (response.data.data !== null) {
            let success = false;
            response.data.data.forEach(items => {
                if(items.productpath == req.params.id || items.productid == req.params.id) {
                    success = true;
                    res.render("product", { productid: items.productid });
                }
            });
            if (!success) {
                res.render("404notfound");
            }
        }
        else {
            res.render("404notfound");
        }
      }
      else {
          res.render("404notfound");
      }
    })
    .catch(e => {
      console.error(e);
      res.render("404notfound");
    });
});
app.get("/purchasedproducts", (req, res) => {
    res.status(200);
    res.render("purchasedproducts");
});
app.get("/shoppingcart", (req, res) => {
    res.status(200);
    res.render("cart");
});
app.get("/profile", (req, res) => {
    res.status(200);
    res.render("profileme");
});
app.get("/profile/:id", (req, res) => {
    res.status(200);
    axios.post(config.server_url + '/API/getalluserdata')
    .then(async response => {
      if (response.data.status) {
        if (response.data.data !== null) {
            let success = false;
            response.data.data.forEach(items => {
                if(items.userid == req.params.id || items.username == req.params.id) {
                    if (items.penalty === null) {
                        res.render("profile", { userid: items.userid });
                    }
                    else {
                        axios.post(config.server_url + '/API/getpenalty', {
                            penaltyid: items.penalty
                            }, {
                                headers: {
                                'Content-Type': 'application/json'
                                }
                            })
                            .then(async responsegetPenalty => {
                                if (responsegetPenalty.data.status) {
                                    res.render("profilepunish", { userid: items.userid, message: `<p class="overflow-1">Người dùng <b>${items.username}</b> đã bị khóa tài khoản bở <a href="${responsegetPenalty.data.data.username}"><b>${responsegetPenalty.data.data.username}</b></a> vì lý do <span>${responsegetPenalty.data.data.penaltyreason}</span></p><p>lệnh trừng phạt #${responsegetPenalty.data.data.penaltyid} có hiệu lực từ <b>${formatDate(responsegetPenalty.data.data.penaltystart)}</b> đến <b>${formatDate(responsegetPenalty.data.data.penaltyend)}</b></p>` });
                                }
                                else {
                                    res.render("profile", { userid: items.userid });
                                }
                        })
                        .catch(e => {
                          console.error(e);
                          res.status(200).json({ status: false, message: e.toString() });
                        });
                    }
                    success = true;
                }
            });
            if (!success) {
                res.render("404notfound");
            }
        }
        else {
            res.render("404notfound");
        }
      }
      else {
          res.render("404notfound");
      }
    })
    .catch(e => {
      console.error(e);
      res.render("404notfound");
    });
});
app.get("/accountmanagement", (req, res) => {
    res.status(200);
    res.render("accountpanagement");
});
app.get("/forgetpassword/chanagepassword/:id", (req, res) => {
    res.status(200);
    axios.post(config.server_url + '/API/getotpdata')
    .then(async response => {
      if (response.data.status) {
        if (response.data.data !== null) {
            let success = false;
            response.data.data.forEach(items => {
                if(items.otpcode == req.params.id) {
                    success = true;
                    res.render("forgetpassword", { OTP: items.otpcode });
                }
            });
            if (!success) {
                res.render("404notfound");
            }
        }
        else {
            res.render("404notfound");
        }
      }
      else {
          res.render("404notfound");
      }
    })
    .catch(e => {
      console.error(e);
      res.render("404notfound");
    });
});
app.get("/paymentgateway", (req, res) => {
    res.status(200);
    res.render("paymentgateway");
});

const registerAPIRoutes = require("./routes/register");
const authenticationAccountAPIRoutes = require("./routes/authentication");
const authenticationPermissionAPIRoutes = require("./routes/authenticationpermission");
const createProductAPIRoutes = require("./routes/createproduct");
const getAllProductDataAPIRoutes = require("./routes/getallproductdata");
const editProductAPIRoutes = require("./routes/editproduct");
const deleteProductAPIRoutes = require("./routes/deleteproduct");
const searchProductManagementAPIRoutes = require("./routes/searchproductmanagement");
const getPictureAPIRoutes = require("./routes/getpicture");
const chanageProductStatusAPIRoutes = require("./routes/chanageProductStatus");
const getProductDataAPIRoutes = require("./routes/getproductdata");
const getProductDataViewAPIRoutes = require("./routes/getproductdataview");
const buyProductAPIRoutes = require("./routes/buyproduct");
const checkBuyAPIRoutes = require("./routes/checkbuy");
const checkEvaluateAPIRoutes = require("./routes/checkevaluate");
const createEvaluateAPIRoutes = require("./routes/createevaluate");
const getEvaluateDataAPIRoutes = require("./routes/getevaluatedata");
const editEvaluateAPIRoutes = require("./routes/editevaluate");
const deleteEvaluateAPIRoutes = require("./routes/deleteevaluate");
const addToCartAPIRoutes = require("./routes/addtocart");
const getPurchaseHistoryDataAPIRoutes = require("./routes/getpurchasehistorydata");
const searchPurchaseHistoryDataAPIRoutes = require("./routes/searchpurchasehistorydata");
const getCartDataAPIRoutes = require("./routes/getcartdata");
const searchCartDataAPIRoutes = require("./routes/searchcartdata");
const buyProductCartAPIRoutes = require("./routes/buyproductcart");
const SearchProductDataAPIRoutes = require("./routes/searchproductdata");
const getUserAPIRoutes = require("./routes/getuser");
const getUserDataAPIRoutes = require("./routes/getuserdata");
const chanageAvatarAPIRoutes = require("./routes/chanageAvatar");
const chanageUsernameAPIRoutes = require("./routes/chanageusername");
const chanageEmailAPIRoutes = require("./routes/chanageemail");
const chanagePasswordAPIRoutes = require("./routes/chanagepassword");
const chanageBioAPIRoutes = require("./routes/chanagebio");
const getAllUserDataAPIRoutes = require("./routes/getalluserdata");
const getUserDataNonAccountAPIRoutes = require("./routes/getuserdatanonaccount");
const getAllAccountDataAPIRoutes = require("./routes/getallaccountdata");
const chanageMoneyAPIRoutes = require("./routes/chanagemoney");
const chanagePermissionAPIRoutes = require("./routes/chanagepermission");
const getPenaltyAPIRoutes = require("./routes/getpenalty");
const createPenaltyAPIRoutes = require("./routes/createpenalty");
const deletePenaltyAPIRoutes = require("./routes/deletepenalty");
const sendEmailAPIRoutes = require("./routes/sendemail");
const searchAllAccountDataAPIRoutes = require("./routes/searchallaccountdata");
const createOTPAPIRoutes = require("./routes/createotp");
const getOTPDataOTPAPIRoutes = require("./routes/getotpdata");
const chanagePasswordOTPAPIRoutes = require("./routes/chanagepasswordotp");
const getBuyLogAPIRoutes = require("./routes/getbuylog");
const editProductDiscountAPIRoutes = require("./routes/editproductdiscount");
const getQRAPIRoutes = require("./routes/getqr");
const checkPenaltyAPIRoutes = require("./routes/checkpenalty");
const executeCommandAPIRoutes = require("./routes/executecommand");

app.use('/API/register', registerAPIRoutes);
app.use('/API/authentication', authenticationAccountAPIRoutes);
app.use('/API/authenticationpermission', authenticationPermissionAPIRoutes);
app.use('/API/createroduct', createProductAPIRoutes);
app.use('/API/getallproductdata', getAllProductDataAPIRoutes);
app.use('/API/editproduct', editProductAPIRoutes);
app.use('/API/deleteproduct', deleteProductAPIRoutes);
app.use('/API/searchproductmanagement', searchProductManagementAPIRoutes);
app.use('/API/getpicture', getPictureAPIRoutes);
app.use('/API/chanageproductstatus', chanageProductStatusAPIRoutes);
app.use('/API/getproductdata', getProductDataAPIRoutes);
app.use('/API/getproductdataview', getProductDataViewAPIRoutes);
app.use('/API/buyproduct', buyProductAPIRoutes);
app.use('/API/checkbuy', checkBuyAPIRoutes);
app.use('/API/checkevaluate', checkEvaluateAPIRoutes);
app.use('/API/createevaluate', createEvaluateAPIRoutes);
app.use('/API/getevaluatedata', getEvaluateDataAPIRoutes);
app.use('/API/editevaluate', editEvaluateAPIRoutes);
app.use('/API/deleteevaluate', deleteEvaluateAPIRoutes);
app.use('/API/addtocart', addToCartAPIRoutes);
app.use('/API/getpurchasehistorydata', getPurchaseHistoryDataAPIRoutes);
app.use('/API/searchpurchasehistorydata', searchPurchaseHistoryDataAPIRoutes);
app.use('/API/getcartdata', getCartDataAPIRoutes);
app.use('/API/searchcartdata', searchCartDataAPIRoutes);
app.use('/API/buyproductcart', buyProductCartAPIRoutes);
app.use('/API/searchproductdata', SearchProductDataAPIRoutes);
app.use('/API/getuser', getUserAPIRoutes);
app.use('/API/getuserdata', getUserDataAPIRoutes);
app.use('/API/chanageavatar', chanageAvatarAPIRoutes);
app.use('/API/chanageusername', chanageUsernameAPIRoutes);
app.use('/API/chanageemail', chanageEmailAPIRoutes);
app.use('/API/chanagepassword', chanagePasswordAPIRoutes);
app.use('/API/chanagebio', chanageBioAPIRoutes);
app.use('/API/getalluserdata', getAllUserDataAPIRoutes);
app.use('/API/getuserdatanonaccount', getUserDataNonAccountAPIRoutes);
app.use('/API/getallaccountdata', getAllAccountDataAPIRoutes);
app.use('/API/chanagemoney', chanageMoneyAPIRoutes);
app.use('/API/chanagepermission', chanagePermissionAPIRoutes);
app.use('/API/getpenalty', getPenaltyAPIRoutes);
app.use('/API/createpenalty', createPenaltyAPIRoutes);
app.use('/API/deletepenalty', deletePenaltyAPIRoutes);
app.use('/API/sendemail', sendEmailAPIRoutes);
app.use('/API/searchallaccountdata', searchAllAccountDataAPIRoutes);
app.use('/API/createotp', createOTPAPIRoutes);
app.use('/API/getotpdata', getOTPDataOTPAPIRoutes);
app.use('/API/chanagepasswordotp', chanagePasswordOTPAPIRoutes);
app.use('/API/getbuylog', getBuyLogAPIRoutes);
app.use('/API/editproductdiscount', editProductDiscountAPIRoutes);
app.use('/API/getqr', getQRAPIRoutes);
app.use('/API/checkpenalty', checkPenaltyAPIRoutes);
app.use('/API/executecommand', executeCommandAPIRoutes);

app.use((req, res, next) => {
    res.status(404).render("404notfound");
});

function formatDate(date) {
    const now = new Date(date);
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
  
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  }

app.listen(port);