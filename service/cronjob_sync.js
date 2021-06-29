const flectData = require('./../service/flectdata-amz');
let Product = require('./../model/Product');

function syncData(listProduct, idx) {
    if (idx < listProduct.length) {
        let prd = listProduct[idx];
        
        flectData(prd.link).then(rs => {
            let check;
            check = rs.availability == '0';
            prd.stock = rs.availability;
            if (!check) check = prd.current_price != rs.price;
            prd.last_price = prd.current_price;
            prd.current_price = rs.price;
            if (check) prd.checked = '0';
            prd.status = '1';
            prd.last_update = formatDateTime(new Date());
            prd.save();
            setTimeout(() => {
                idx++;
                syncData(listProduct, idx);
            }, 5000)
            
        }).catch(err => {
            prd.status = '0';
            prd.last_update = formatDateTime(new Date());
            prd.save();
            setTimeout(() => {
                idx++;
                syncData(listProduct, idx);
            }, 5000)
        });
    }
}

function syncAllData() {
    var listProduct = [];
    Product.find().then(doc => {
        listProduct = doc;
        syncData(listProduct, 0);
    })
}

module.exports = syncAllData;
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