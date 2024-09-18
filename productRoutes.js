const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Product = require('./models/product');
const Order = require('./Order');

// Route to handle product form submission
router.post('/post-product', upload.single('productImage'), async (req, res) => {
    try {
        const { productName, productDescription, productPrice } = req.body;
        const productImage = req.file.path;

        const newProduct = new Product({
            name: productName,
            description: productDescription,
            price: productPrice,
            image: productImage
        });

        await newProduct.save();

        res.redirect('/');
    } catch (error) {
        console.error('Error posting product:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to handle order submission
router.post('/place-order', async (req, res) => {
    try {
        const { customerName, totalPrice, paymentMethod, nameOnCard, cardNumber, expiryDate, cvc, mpesaNumber, productIds } = req.body;

        // Fetch product details from the database
        const products = await Product.find({ '_id': { $in: productIds } });

        const productNames = products.map(product => product.name);

        const newOrder = new Order({
            customerName,
            totalPrice,
            paymentMethod,
            nameOnCard,
            cardNumber,
            expiryDate,
            cvc,
            mpesaNumber,
            productNames  // Use productNames array
        });

        await newOrder.save();

        res.json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to fetch all products
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
