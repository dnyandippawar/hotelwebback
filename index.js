require('dotenv').config()
const con = require("./config.js");
const express = require('express')
const nodemailer = require("nodemailer");
const app = express();


 PORT = process.env.PORT
 app.use(express.json())

const cors = require('cors');
app.use(cors({
    origin:'http://localhost:4200', 
    // origin:'http://localhost:60779',
    // methods:['GET , POST'],
    methods:['GET, POST, PUT, DELETE'],

    allowedHeaders: ['Content-Type', 'Authorization']
}))
// *----------------------------------------------------*
var OTP = '';
var match;
var notmatch;
var user;
var newpassward;
var email
// *----------------------------------------------------*
//data getting from database send to login
 app.get("/get", (req, res)=>{
  var body = req.body;
      con.query( 'select * from login' ,(error , result) =>{
          if(error){
             console.log( "sorry",error);
         }
             else{
             user = JSON.stringify(result)
                res.send(user);  
             }
         })
        
 console.log("mydata is fetch");
 })

//*--------------------------------------------------*
//email send to database to reset passward
 app.post("/email",(req,res)=>{
    email = req.body;
  let transporter = nodemailer.createTransport({
    host:"localhost",
    port:587,
    secure: false,
    service:"gmail.com",
    auth:{
      user:'dnyanadip1234@gmail.com',
      pass:'oqgxmymwiaycwpge',
    }
  })
  let info = {
    from :'dnyanadip1234@gmail.com',
    to : email.email,
    subject: 'OTP varification',
    text:'your passward will change first you take otp in otp section OTP :' + otp,
  }
  transporter.sendMail(info, (err , result)=>{
    if(err){
      console.log("the error occured please check error", err);
    }else{
      console.log("message send :", result );
      res.send(result);
      transporter.close();
    }
  
  })

    console.log('received data from angular'+ email.email); 

 })
//---------------------------------------------------------*
//generate otp in function
function generateOTP(length){
  const charset = '0123456789';

  for(let i = 0; i < length; i++) {
    const randomindex = Math.floor(Math.random() * 10);
   OTP += charset[randomindex];
  }
  return OTP;
}
 const otp = generateOTP(6);
//********************************************************* */
// client get otp 
app.get("/otpget",(req, res)=>{
  console.log(otp);
  res.send(otp);
})

 //*----------------------------------------------------*
 // new passward save to database
 app.post("/newpass", (req, res) => {
     newpassword  = req.body;
  
    // Update the password in the database
    const sql = 'UPDATE login SET passward = ? WHERE email = ?';
    con.query(sql, [newpassword.newpassward, email.email], (err, result) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ message: 'Failed to update password.' });
      } else {
        console.log('Password updated successfully',result);
        res.status(200).json({ message: 'Password updated successfully.' });
      }
    });
  });
//******************************************************************** */
// hotel product send with database
 app.post("/postproducts",(req , res)=>{
  var productpost = req.body;
  con.query('insert into products set ?', productpost , (error, result )=>{
    if(error){
      res.send("sorry error occured", error);
    }
    else{
      res.send("hotel information save successfully", result);
    }
  })
 })

 //********************************************************************* */
 app.get("/getproducts/:id",(req, res)=>{
  const id = req.params.id; // Access the ID from the route parameter
  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

  con.query(`SELECT * FROM products WHERE id = ${id}`, (error, result) => {
    if (error) {
      console.error("Error retrieving prodcuct information:", error);
      res.status(500).json({ error: "Error retrieving product information" });
    } else {
      if (result.length > 0) {
        res.status(200).json(result[0]); // Assuming you expect a single hotel
      } else {
        res.status(404).json({ message: "product not found" });
      }
    }
  });
 })

 //-------------------------------------------------------------------------------*
 app.get("/getproducts",(req, res)=>{
  con.query('select * from products',(error, result)=>{
    if(error){
      console.log("you get errors please check", error);
    }else{
     product = JSON.stringify(result)
      res.send(product);
    }
  })
 })

//*--------------------------------------------------------*
// update hotel information id wise
app.put("/updateproduct/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter
  const updatedInfo = req.body; // Assuming the updated data is sent in the request body

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

  con.query(
    'UPDATE products SET ? WHERE id = ?',
    [updatedInfo, id],
    (error, result) => {
      if (error) {
        console.error("Error updating product information:", error);
        res.status(500).json({ error: "Error updating product information" });
      } else {
        if (result.affectedRows > 0) {
          res.status(200).json({ message: "Product information updated successfully" });
        } else {
          res.status(404).json({ message: "Product not found" });
        }
      }
    }
  );
});



//*--------------------------------------------------------*
// get hotel information database to client
app.get("/gethotelinfo/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

  con.query(`SELECT * FROM hotelinfo WHERE id = ${id}`, (error, result) => {
    if (error) {
      console.error("Error retrieving hotel information:", error);
      res.status(500).json({ error: "Error retrieving hotel information" });
    } else {
      if (result.length > 0) {
        res.status(200).json(result[0]); // Assuming you expect a single hotel
      } else {
        res.status(404).json({ message: "Hotel not found" });
      }
    }
  });
});



//*********************************************************************** */
//tableproduct get to database

let tableproduct ;
app.get("/get_tableproduct",(req, res)=>{
  con.query('select * from tables',(error, result)=>{
    if(error){
      console.log("you get errors please check", error);
    }else{
     tableproduct = JSON.stringify(result)
      res.send(tableproduct);
    }
  })
 })
 //---------------------------------------------------------------------*
 //customer gives order to shop owner

//*********************************************************************
//  delete products
app.delete('/deleteProduct/:id', (req, res) => {
  const productId = req.params.id;

  con.query('DELETE FROM products WHERE id = ?', productId, (error, result) => {
    if (error) {
      console.log("Error deleting product:", error);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      if (result.affectedRows > 0) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ error: 'Product not found' });
      }
    }
  });
});

////************************************************************************ */
// hotel information send to database
app.put("/hotelinfo/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter
  const updatedInfo = req.body; // Assuming the updated data is sent in the request body

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

  con.query(
    'UPDATE hotelinfo SET ? WHERE id = ?',
    [updatedInfo, id],
    (error, result) => {
      if (error) {
        console.error("Error updating hotel information:", error);
        res.status(500).json({ error: "Error updating hotel information" });
      } else {
        if (result.affectedRows > 0) {
          res.status(200).json({ message: "Hotel information updated successfully" });
        } else {
          res.status(404).json({ message: "Hotel not found" });
        }
      }
    }
  );
});

//*----------------------------------------------------------------------------*
//registration data send to database
 app.post("/post",(req, res)=>{
    var post_body =  req.body;
    con.query('insert into login set ?', post_body ,(error , result , fields)=>{
   
    if(error){console.log("sorry", error)}
  else { res.send("registered save successfully",result);
        // console.log(post_body);
}
 })
res.end();
 })
//*------------------------------------------------*
// server port number
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})

// .listen(5000,()=>
//     console.log(`server is running on port 5000`)
//     // console.log('server run 5000 port number')
// )