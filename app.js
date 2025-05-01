const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

//Database
const Subscriber = require("./db");
// const { Promise } = require("mongoose");





//Nodemailer email transporter setup.
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.GMAIL,
        pass: process.env.PASS
    }

})

//store otps temporarily
const otps = {};


// Routes
//1. serve the signupform
app.get("/", (req,res) => {
    res.sendFile(__dirname + "/signup.html");
})

//2. signup form submission 
app.post("/", async function (req, res) {
    const { fName, lName, email } = req.body;

    try{

        // Save new subscriber
        const newSubscriber = new Subscriber({
            firstName: fName,
            lastName: lName,
            email
        });

        await newSubscriber.save();

        // Send newsletter to the subscriber
        await transporter.sendMail({
            from: "shauryanamdeo2204@gmail.com",
            to: email,
            subject: "Your IET Newsletter",
            text: `Hi ${newSubscriber.firstName},\n\nPlease find the attached document.\n\nBest regards,\nYour Newsletter Team`,
            attachments: [
                {
                    filename: "IETNewsletter.pdf",
                    path: __dirname + "/IETNewsletter.pdf"
                }
            ]
        });

        console.log(`PDF sent to ${email}`);
        res.sendFile(__dirname + "/success.html");
    } catch (err) {
        console.error("Error saving subscriber", err);

         if (err.code === 11000) {
            return res.status(400).send("Email is already subscribed.");
        }

        res.status(500).send("An error occurred. Please try again.");
    }
});

    

//3. otp post request for email verification
app.post("/send-otp", function(req,res) {
     const {email} = req.body;

     if (!email) {
        console.error("No email provided in request body");
        return res.status(400).send("Email is required.");
      }


     const otp = crypto.randomInt(100000,999999).toString();
     console.log(req.body);
     


     otps[email] = otp;



     //sending OTP via email function
     transporter.sendMail({
        from: "shauryanamdeo2204@gmail.com",
        to: email,
        subject: "Email verification OTP",
        text: `Your OTP for Email verification is: ${otp}`
    },

    function(error,info){
        if(error) {
            console.error("Error in sending OTP",error);
            res.status(500).send("Failed to send OTP");
            
        } else {
            console.log("OTP sent:", info.response);
            res.status(200).send("OTP sent successfully.");
            
        }
    }
    );

    console.log("Received email:", email);
    
});


//4. post request route for verification of OTP.
app.post("/verify-otp", (req,res) => {
    const email = req.body.email;
    const otp = req.body.otp;
    if( otps[email] && otps[email] === otp){
        delete otps[email];
        res.status(200).send("Email verified successfully.");
  } else {
    res.status(400).send("Invalid or expired OTP.");
    }
})



//5. Route to send pdf to all the subscribers.
app.post("/send-pdf", async (req,res) => {
    
    try{
        // find and fetch all subscribers
        const subscribers = await Subscriber.find({emailSent:false});

        if(subscribers.length === 0){
            return res.status(404).send("No Subscribers Found");
        }

    

        //email for each subscriber.
    

        const emailPromises = subscribers.map( async function(subscriber){
            await transporter.sendMail({
                from: "shauryanamdeo2204@gmail.com",
                to: subscriber.email,
                subject: "Your IET Newsletter",
                text: `Hi ${subscriber.firstName},\n\nPlease find the attached document.\n\nBest regards,\nYour Newsletter Team`,
                attachments: [
                    {
                        filename: "IETNewsletter.pdf",
                        path: __dirname + "/IETNewsletter.pdf"
                    }
                ]

            })
        });

        //************ update the email sent status,
        // now we are finding those whom email are not sent, sending them email and updating their status to true  */

        subscribers.emailSent = true;
        await subscriber.save();



    await Promise.all(emailPromises);
    console.log("Emails sent successfully");
    res.status(200).send("PDF sent to remaining subscribers");
    
}


 catch (err) {
    console.log("Error in sending Email", err);
    res.status(500).send("Failed to send PDF");
}
});


app.post("/failure.html", (req,res) => {
    res.redirect("/");
});


app.listen(3000,() => {
    console.log("Server running on localhost 3000");
    
});

