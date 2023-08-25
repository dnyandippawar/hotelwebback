require('dotenv').config();
const con = require("./config.js");
const express = require('express');
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());


const PORT = process.env.PORT || 3000; // Default to port 3000 if PORT is not specified in .env
app.use(express.json());
app.use(bodyParser.json());

// const cors = require('cors');
// app.use(cors({
//   origin: 'http://localhost:4200',
//     origin: 'http://localhost:60064',

//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
//******************************************************************************************************************************************************* */
app.use(express.urlencoded({ extended: true }));

// Multer setup for saving uploaded files to an 'uploads/' directory

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });


app.use('/uploads', express.static('uploads'));

//***************************************************************************************************************************************************** */

const cors = require('cors');

const allowedOrigins = ['http://localhost:4200', 'http://localhost:56957'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));



app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

let OTP;

// Function to generate a new OTP
function generateOTP(length) {
  const charset = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    const randomindex = Math.floor(Math.random() * 10);
    otp += charset[randomindex];
  }
  return otp;

}

// app.get("/otpget", (req, res) => {
 
//     // generatedOtp = generateOTP(6);
    
    

//     // Send the OTP as a response
//     res.json({  generatedOtp });
 
// });
app.post("/verifyotp", (req, res) => {
    const userEnteredOTP = req.body.otp;
    console.log(userEnteredOTP);
    if (userEnteredOTP === OTP) {
        res.status(200).json({ message: "OTP verified successfully" });
    } else {
        res.status(400).json({ message: "Invalid OTP" });
    }
});

//********************************************************************************************************************************* */
let currentemail;
// Email send to database to reset password
app.post("/email", (req, res) => {
  const email = req.body;

  // Generate a new OTP for each request
  OTP = generateOTP(6);

  let transporter = nodemailer.createTransport({
  //  host: "smtp.gmail.com",
    // host: "localhost",
    // port: 587,
    // secure: false,
    service: "gmail.com",
    auth: {
      user:'dnyanadip1234@gmail.com',
      pass:'sfemrliokkynkllr',
      // user: 'your_gmail_username@gmail.com', // Replace with your Gmail username
      // pass: 'your_gmail_password', // Replace with your Gmail password
    }
  });

  let info = {
    // from: 'your_gmail_username@gmail.com', // Replace with your Gmail username
    from:'dnyanadip1234@gmail.com',
    to: email.email,
    subject: 'OTP verification',
    text: `Your password will change. First, you need to take OTP in the OTP section. OTP: ${OTP}`,
  };

  transporter.sendMail(info, (err, result) => {
    if (err) {
      console.log("Error occurred while sending the email:", err);
      alert("You entered OTP is wrong please enter right OTP .");
      res.status(500).json({ message: "Error occurred while sending the email." });
    } else {
      console.log("Message sent:", result);
      res.status(200).json({ message: "Email sent successfully." });
      transporter.close();
    }
  });
this.currentemail = email.email;
  console.log('Received data from Angular: ' + email.email);
});

//----------------------------------------------------------------------------------------------------------------------------*
// New password save to the database

app.post("/newpass", (req, res) => {
  const newPasswordObj = req.body;
  const newpassword = newPasswordObj.newpassward; // Extracting the actual password string
  const userEmail = this.currentemail; // Get the email from the request body
console.log("email ->",userEmail  ,"+",newpassword);
    // Check if password and email are provided
    if (!newpassword || !userEmail) {
        return res.status(400).json({ message: 'Password and email are required.' });
    }

    // Hash the new password using bcrypt
    bcrypt.hash(newpassword, saltRounds, (err, hashedPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ message: 'Hashing failed.' });
        }

        // Update the password in the database with the hashed password
        const sql = 'UPDATE signup SET Ownerpassward = ? WHERE Owneremail = ?';
        con.query(sql, [hashedPassword, userEmail], (err, result) => {
            if (err) {
                console.error('Error updating password:', err);
                alert("failed update passward re-try");
                return res.status(500).json({ message: 'Failed to update password.' });
            }
            
            console.log('Password updated successfully', result);
            res.status(200).json({ message: 'Password updated successfully.' });
        });
    });
});


//******************************************************************** */
// hotel product send with database
 // Add a new product associated with a specific restaurant
//  app.post("/postproducts/:restaurant_id", upload.single('productimage'), (req, res) => {
  app.post("/postproducts/:restaurant_id", (req, res) => {
  console.log("Received request for:", req.params.restaurant_id);
  console.log("Request body:", req.body);
  // if (!req.file) {
  //     return res.status(400).send('No file uploaded');
  // }

  const restaurant_id = req.params.restaurant_id;
  const productpost = req.body;
  productpost.restaurant_id = restaurant_id;
  // productpost.productimage = req.file.path;

  con.query('INSERT INTO products SET ?', productpost, (error, result) => {
      if (error) {
          console.error("Error inserting product:", error);
          res.status(500).json({ error: "Error saving product" });
      } else {
          res.status(200).json({ message: "Product saved successfully", result: result });
      }
  });
});

 //********************************************************************* */
 //-------------------------------------------------------------------------------*

 app.get("/geterproducts/:product_id",(req, res)=>{
  const product_id = req.params.product_id;
  con.query('select * from products where product_id = ?',[product_id],(error, result)=>{
    if(error){
      console.log("you get errors please check", error);
    }else{
      res.status(200).json(result);
    //  product = JSON.stringify(result)
      // res.send(product);
    }
  })
 })
 //------------------------------------------------------------------------------------------------*
// Get products by restaurant_id
app.get("/getproducts/:restaurant_id", (req, res) => {
  const restaurant_id = req.params.restaurant_id;
  if (!restaurant_id) {
    res.status(400).json({ error: "Missing restaurant_id parameter" });
    return;
  }
  con.query(
    'SELECT * FROM products WHERE restaurant_id = ?',
    [restaurant_id],
    (error, result) => {
      if (error) {
        console.error("Error retrieving products:", error);
        res.status(500).json({ error: "Error retrieving products" });
      } else {
        if (result.length > 0) {
          res.status(200).json(result);
        } else {
          res.status(404).json({ message: "No products found for this restaurant" });
        }
      }
    }
  );
});


//*--------------------------------------------------------*
// update hotel information id wise
app.put("/updateproduct/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter
  // const updatedInfo = req.body; // Assuming the updated data is sent in the request body
  const updatedInfo = {
    productname: req.body.productname,
    productprice: req.body.productprice,
    productimage: req.body.productimage,
    description: req.body.description,
    catagory: req.body.catagory,
    // Add any other product-related fields here
  };

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

  con.query(
    'UPDATE products SET ? WHERE product_id = ?',
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


//*********************************************************************
//  delete products
app.delete('/deleteProduct/:id', (req, res) => {
  const productId = req.params.id;

  con.query('DELETE FROM products WHERE product_id = ?', productId, (error, result) => {
    if (error) {
      console.log("Error deleting product:", error);

      // Check for foreign key constraint error
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ error: 'Product cannot be deleted because it is referenced in other records.' });
      }

      return res.status(500).json({ error: 'Internal server error' });
    } 

    if (result.affectedRows > 0) {
      return res.json({ message: 'Product deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Product not found' });
    }
  });
});


//--*********************************************************************************************************



app.post("/posthotelinfo", (req, res) => {
  const newRestaurant = req.body;
  
  // if (!newRestaurant.Owner_id || /* check for other required fields here */) {
  //   res.status(400).json({ error: "Missing required fields" });
  //   return;
  // }

  const query = 'INSERT INTO hotelinfo SET ?';

  con.query(
    query,
    newRestaurant,
    (error, result) => {
      if (error) {
        console.error("Error inserting restaurant information:", error);
        res.status(500).json({ error: "Error inserting restaurant information" });
      } else {
        res.status(201).json({ message: "Restaurant information inserted successfully", id: result.insertId });
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
console.log( "getid",id);
con.query(`SELECT * FROM hotelinfo WHERE Owner_id = ${id}`,(error, result)=>{
  // con.query(`SELECT * FROM hotelinfo WHERE Owner_id = ${id}`, (error, result) => {
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

//*--------------------------------------------------------*
// get hotel information database to client
app.get("/geterhotelinfo/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }
console.log( "getid",id);
// con.query(`SELECT * FROM hotelinfo id = ${id}`,(error, result)=>{
  con.query(`SELECT * FROM hotelinfo WHERE restaurant_id = ${id}`, (error, result) => {
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
////************************************************************************ */
// hotel information send to database
app.put("/hotelinfo/:id", (req, res) => {
  const id = req.params.id; // Access the ID from the route parameter
  const updatedInfo = req.body; // Assuming the updated data is sent in the request body

  if (!id) {
    res.status(400).json({ error: "Missing ID parameter" });
    return;
  }

//   const updateStatement = `
//   UPDATE hotelinfo  
//    INNER JOIN signup  ON hotelinfo.Owner_id = signup.Owner_id
//   SET updateinfo = ?
//   WHERE hotelinfo.Owner_id = ?
// `;

con.query( 'UPDATE hotelinfo SET ? WHERE restaurant_id = ?',
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
//------------------------------------------------------------------------------------------------------------------------------------------------------------------*
//***************************************************************************************************************************************************************** */
//tableproduct get to database and see Hotel owner

app.get("/get_completedorder/:id", (req, res) => {
  const restaurant_id = req.params.id;

  // Validate restaurant_id if necessary (e.g., check if it's a valid number)

  con.query(`SELECT c.*, o.* 
  FROM order_items o
  JOIN customers c ON o.order_id = c.order_id 
  WHERE o.orderstatus = 0 AND o.restaurant_id = ?`, [restaurant_id], (error, result) => {
    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch orders. Please try again later." });
    }
    
    res.json( result );
    
  });
});
//***************************************************************************************************************************************************************** */
// get orders product with owner
app.get("/get_ordersproductbyid/:id", (req, res) => {
  const restaurant_id  = req.params.id;
 
   const query = `SELECT * from order_items
   WHERE  orderstatus = 1 AND cancelorder = 0 AND restaurant_id = ?`
 ; 
   
   con.query(query , [restaurant_id], (error, result) => {
     if (error) {
       console.error("Error fetching owner's orders:", error);
       return res.status(500).send("Error fetching owner's orders");
     }
     res.json(result);
   });
 });
//***************************************************************************************************************************************************************** */
// get orders product with owner
app.get("/get_ordersproduct/:id", (req, res) => {
 const restaurant_id  = req.params.id;

  const query = `SELECT c.*, o.* 
  FROM order_items o
  JOIN customers c ON o.order_id = c.order_id 
  WHERE  o.orderstatus = 1 AND o.cancelorder = 0 AND o.restaurant_id = ?`
;
  
  con.query(query , [restaurant_id], (error, result) => {
    if (error) {
      console.error("Error fetching owner's orders:", error);
      return res.status(500).send("Error fetching owner's orders");
    }
    res.json(result);
  });
});

//****************************************************************************************************************************************************************** */
// get orderstatus see with customer current_order

app.get("/get_orderstatuscheck_customer/:id", (req, res) => {
 const restaurant_id = req.params.id;

  const query = `SELECT c.*, o.* 
  FROM order_items o
  JOIN customers c ON o.order_id = c.order_id 
  WHERE o.orderstatus = 1 AND o.restaurant_id = ?
`;
  
  con.query(query,[restaurant_id], (error, result) => {
    if (error) {
      console.error("Error fetching owner's orders:", error);
      return res.status(500).send("Error fetching owner's orders");
    }
    res.json(result);
  });
});
//****************************************************************************************************************************************************************** */
// get completed orders see with customer


app.get("/get_ordercompletestatus_customer/:id", (req, res) => {
    const restaurant_id = req.params.id;
  
    const query = `SELECT c.*, o.* 
    FROM order_items o
    JOIN customers c ON o.order_id = c.order_id 
    WHERE  o.orderstatus = 0 AND  o.restaurant_id = ?
  `;
    
    con.query(query,[restaurant_id], (error, result) => {
      if (error) {
        console.error("Error fetching owner's orders:", error);
        return res.status(500).send("Error fetching owner's orders");
      }
      res.json(result);
    });
  });
 //------------------------------------------------------------------------------------------------------------------------------------------------------------------*

// Soft delete order by updating its status
app.put('/put_ordersproduct/:order_id', (req, res) => {
  const productId = req.params.order_id;
  const element = req.body;
  console.log(element);
  const query = 'UPDATE order_items SET orderstatus = ?, ordercomplete_date = ?  WHERE order_id = ?';
  ordercomplete_date = new Date();
  // Assuming orderstatus is a boolean, where true means the order is active and false means it's deleted
  con.query(query, [false , ordercomplete_date, productId], (err, result) => {
      if (err) {
          console.error("Error updating order status:", err);
          return res.status(500).json({ success: false, message: 'Error updating order status' });
      }
      res.json({ success: true, message: 'Order soft deleted successfully',result });
  });
});
//****************************************************************************************************************************************************************** */

app.put('/put_ordersproductbyproductid/:order_id', (req, res) => {
  const productId = req.params.order_id;
  const element = req.body;
  console.log(element);
  console.log( "id :",productId);
  const query = 'UPDATE order_items SET orderstatus = ?, ordercomplete_date = ?  WHERE item_id = ?';
  ordercomplete_date = new Date();
  // Assuming orderstatus is a boolean, where true means the order is active and false means it's deleted
  con.query(query, [false , ordercomplete_date, productId], (err, result) => {
      if (err) {
          console.error("Error updating order status:", err);
          return res.status(500).json({ success: false, message: 'Error updating order status' });
      }
      res.json({ success: true, message: 'Order soft deleted successfully',result });
  });
});



//***************************************************************************************************************************************************************** */
// cansel order
app.put('/put_canselorders', (req, res) => {
  const orderIds = req.body.order_ids;
  if (!orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ success: false, message: 'Invalid order IDs' });
  }

  // Use SQL IN clause to update multiple orders at once
  const query = `UPDATE order_items SET orderstatus = ?, cancelorder = ? WHERE order_id IN (?)`;
  
  con.query(query, [false, true, orderIds], (err, result) => {
      if (err) {
          console.error("Error updating orders:", err);
          return res.status(500).json({ success: false, message: 'Error updating orders' });
      }
      res.json({ success: true, message: 'Orders updated successfully', result });
  });
});

//****************************************************************************************************************************************************************** */
// cancel order by index
app.put('/cancelOrder/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const cancelorderitem = req.body.cancelstatus;

  con.query('UPDATE order_items SET cancelorder = ? WHERE order_id = ?', [cancelorderitem, itemId], (error, result) => {
    if (error) {
      console.error('Error updating cancel status:', error);
      return res.status(500).send("Error updating cancel status");
    }
    res.json({ message: 'Cancel status updated successfully' });
  });
});

/////////------------------------------------------------------------------------------------------------------------------------------------------------------------*

//************************************************************************************************************************************************************ */
app.post('/post_tableproduct', (req, res) => {
  // Extracting customer data
  const customerData = req.body.customer;

  // Parsing cart data
  let cartItems;
  let rawCartString = req.body.cart[0];

  // Clean the string
  let lastIndex = rawCartString.lastIndexOf(']') + 1;
  let validCartString = rawCartString.slice(0, lastIndex);

  try {
      cartItems = JSON.parse(validCartString);
  } catch (error) {
      console.error("Error parsing cart JSON:", error);
      return res.status(500).json({ success: false, message: 'Invalid cart format.' });
  }

  // Save order to `orders` table
  con.query(
      'INSERT INTO customers (customer_name, customer_email, customer_address, customer_mobile_number, table_number, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [
          customerData.customer_name,
          customerData.customer_email,
          customerData.customer_address,
          customerData.customermob_number,
          customerData.table_number,
          cartItems.reduce((acc, item) => acc + item.total, 0)
      ],
      (err, orderResults) => {
          if (err) {
              console.error("An error occurred:", err);
              return res.status(500).send({ success: false, message: err.message });
          }

          const orderId = orderResults.insertId;

          // Using a counter to keep track of finished queries
          let completedQueries = 0;

          cartItems.forEach(item => {
              con.query(
                  'INSERT INTO order_items (order_id, product_id, restaurant_id, productname, productprice, productimage, description, catagory, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                      orderId,
                      item.product_id,
                      item.restaurant_id,
                      item.productname,
                      item.productprice,
                      item.productimage,
                      item.description,
                      item.catagory,
                      item.quantity,
                      item.total
                  ],
                  err => {
                      completedQueries++;

                      if (err) {
                          console.error("Error inserting item:", err);
                          return res.status(500).send({ success: false, message: err.message });
                      }

                      // If all items have been processed, send response
                      if (completedQueries === cartItems.length) {
                          res.status(200).send({ success: true, message: "Order saved successfully!", orderId: orderId });
                      }
                  }
              );
          });
      }
  );
});

//**************************************************************************************************************************************************************** */
// week wise earning



app.get("/weeklyearnings/:ownerId", (req, res) => {
  const ownerId = req.params.ownerId;
  const commissionRate = 0.02; // 2%
  const GST = 0.18; // 18%

  // SQL query to get daily earnings for the last 2 weeks
  const query = `
  SELECT 
  DATE(ordercomplete_date) as date, 
  SUM(total) as total 
FROM order_items 
WHERE Owner_id = ? AND orderstatus = 0 AND cancelorder = 0 AND ordercomplete_date >= NOW() - INTERVAL 2 WEEK 
GROUP BY DATE(ordercomplete_date)

UNION ALL

SELECT 
  'WEEKLY TOTAL' as date, 
  SUM(total) as total 
FROM order_items 
WHERE Owner_id = ? AND orderstatus = 0 AND cancelorder = 0 AND ordercomplete_date >= NOW() - INTERVAL 2 WEEK AND ordercomplete_date < NOW() - INTERVAL 1 WEEK

UNION ALL

SELECT 
  'WEEKLY TOTAL CURRENT WEEK' as date, 
  SUM(total) as total 
FROM order_items 
WHERE Owner_id = ? AND orderstatus = 0 AND cancelorder = 0 AND ordercomplete_date >= NOW() - INTERVAL 1 WEEK;

  `;

  con.query(query, [ownerId, ownerId, ownerId], (error, results) => {
    if (error) {
      console.error("Error with SQL Query: ", error);  
      return res.status(500).json({ error: 'Error querying the database', details: error });
    }

    if (!results.length) {
      return res.status(404).json({ message: 'No earnings data found for the past week.' });
    }

    const earningsWithCommissionAndGST = results.map(record => {
      const total = record.total;
      const commission = total * commissionRate;
      const amountAfterCommission = total - commission;
      const gstAmount = amountAfterCommission * GST;
      const netAmount = amountAfterCommission - gstAmount;

      return {
        date: record.date,
        total,
        commission,
        gstAmount,
        netAmount
      };
    });

    // Sort by date in descending order
    earningsWithCommissionAndGST.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(earningsWithCommissionAndGST);
    res.status(200).json(earningsWithCommissionAndGST);
  });
});

//***************************************************************************************************************************************************************** */

app.get("/ordersForDay/:ownerId/:date", (req, res) => {
  const ownerId = req.params.ownerId;
  const date = req.params.date;

  const query = `
    SELECT * 
    FROM order_items 
    WHERE Owner_id = ? AND DATE(ordercomplete_date) = ? AND orderstatus = 0 AND cancelorder = 0
  `;

  con.query(query, [ownerId, date], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error querying the database', details: error });
    }

    res.status(200).json(results);
  });
});


//******///***************************************************************************************************************************************************** */ */





//*--------------------------------------------------------*************************************************************************--------------------*
app.post("/login", (req, res) => {
  const { Ownername, Ownerpassward } = req.body;

  if (!Ownername || !Ownerpassward) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const query = "SELECT * FROM signup WHERE Ownername = ?";
  
  con.query(query, [Ownername], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error querying the database', error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. Please try again' });
    }

    const Owner = results[0];
    
    bcrypt.compare(Ownerpassward, Owner.Ownerpassward, async (bcryptErr, isMatch) => {
      if (bcryptErr || !isMatch) {
        return res.status(401).json({ message: 'Invalid credentials. Please try again' });
      }

      const sessionToken = generateSessionToken();
      const createdAtDate = new Date();
      createdAtDate.setDate(createdAtDate.getDate() + 1); // Token expires in 1 day
      const expirationTime = createdAtDate.toISOString().slice(0, 19).replace('T', ' ');

      const storeTokenQuery = `
        INSERT INTO user_sessions (user_id, token, expires_at) 
        VALUES (?, ?, ?);
      `;

      con.query(storeTokenQuery, [Owner.Owner_id, sessionToken, expirationTime], (tokenError, tokenResult) => {
        if (tokenError) {
          console.error("Error storing session token", tokenError);
          return res.status(500).json({ error: 'An error occurred' });
        }
        
        // Save the sessionToken as HttpOnly cookie and return the response
        res.cookie('session_token', sessionToken, { httpOnly: true, maxAge: 86400000 });
        return res.status(200).json({ message: 'Login successful', owner: Owner });
      });
    });
  });
});

//********************************************************************-------------------------------------------------------------------------------------- */
// Helper function to generate a session token
function generateSessionToken() {
  // Logic to generate a unique session token
  // For example: return a random string or use a library like 'crypto'
  const tokenLength = 32;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

//********************************************************************************************************************************************************* */
// const bcrypt = require('bcrypt');
const saltRounds = 10;

app.post("/post", (req, res) => {
  var post_body = req.body;
  post_body.submission_date = new Date();  // Add current date and time

  // Hash the password using bcrypt
  bcrypt.hash(post_body.Ownerpassward, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Hashing error", err);
      res.status(500).json({ error: 'Hashing error' });
      return;
    }
    // Replace plain text password with hashed password
    post_body.Ownerpassward = hashedPassword;

    let sql = 'INSERT INTO signup SET ?';
    con.query(sql, post_body, (error, result) => {
      if (error) {
        console.log(post_body);
        console.log("Database error", error);
        res.status(500).json({ error: 'An error occurred' }); 
      } else { 
        res.status(200).json({ message: "registered save successfully", result: result }); 
      }
    });
  });
});



//*------------------------------------------------*
// server port number
app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
})

// .listen(5000,()=>
//     console.log(`server is running on port 5000`)
//     // console.log('server run 5000 port number')
// )