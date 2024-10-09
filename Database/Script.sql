DROP DATABASE IF EXISTS PJWS_MC;
CREATE DATABASE PJWS_MC;

USE PJWS_MC;

CREATE TABLE Account (
	userid INT NOT NULL AUTO_INCREMENT UNIQUE,
	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	password TEXT NOT NULL,
	money DECIMAL(15,3) NOT NULL DEFAULT 0 CHECK(money >= 0),
	revenue DECIMAL(15,3) NOT NULL DEFAULT 0 CHECK(revenue >= 0),
	avatarpath TEXT NOT NULL DEFAULT "public\\image\\system\\default_user.png",
	Verify BOOLEAN NOT NULL DEFAULT false,
	createtime DATETIME NOT NULL DEFAULT NOW(),
	permissionid VARCHAR(255) NOT NULL DEFAULT 'member',
	bio VARCHAR(255),
	penalty INT,
	PRIMARY KEY(userid)
);

ALTER TABLE Account AUTO_INCREMENT = 10000000;

CREATE TABLE Permission (
	permissionname VARCHAR(255) NOT NULL UNIQUE,
	acceptproductmanagement BOOLEAN NOT NULL DEFAULT false,
	acceptproductmanagementall BOOLEAN NOT NULL DEFAULT false,
	acceptcensorproduct BOOLEAN NOT NULL DEFAULT false,
	acceptaccountmanagement BOOLEAN NOT NULL DEFAULT false,
	acceptreportmanagement BOOLEAN NOT NULL DEFAULT false,
	acceptpostmanagement BOOLEAN NOT NULL DEFAULT false,
	acceptcensorpost BOOLEAN NOT NULL DEFAULT false,
	PRIMARY KEY(permissionname)
);

CREATE TABLE Product (
	productid VARCHAR(255) NOT NULL UNIQUE,
	sellerid VARCHAR(255) NOT NULL,
	producttitle VARCHAR(255) NOT NULL,
	productsubtitle VARCHAR(255) NOT NULL,
	information TEXT,
	productcontent TEXT NOT NULL,
	price DECIMAL(15,3) NOT NULL CHECK(price > 0),
	quantity INT NOT NULL CHECK(quantity >= 0),
	producticonpath TEXT(255) NOT NULL,
	productpath VARCHAR(255) NOT NULL,
	createtime DATETIME NOT NULL DEFAULT NOW(),
	status VARCHAR(255) NOT NULL,
    totalsold INT NOT NULL DEFAULT 0 CHECK(totalsold >= 0),
    ratingstar DECIMAL(2, 1) NOT NULL DEFAULT 0,
    EvaluateTotal INT NOT NULL DEFAULT 0,
    discount INT NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    discountcount INT NOT NULL DEFAULT 0 CHECK (discountcount >= 0),
	PRIMARY KEY(productid)
);

CREATE TABLE Cart (
	cartid INT NOT NULL AUTO_INCREMENT UNIQUE,
	userid INT NOT NULL,
	productid VARCHAR(255) NOT NULL,
	PRIMARY KEY(cartid)
);

CREATE TABLE Penalty (
	penaltyid INT NOT NULL AUTO_INCREMENT UNIQUE,
	penaltyreason VARCHAR(255) NOT NULL,
	penaltystart DATETIME NOT NULL,
	penaltyend DATETIME NOT NULL,
	penaltyby INT NOT NULL,
	PRIMARY KEY(penaltyid)
);

CREATE TABLE PurchaseHistory (
	historyid INT NOT NULL AUTO_INCREMENT UNIQUE,
	userid INT NOT NULL,
	productid VARCHAR(255) NOT NULL,
	totalprice DECIMAL(15,3) NOT NULL CHECK(totalprice >= 0),
	totalquantity INT NOT NULL CHECK(totalquantity >= 0),
	createtime DATE NOT NULL DEFAULT NOW(),
    received BOOLEAN NOT NULL DEFAULT false,
	PRIMARY KEY(historyid)
);

CREATE TABLE Evaluate (
	evaluateid INT NOT NULL AUTO_INCREMENT UNIQUE,
	userid INT NOT NULL,
	productid VARCHAR(255) NOT NULL,
	rating DECIMAL(2,1) NOT NULL CHECK(rating >= 1 AND rating <= 5),
	comment TEXT,
	createtime DATETIME DEFAULT NOW(),
	PRIMARY KEY(evaluateid)
);

CREATE TABLE Picture (
	pictureid INT NOT NULL AUTO_INCREMENT UNIQUE,
	productid VARCHAR(255) NOT NULL,
	picturepath TEXT NOT NULL,
	PRIMARY KEY(pictureid)
);

CREATE TABLE OTP (
	otpid INT NOT NULL AUTO_INCREMENT UNIQUE,
	otpcode VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL,
	PRIMARY KEY(otpid)
);

CREATE TABLE ReportUser (
	reportid INT NOT NULL AUTO_INCREMENT UNIQUE,
	sender INT NOT NULL,
	userid INT NOT NULL,
    message VARCHAR(256) DEFAULT 'Không có lý do',
	createtime DATETIME NOT NULL DEFAULT NOW(),
	PRIMARY KEY(reportid)
);

CREATE TABLE ReportProduct (
	reportid INT NOT NULL AUTO_INCREMENT UNIQUE,
	sender INT NOT NULL,
	productid VARCHAR(255) NOT NULL,
    message VARCHAR(256) DEFAULT 'Không có lý do',
	createtime DATETIME NOT NULL DEFAULT NOW(),
	PRIMARY KEY(reportid)
);

CREATE TABLE ReportPost (
	reportid INT NOT NULL AUTO_INCREMENT UNIQUE,
	sender INT NOT NULL,
	postid INT NOT NULL,
    message VARCHAR(256) DEFAULT 'Không có lý do',
	createtime DATETIME NOT NULL DEFAULT NOW(),
	PRIMARY KEY(reportid)
);

CREATE TABLE Post (
	postid INT NOT NULL AUTO_INCREMENT UNIQUE,
	userid INT NOT NULL,
	posttitle VARCHAR(255) NOT NULL,
	postcontent TEXT NOT NULL,
	postpath VARCHAR(255) NOT NULL,
	createtime DATETIME NOT NULL DEFAULT NOW(),
	status VARCHAR(255) NOT NULL,
    notification BOOLEAN NOT NULL DEFAULT false,
    acceptcomment BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY(postid)
);

CREATE TABLE Comment (
	commentid INT NOT NULL AUTO_INCREMENT UNIQUE,
	userid INT NOT NULL,
	postid INT NOT NULL,
	comment TEXT,
	createtime DATETIME DEFAULT NOW(),
	PRIMARY KEY(commentid)
);

ALTER TABLE Account
ADD FOREIGN KEY(permissionid) REFERENCES Permission(permissionname)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Cart
ADD FOREIGN KEY(userid) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Cart
ADD FOREIGN KEY(productid) REFERENCES Product(productid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Account
ADD FOREIGN KEY(penalty) REFERENCES Penalty(penaltyid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE PurchaseHistory
ADD FOREIGN KEY(productid) REFERENCES Product(productid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE PurchaseHistory
ADD FOREIGN KEY(userid) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Picture
ADD FOREIGN KEY(productid) REFERENCES Product(productid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Evaluate
ADD FOREIGN KEY(productid) REFERENCES Product(productid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Evaluate
ADD FOREIGN KEY(userid) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE OTP
ADD FOREIGN KEY(email) REFERENCES Account(email)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ReportUser
ADD FOREIGN KEY(sender) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ReportProduct
ADD FOREIGN KEY(sender) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ReportPost
ADD FOREIGN KEY(sender) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ReportProduct
ADD FOREIGN KEY(productid) REFERENCES Product(productid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE ReportPost
ADD FOREIGN KEY(postid) REFERENCES Post(postid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Post
ADD FOREIGN KEY(userid) REFERENCES Account(userid)
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE Comment
ADD FOREIGN KEY(postid) REFERENCES Post(postid)
ON UPDATE NO ACTION ON DELETE NO ACTION;

-- member permission
INSERT INTO Permission (permissionname)
VALUE ("member");

-- seller permission
INSERT INTO Permission (permissionname, acceptproductmanagement)
VALUE ("seller", true);

-- active moderator permission
INSERT INTO Permission (permissionname, acceptproductmanagement, acceptcensorproduct, acceptcensorpost)
VALUE ("moderator", true, true, true);

-- developer permission
INSERT INTO Permission (permissionname, acceptproductmanagement, acceptproductmanagementall)
VALUE ("developer", true, true);

-- active admim permission
INSERT INTO Permission (permissionname, acceptproductmanagement, acceptproductmanagementall, acceptcensorproduct, acceptaccountmanagement, acceptreportmanagement, acceptpostmanagement, acceptcensorpost)
VALUE ("admin", true, true, true, true, true, true, true);


DELIMITER //

CREATE TRIGGER update_product_rating_after_insert
AFTER INSERT ON Evaluate
FOR EACH ROW
BEGIN
    UPDATE Product
    SET ratingstar = (
        SELECT AVG(rating)
        FROM Evaluate
        WHERE productid = NEW.productid
    ),
    EvaluateTotal = EvaluateTotal + 1
    WHERE productid = NEW.productid;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER update_product_rating_after_delete
AFTER DELETE ON Evaluate
FOR EACH ROW
BEGIN
    UPDATE Product
    SET ratingstar = COALESCE(
        (SELECT AVG(rating)
         FROM Evaluate
         WHERE productid = OLD.productid),
        0
    ),
    EvaluateTotal = GREATEST(EvaluateTotal - 1, 0)
    WHERE productid = OLD.productid;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER update_product_rating_after_update
AFTER UPDATE ON Evaluate
FOR EACH ROW
BEGIN
    IF OLD.productid <> NEW.productid OR OLD.rating <> NEW.rating THEN
        UPDATE Product
        SET ratingstar = COALESCE(
            (SELECT AVG(rating)
             FROM Evaluate
             WHERE productid = OLD.productid),
            0
        )
        WHERE productid = OLD.productid;
        
        UPDATE Product
        SET ratingstar = (
            SELECT AVG(rating)
            FROM Evaluate
            WHERE productid = NEW.productid
        )
        WHERE productid = NEW.productid;
    END IF;
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER update_discount_on_product
BEFORE UPDATE ON Product
FOR EACH ROW
BEGIN
    IF NEW.discountcount = 0 THEN
        SET NEW.discount = 0;
    END IF;
END //

DELIMITER ;

SELECT * FROM Account;
SELECT * FROM Permission;
SELECT * FROM Picture;
SELECT * FROM Product;
SELECT * FROM Cart;
SELECT * FROM Penalty;
SELECT * FROM PurchaseHistory;
SELECT * FROM Evaluate;
SELECT * FROM OTP;
SELECT * FROM ReportUser;
SELECT * FROM ReportProduct;
SELECT * FROM ReportPost;
SELECT * FROM Post;
SELECT * FROM Comment;