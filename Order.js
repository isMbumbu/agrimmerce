const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'mpesa', 'delivery'] // Enum for allowed payment methods
  },
  nameOnCard: {
    type: String,
    // Optional field, only applicable if paymentMethod is 'card'
  },
  cardNumber: {
    type: String,
    // Optional field, only applicable if paymentMethod is 'card'
  },
  expiryDate: {
    type: String,
    // Optional field, only applicable if paymentMethod is 'card'
  },
  cvc: {
    type: String,
    // Optional field, only applicable if paymentMethod is 'card'
  },
  mpesaNumber: {
    type: String,
    // Optional field, only applicable if paymentMethod is 'mpesa'
  }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
