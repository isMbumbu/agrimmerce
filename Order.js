const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price must be positive']
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'card', 'delivery'],
    required: true
  },
  nameOnCard: {
    type: String,
    trim: true
  },
  cardNumber: {
    type: String,
    match: [/^\d{16}$/, 'Invalid card number format']
  },
  expiryDate: {
    type: String,
    match: [/^\d{2}\/\d{2}$/, 'Invalid expiry date format']
  },
  cvc: {
    type: String,
    match: [/^\d{3}$/, 'Invalid CVC format']
  },
  mpesaNumber: {
    type: String,
    match: [/^\d{10}$/, 'Invalid M-Pesa number format']
  },
  products: [
    {
      productName: {
        type: String,
        required: true
      },
      productPrice: {
        type: Number,
        required: true
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
