const mongoose = require("mongoose");

// Connect to the MongoDB database
const connect = mongoose.connect("mongodb://localhost:27017/login").catch(error => {
    console.error("Failed to connect to database:", error);
});

connect.then(() => {
    console.log("Database connected successfully!");
}).catch(() => {
    console.log("Failed to connect to database!");
});

// Define login schema
const loginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

// Define registration schema
const registrationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password: {
        type: String,
        required: true
    }
});
const collection=new mongoose.model("users",loginSchema)
// Create collections using the respective schemas
const login = mongoose.model("login", loginSchema);
const registration = mongoose.model("registration", registrationSchema);

module.exports = {
    login: login,
    registration: registration,
    connect: connect
};
