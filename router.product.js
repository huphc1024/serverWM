const express = require('express');
const app = express();
const productRouter = express.Router();
const flectData = require('./service/flectdata-amz');
let Product = require('./model/Product');
let ObjectID = require('mongodb').ObjectID;
let Timestamp = require('mongodb').Timestamp;
const syncAllData = require('./service/cronjob_sync');
productRouter.route('/find').post(function (req, res) {
  let link_amz = req.body.link_product;
  let asinList = link_amz.match(/\/dp\/(.*?)\//s);
  let asin;
  if (!asinList || asinList.length < 2) {
    asin = 'Nothing';
  } else {
    asin = asinList[1];
  }
  let product = {
    link_product: link_amz,
    asin_product: asin
  }
  flectData(link_amz).then(rs => {
    product.name_amz = rs.title;
    product.image_list = rs.image_list;
    product.description = rs.description;
    product.price = rs.price;
    product.availability = rs.availability;
    if (rs.asin) {
      product.asin_product = rs.asin;
    }
    res.status(200).json(product);
  });
});
productRouter.route('/list').get(function (req, res) {
  let perPage = 20; // số lượng sản phẩm xuất hiện trên 1 page
  let page = req.query.page || 1;
  let title = req.query.title;
  let account = req.query.account;
  let checked = req.query.checked;
  let status = req.query.status;
  let stock = req.query.stock;
  let objSearch = {

  }
  if (title) {
    objSearch.title = new RegExp(decodeURIComponent(title), 'i');
  }
  if (account) {
    objSearch.account = account;
  }
  if (checked) {
    objSearch.checked = checked;
  }
  if (status) {
    objSearch.status = status;
  }
  if (stock) {
    objSearch.stock = objSearch.stock;
  }

  Product
    .find(objSearch).sort({ create_time: -1 }) // find tất cả các data
    .skip((perPage * page) - perPage) // Trong page đầu tiên sẽ bỏ qua giá trị là 0
    .limit(perPage)
    .exec((err, products) => {
      Product.countDocuments(objSearch, (err, count) => { // đếm để tính có bao nhiêu trang
        if (err) return next(err);
        res.status(200).json({
          products: products, current: page, // page hiện tại
          pages: Math.ceil(count / perPage),
          total: count
        }) // Trả về dữ liệu các sản phẩm theo định dạng như JSON, XML,...
      });
    });
});
productRouter.route('/add').post(function (req, res) {
  let prd = req.body.product;
  const newprd = new Product();
  newprd._id = new ObjectID();
  newprd.title = prd.title;
  newprd.link = prd.link;
  newprd.image = prd.image;
  newprd.current_price = prd.current_price
  newprd.last_price = prd.last_price
  newprd.ebay_price = prd.ebay_price;
  newprd.stock = prd.stock;
  newprd.checked = prd.checked;
  newprd.status = prd.status;
  newprd.account = prd.account;
  newprd.last_checked = prd.last_checked;
  newprd.last_update = prd.last_update;
  newprd.create_time = prd.create_time;
  newprd.save();
  res.status(200).json(newprd);
});
productRouter.route('/import-prd').post(function (req, res) {
  let prds = req.body.products;
  importData(prds, 0, res);

});
function importData(listProduct, idx, res) {
  if (idx < listProduct.length) {
    let prd = listProduct[idx];

    flectData(prd.link).then(rs => {
      const newprd = new Product();
      newprd._id = new ObjectID();
      newprd.stock = rs.availability;
      newprd.current_price = rs.price;
      newprd.last_price = newprd.current_price;
      newprd.title = prd.title || rs.name_amz;
      newprd.link = prd.link;
      newprd.image = rs.image_list[0];
      newprd.status = '1';
      newprd.ebay_price = prd.ebay_price;
      newprd.account = prd.account;
      newprd.last_checked = prd.last_checked;
      newprd.last_update = prd.last_update;
      newprd.create_time = prd.create_time;
      newprd.save();
      setTimeout(() => {
        idx++;
        importData(listProduct, idx, res);
      }, 3000)

    }).catch(err => {
      const newprd = new Product();
      newprd._id = new ObjectID();
      newprd.status = '0';
      newprd.title = prd.title;
      newprd.link = prd.link;
      newprd.ebay_price = prd.ebay_price;
      newprd.account = prd.account;
      newprd.last_checked = prd.last_checked;
      newprd.last_update = prd.last_update;
      newprd.create_time = prd.create_time;
      newprd.save();
      setTimeout(() => {
        idx++;
        importData(listProduct, idx, res);
      }, 3000)
    });
  } else {
    res.status(200).json('OK');
  }
}
productRouter.route('/update').post(function (req, res) {
  let prd = req.body.product;
  Product.findById({ _id: new ObjectID(prd._id) }).then(doc => {
    let newprd = doc;
    newprd.ebay_price = prd.ebay_price;
    newprd.checked = '1';
    newprd.status = '1';
    newprd.account = prd.account;
    newprd.last_checked = prd.last_checked;
    newprd.last_update = prd.last_update;
    newprd.save();
    res.status(200).json(newprd);
  }).catch(err => {
    res.status(400).jsonp(err);
  });
});
productRouter.route('/resync-all').get(function (req, res) {
  syncAllData();
  res.status(200).json('');
});
productRouter.route('/delete').post(function (req, res) {
  Product.collection.deleteOne({ _id: new ObjectID(req.body._id) });
  res.status(200).json('');
});
productRouter.route('/re-sync').post(function (req, res) {
  Product.findById({ _id: new ObjectID(req.body._id) }).then(doc => {
    let prd = doc;
    flectData(prd.link).then(rs => {
      let check;
      check = rs.availability == '0';
      prd.stock = rs.availability;
      if (!check) check = prd.current_price != rs.price;
      prd.last_price = prd.current_price;
      prd.current_price = rs.price;
      prd.status = '1';
      prd.last_update = formatDateTime(new Date());
      prd.save();
      res.status(200).jsonp(prd);
    });
  })
    .catch(err => {
      res.status(400).jsonp(err);
    });
});
productRouter.route('/check-prd').post(function (req, res) {
  Product.findById({ _id: new ObjectID(req.body._id) }).then(doc => {
    let prd = doc;
    prd.checked = '1';
    prd.save();
    res.status(200).jsonp(prd);

  })
    .catch(err => {
      res.status(400).jsonp(err);
    });
});
productRouter.route('/find-prd').post(function (req, res) {
  Product.findById({ _id: new ObjectID(req.body._id) }).then(doc => {
    res.status(200).jsonp(doc);

  })
    .catch(err => {
      res.status(400).jsonp(err);
    });
});
module.exports = productRouter;
function formatDateTime(date) {
  var d = new Date(date);
  var yyyy = d.getFullYear();
  var mm = d.getMonth() < 9 ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1); // getMonth() is zero-based
  var dd = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
  var hh = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
  var min = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
  var ss = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
  return [yyyy, mm, dd].join('/') + ' ' + [hh, min].join(':');
}