require('dotenv').config();
const con = require("./config.js");
const express = require('express');
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const app = express();

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

const allowedOrigins = ['http://localhost:4200', 'http://localhost:49934'];

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

  con.query('SELECT * FROM orders WHERE restaurant_id = ? AND orderstatus = 0', [restaurant_id], (error, result) => {
    if (error) {
      console.error("Error fetching orders:", error);
      return res.status(500).json({ success: false, message: "Unable to fetch orders. Please try again later." });
    }
    
    res.json( result );
    
  });
});


//***************************************************************************************************************************************************************** */
// get orders product with owner
app.get("/get_ordersproduct/:id", (req, res) => {
 const restaurant_id  = req.params.id;

  const query = `
  SELECT 
    o.order_id,
    o.orderstatus,
    o.quantity,
    o.submission_date,
    c.table_number,
    c.customer_name,
    c.customermob_number,
    p.productname,
    p.productimage,
    p.productprice,
    p.catagory
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN products p ON o.product_id = p.product_id
  WHERE o.orderstatus = 1 AND o.restaurant_id = ?
`;
  
  con.query(query, [restaurant_id], (error, result) => {
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

  const query = `
  SELECT 
    o.order_id,
    o.orderstatus,
    o.quantity,
    o.total,
    o.submission_date,
    c.table_number,
    c.customer_name,
    c.customermob_number,
    p.productname,
    p.productimage,
    p.productprice,
    p.catagory
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN products p ON o.product_id = p.product_id
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
  
    const query = `
    SELECT 
      o.order_id,
      o.orderstatus,
      o.cancelorder,
      o.quantity,
      o.submission_date,
      o.ordercomplete_date,
      o.total,
      c.table_number,
      c.customer_name,
      c.customermob_number,
      p.productname,
      p.productimage,
      p.productprice
    FROM orders o
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN products p ON o.product_id = p.product_id
    WHERE o.orderstatus = 0 AND o.restaurant_id = ?
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
  const query = 'UPDATE orders SET orderstatus = ?, ordercomplete_date = ? , productname = ? , productprice = ? , productimage = ? , catagory = ? WHERE order_id = ?';
  ordercomplete_date = new Date();
  // Assuming orderstatus is a boolean, where true means the order is active and false means it's deleted
  con.query(query, [false , ordercomplete_date,element.productname,element.productprice, element.productimage , element.catagory, productId], (err, result) => {
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
  const query = `UPDATE orders SET orderstatus = ?, cancelorder = ? WHERE order_id IN (?)`;
  
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
app.put('/api/cancelOrder/:itemId', (req, res) => {
  const itemId = req.params.itemId;
  const cancelstatus = req.body.cancelstatus;

  con.query('UPDATE orders SET cancelstatus = ? WHERE order_id = ?', [cancelstatus, itemId], (error, result) => {
    if (error) {
      console.error('Error updating cancel status:', error);
      return res.status(500).send("Error updating cancel status");
    }
    res.json({ message: 'Cancel status updated successfully' });
  });
});

/////////------------------------------------------------------------------------------------------------------------------------------------------------------------*
// post order
app.post('/post_tableproduct', (req, res) => {
  const customer = req.body.customer;
   // Add current date and time
  let cart;
  let rawCartString = req.body.cart[0];
  
  // Clean the string
  let lastIndex = rawCartString.lastIndexOf(']') + 1;
  let validCartString = rawCartString.slice(0, lastIndex);
  
  try {
      cart = JSON.parse(validCartString);
  } catch (error) {
      console.error("Error parsing cart JSON:", error);
      res.status(500).json({ success: false, message: 'Invalid cart format.' });
      return;
  }
  

  // const table_position = req.body.table_position;

  console.log(customer);
  console.log(cart);

  const query1 = 'INSERT INTO customers (customer_name, customer_email, customer_address, customermob_number , table_number) VALUES (?, ?, ?, ?,?)';

  con.query(query1, [customer.customer_name, customer.customer_email, customer.customer_address, customer.customermob_number , customer.table_number ], (err, result) => {
      if (err) throw err;

      const customerId = result.insertId;
      const query2 = 'INSERT INTO orders (customer_id, product_id, quantity, restaurant_id, orderstatus, submission_date, total) VALUES (?, ?, ?, ? ,? ,? ,?)';
      
      cart.forEach(itemString => {
          let item;

          // If the item is a string, parse it
          if (typeof itemString === "string") {
            // Remove the number at the end to ensure it's a valid JSON string
            const validJsonString = itemString.split(']')[0] + ']';
            item = JSON.parse(validJsonString);
        } else {
            item = itemString;
        }
        submission_date = new Date(); 

          if (item && "product_id" in item && "quantity" in item && "restaurant_id" in item ) {
              con.query(query2, [customerId, item.product_id, item.quantity, item.restaurant_id , true ,submission_date , item.total], (err) => {
                  if (err) {
                      console.error("Error inserting into orders:", err);
                      res.status(500).json({ success: false, message: 'Error processing your request.' });
                      return;
                  }
              });
          } else {
              console.error("Missing properties in cart item:", item);
          }
      });

      res.json({ success: true, message: 'Order placed successfully!' });
  });
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
FROM orders o 
JOIN hotelinfo r ON o.restaurant_id = r.restaurant_id 
WHERE r.Owner_id = ? AND o.orderstatus = 0 AND o.cancelorder IS NULL AND ordercomplete_date >= NOW() - INTERVAL 2 WEEK 
GROUP BY DATE(ordercomplete_date)

UNION ALL

SELECT 
  'WEEKLY TOTAL' as date, 
  SUM(total) as total 
FROM orders o 
JOIN hotelinfo r ON o.restaurant_id = r.restaurant_id 
WHERE r.Owner_id = ? AND o.orderstatus = 0 AND o.cancelorder IS NULL AND ordercomplete_date >= NOW() - INTERVAL 2 WEEK AND ordercomplete_date < NOW() - INTERVAL 1 WEEK

UNION ALL

SELECT 
  'WEEKLY TOTAL CURRENT WEEK' as date, 
  SUM(total) as total 
FROM orders o 
JOIN hotelinfo r ON o.restaurant_id = r.restaurant_id 
WHERE r.Owner_id = ? AND o.orderstatus = 0 AND o.cancelorder IS NULL AND ordercomplete_date >= NOW() - INTERVAL 1 WEEK;

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
    FROM orders o 
    JOIN hotelinfo r ON o.restaurant_id = r.restaurant_id 
    WHERE r.Owner_id = ? AND DATE(ordercomplete_date) = ? AND o.orderstatus = 0 AND o.cancelorder IS NULL
  `;

  con.query(query, [ownerId, date], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Error querying the database', details: error });
    }

    res.status(200).json(results);
  });
});


//******///***************************************************************************************************************************************************** */ */


app.post("/login", (req, res) => {
  const { Ownername, Ownerpassward } = req.body;

  if (!Ownername || !Ownerpassward) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  // Retrieve the hashed password for the given Ownername
  const query = "SELECT * FROM signup WHERE Ownername = ?";
  con.query(query, [Ownername], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Error querying the database', error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials. Please try again' });
    }

    const Owner = results[0];
    
    // Compare the provided password with the stored hashed password
    bcrypt.compare(Ownerpassward, Owner.Ownerpassward, (bcryptErr, isMatch) => { // Make sure you use the correct column name for the hashed password, I assumed it's "Ownerpassward"
      if (bcryptErr || !isMatch) {
        return res.status(401).json({ message: 'Invalid credentials. Please try again' });
      }
      return res.status(200).json({ message: 'Login successful', Owner });
    });
  });
});




//*----------------------------------------------------------------------------*
// app.post("/post", (req, res) => {
//   // console.log(req.body);
//   var post_body =  req.body;
//   post_body.submission_date = new Date();  // Add current date and time
//   let sql ='INSERT INTO signup SET ?';
//   con.query(sql, post_body ,(error, result) => {
//       if(error){
//         console.log(post_body);
//         console.log("sorry", error);
//         res.status(500).json({ error: 'An error occurred' }); // response send here
//       } else { 
//         res.status(200).json({ message: "registered save successfully", result: result }); // response send here
//       }
//   });
//   // no need for res.end() her
//   // res.end();
// });

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