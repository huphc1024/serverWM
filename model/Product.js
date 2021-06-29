const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Product = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    title: {
      type: String
    },
    link: {
      type: String
    },
    image: {
      type: String
    },
    current_price: {
      type: String
    },
    last_price: {
      type: String
    },
    ebay_price: {
      type: String
    },
    stock: {
      type: String
    },
    checked: {
      type: String
    },
    status: {
      type: String
    },
    account: {
      type: String
    },
    last_update: {
      type : String
    },
    create_time: {
      type : String
    },
    last_checked: {
      type : String
    }
  }, {
    collection: 'product'
  })
  
  module.exports = mongoose.model('product', Product);