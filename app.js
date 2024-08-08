
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoose = require('mongoose');
const user_routes = require('./routes/user_routes');
const admin_routes = require('./routes/admin_routes');
const product_routes = require('./routes/product_routes');
const productController = require('./controllers/product_controller');
const upload_profile_routes = require('./routes/upload_profile_routes');

const { verifyAdmin, verifyUser } = require('./middlewares/auth');

const app = express();

app.use(express.static('public/'));

app.use(express.json());

app.use(cors());
app.use(morgan('tiny'));
app.use(helmet());

const localDbUri = process.env.MONGODB_URI;

function connectToDatabase(uri) {
    return mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
}

// Connect to the local database
connectToDatabase(localDbUri)
    .then(() => console.log(`Connected to the local database at ${localDbUri}`))
    .catch(err => {
        console.error(`Failed to connect to the local database. Error: ${err.message}`);
        process.exit(1);
    });

// Testing route
app.get('/', (req, res) => {
    res.send('<h1>Testing</h1>');
});

// Routes for users
app.use('/users', user_routes);

// Routes for admin
app.use('/admin', verifyUser, admin_routes);

// Routes for products
app.use('/products', product_routes);

app.get('/:product_id/:review_id', productController.getSingleReview);
app.put('/:product_id/:review_id', verifyUser, productController.updateSingleReview);
app.delete('/:product_id/:review_id', verifyUser, productController.deleteSingleReview);

app.post('/purchase', verifyUser, productController.purchaseProduct);
app.get('/purchase', verifyUser, productController.getAllPurchasesProduct);

// Routes for uploading images
app.use('/uploads', verifyUser, upload_profile_routes);

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        return res.status(400).json({ error: err.message });
    } else {
        return res.status(500).json({ error: err.message });
    }
});

// For unknown paths
app.use((req, res) => res.status(404).json({ error: 'Path not found' }));

module.exports = app;
