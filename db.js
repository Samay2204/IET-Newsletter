const mongoose = require("mongoose");

mongoose.connect(MONGO_URL)
.then(() => console.log("Connected to MongoDB Atlas"))
.catch((err) => console.error("Error Connecting in MongoDB Atlas",err));

const subscriberSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, required: true,unique:true},
    emailSent:{type: Boolean, default: false}
  });
  
  const Subscriber = mongoose.model("Subscriber", subscriberSchema);
  
  module.exports = Subscriber;

