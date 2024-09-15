

const { MongoClient } = require('mongodb');

const url = 'mongodb://localhost:27017/login'; // Connect to the 'login' database
const dbName = 'login';
const cartCollectionName = 'cart';

let client;

async function connect() {
    if (!client) {
      client = new MongoClient(url, { useUnifiedTopology: true });
      await client.connect();
    }
    const db = client.db(dbName); // Use dbName variable instead of login
    const cartCollection = db.collection(cartCollectionName);
    return cartCollection;
  }
  
async function addItemToCart(item) {
  try {
    const cartCollection = await connect();
    const result = await cartCollection.insertOne({
      item: item.item,
      quantity: item.quantity,
      price: item.price
    });
    return result.insertedId;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error; // Throw the error to handle it in the calling function
  }
}

async function updateItemQuantityInCart(itemId, newQuantity) {
  try {
    const cartCollection = await connect();
    const result = await cartCollection.updateOne(
      { _id: new MongoClient.ObjectID(itemId) },
      { $set: { quantity: newQuantity } }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error updating item quantity in cart:', error);
    throw error;
  }
}

async function getCartTotal() {
    try {
      const cartCollection = await connect();
      const cartItems = await cartCollection.find().toArray();
      console.log('Cart Items:', cartItems); // Log the retrieved cart items for debugging
      let totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      console.log('Total Amount:', totalAmount); // Log the calculated total amount for debugging
      return totalAmount;
    } catch (error) {
      console.error('Error getting cart total:', error);
      throw error;
    }
  }
  // config2.js
async function fetchTotalAmount() {
    try {
      const totalAmount = await getCartTotal(); // Assuming getCartTotal() is correctly defined elsewhere
      return totalAmount;
    } catch (error) {
      console.error('Error fetching total amount:', error);
      throw error;
    }
  }
  
  module.exports = {
    fetchTotalAmount
  };
  

module.exports = {
  addItemToCart,
  updateItemQuantityInCart,
  getCartTotal
};
