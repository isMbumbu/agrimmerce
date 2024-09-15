const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const Admin = require('./admin'); // Path to your admin.js file
const productRoutes = require('./productRoutes'); // Product routes
const collection = require('./config');
const { getCartTotal } = require('./config2');
const Order = require('./Order'); // Order model
const Product = require('./models/product'); // Product model


const app = express();
const port = 3000;

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    console.log(`Saving file: ${uniqueSuffix + fileExtension}`); // Debug output
    cb(null, uniqueSuffix + fileExtension);
  }
});

const upload = multer({ storage: storage });

// Middleware to parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: '2003',
  resave: false,
  saveUninitialized: true
}));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/img', express.static(__dirname + '/public/img'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware to initialize cart and total price
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  req.session.totalPrice = calculateTotalAmount(req.session.cart);
  next();
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/login', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Use the product routes
app.use('/api', productRoutes);

// Mount productRoutes
app.use('/', productRoutes);

// Routes
app.get('/', (req, res) => {
  res.render('agri');
});


app.get('/shop', async (req, res) => {
  try {
    console.log('Fetching products...');
    const products = await Product.find();
    products.forEach(product => {
      console.log('Product image path:', product.image);
    });
    res.render('shop', { products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/about', (req, res) => {
  res.render('about');
});
app.get('/loginadmin', (req, res) => {
  res.render('loginadmin');
});
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Authentication middleware
function requireLogin(req, res, next) {
  if (req.session && req.session.username) {
    next();
  } else {
    res.redirect('/login');
  }
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminUsername) {
    next(); // Admin is authenticated, proceed to the next middleware
  } else {
    res.redirect('/loginadmin'); // Redirect to admin login if not authenticated
  }
}

// Account route with authentication
app.get('/account', requireLogin, async (req, res) => {
  const username = req.session.username;
  console.log('Account access for user:', username); // Debug statement
  try {
    const user = await collection.registration.findOne({ username });
    // Store user details in session
    req.session.user = user; // Assuming user has a `name` field
    res.render('account', { user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});
// In your app.js or server file
app.get('/api/username', (req, res) => {
  if (req.session && req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(404).json({ message: 'Username not found' });
  }
});

app.post('/cart/add', (req, res) => {
  const { productId, quantity, price } = req.body;
  req.session.cart.push({ productId, quantity, price });
  req.session.totalPrice = calculateTotalAmount(req.session.cart);
  res.redirect('/shop');
});

app.post('/cart/update', (req, res) => {
  const { productId, quantity } = req.body;
  const item = req.session.cart.find(item => item.productId === productId);
  if (item) {
    item.quantity = quantity;
  }
  req.session.totalPrice = calculateTotalAmount(req.session.cart);
  res.redirect('/shop');
});

const calculateTotalAmount = (cart) => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};
app.get('/payment', (req, res) => {
  const totalPrice = req.query.totalPrice;
  // Check if parameters are received
  if (!totalPrice) {
    console.error("Total price is missing from query parameters");
  }
  // Pass the parameters to the view
  res.render('payment', { 
    totalPrice: totalPrice
  });
});


// Route for handling payment form submission
app.post('/payment', async (req, res) => {
  try {
    const { nameOnCard, cardNumber, expiryDate, cvc, totalPrice } = req.body;

    const newOrder = new Order({
      nameOnCard,
      cardNumber,
      expiryDate,
      cvc,
      totalPrice
    });

    await newOrder.save();
    res.send('Payment successful');
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).send('Internal Server Error');
  }
});
// Route for handling product uploads
app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { name, description, price } = req.body;
  const { filename } = req.file;

  const imagePath = `uploads/${filename}`;


  // Create a new product document with the correct image path
  const product = new Product({
    name,
    description,
    price,
    image: imagePath,
  });

  try {
    await product.save();
    res.status(201).json({ message: 'Product added successfully!' });
  } catch (error) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: 'Failed to save product' });
  }
});



app.get('/address', (req, res) => {
  res.render('address');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/livestock', (req, res) => {
  res.render('livestock');
});

app.get('/crops', (req, res) => {
  res.render('crops');
});

app.get('/fruits', (req, res) => {
  res.render('fruits');
});

app.get('/machinery', (req, res) => {
  res.render('machinery');
});
app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin'); // Render the admin dashboard
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find(); // Assuming `Product` is your model
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/products/count', async (req, res) => {
  try {
      const count = await Product.countDocuments();
      res.json({ count });
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});


app.get('/api/overview', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalSales = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const totalOrders = await Order.countDocuments();
    res.json({
      totalProducts,
      totalSales: totalSales[0] ? totalSales[0].total : 0,
      totalOrders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});
// Route to get the total count of orders
app.get('/api/Order/count', (req, res) => {
  Order.countDocuments({}, (err, count) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json({ count });
  });
});

app.get('/seeds', (req, res) => {
  res.render('seeds');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.redirect('/loginadmin'); // Redirect to admin login page
  });
});


app.post('/api/products', (req, res) => {
  // Handle product addition logic
  res.json({ success: true }); // Sample response
});
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword
    };
    await collection.registration.create(userData);
    res.redirect('/login');
  } catch (error) {
    console.error('Error registering user:', error);
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for user:', username); // Debug statement

  try {
    const user = await collection.registration.findOne({ username });
    
    if (!user) {
      console.error('User not found:', username); // Debug statement
      return res.status(401).send('Invalid username or password');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      req.session.username = username;
      console.log('Login successful for user:', username); // Debug statement
      return res.redirect('/account');
    } else {
      console.error('Password mismatch for user:', username); // Debug statement
      return res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send('Internal server error');
  }
});
app.post('/admin/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the username already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).send('Username already exists');
    }

    // Proceed with registration
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      username,
      email,
      password: hashedPassword
    });

    await newAdmin.save();
    res.redirect('/loginadmin');
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).send("Invalid username or password");
    const isMatch = await bcrypt.compare(password, admin.password);
    if (isMatch) {
      req.session.adminUsername = username; // Set admin session
      res.redirect('/admin');
    } else {
      res.status(400).send("Invalid username or password");
    }
  } catch (error) {
    console.error("Error logging in admin:", error);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/api/products/count', async (req, res) => {
  try {
    const count = await Product.countDocuments(); // Assuming 'Product' is your model
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product count' });
  }
});
app.delete('/api/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if the ID is valid for MongoDB
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Optionally, fetch remaining products if needed
    const products = await Product.find();

    res.json({
      success: true,
      message: 'Product deleted successfully',
      products // Send remaining products if needed
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/api/products', async (req, res) => {
  try {
      const { name, description, price, category } = req.body;

      // Validate the data if needed

      const newProduct = new Product({
          name,
          description,
          price,
          category,
      });

      await newProduct.save();
      res.json({ success: true, message: 'Product added successfully!' });
  } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});
app.post('/payment/mpesa', async (req, res) => {
  try {
    const { mpesaNumber, totalPrice } = req.body;
    const customerName = req.session.username; // Retrieve the customer name from the session

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const newOrder = new Order({
      mpesaNumber,
      totalPrice,
      customerName, // Store the customer name
      paymentMethod: 'mpesa'
    });

    await newOrder.save();
    res.send('M-Pesa payment successful');
  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Route for handling Credit/Debit Card payment form submission
app.post('/payment/card', async (req, res) => {
  try {
    const { nameOnCard, cardNumber, expiryDate, cvc, totalPrice } = req.body;
    const customerName = req.session.username; // Retrieve the customer name from the session

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const newOrder = new Order({
      nameOnCard,
      cardNumber,
      expiryDate,
      cvc,
      totalPrice,
      customerName, // Store the customer name
      paymentMethod: 'card'
    });

    await newOrder.save();
    res.send('Card payment successful');
  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Express route to handle delivery payment
app.post('/payment/delivery', async (req, res) => {
  try {
    const { totalPrice } = req.body;
    const customerName = req.session.username; // Retrieve the customer name from the session

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const newOrder = new Order({
      totalPrice,
      customerName, // Store the customer name
      paymentMethod: 'delivery',
      status: 'Pending'
    });

    await newOrder.save();
    res.json({ success: true, message: 'Order placed successfully' });
  } catch (error) {
    console.error('Error processing delivery payment:', error);
    res.status(500).json({ error: 'An error occurred while processing your payment' });
  }
});

app.get('/api/Order', async (req, res) => {
  try {
    const orders = await Order.find(); // Assuming `Order` is your model
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).send('Internal Server Error');
  }
});
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await Order.findByIdAndDelete(orderId); // Delete order by ID
    res.status(200).send('Order deleted successfully.');
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
// Start server
app.listen(port, () => {
  console.info(`Server is running on port ${port}`);
});
