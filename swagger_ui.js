const dotenv= require('dotenv');
const express = require('express');
const body_parser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const config = require('./config');
const jwt = require('jsonwebtoken');
const { validateUserData,validate_del,update_data } = require('./validation');
const _ = require('lodash');
const debug = require("debug")("app:startup");

const mysql2 = require('mysql2');
const cors = require('cors');
const { expressjwt: expressJwt } = require('express-jwt');

const app = express();
app.use(cors());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.json());

const config2 = config.jwtConfig;

const jwtMiddleware = expressJwt({
    secret: config.jwtConfig.jwtSecret,
    algorithms: ['HS256'], 
    
}).unless({
    path: [
    '/login',
     '/register'
    ]
});


app.use(function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
      res.status(401).send("invalid token...");
    } else {
      next(err);
    }
  });

// app.use(jwtMiddleware);
// { origin:'http://localhost:5015/api-docs', methods:['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders:['Content-type','Authorization'] }

const { database } = config;
const jwtToken = jwt.sign({ userId: 8 }, config2.jwtSecret);

const connection = mysql2.createConnection({
    host: database.host,
    user: database.user,
    password: database.password,
    database: database.database,
});

connection.connect((error) => {
    if (error) throw error;
    debug("Connected to the database!");
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const token = jwt.sign({ userId: 1, role: 'admin' }, config.jwtConfig.jwtSecret, { expiresIn: config.jwtConfig.jwtExpiration });
    res.setHeader('x-access-token', token);
    res.json({ token });
});

app.get('/protected', jwtMiddleware, (req, res) => {
    const userId = req.auth.userId;
    res.json({ message: 'This is a protected route!' });
});

app.post('/admin/users', jwtMiddleware, (req, res) => {
    if (req.auth.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    // ...
});

app.post('/Register/:firstName/:lastName/:country/:password', (req, res) => {
        const { error, value } = validateUserData(req.params);

        if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    
    for(var val in value){
        if( typeof value[val] === 'string'){
             value[val] = value[val].charAt(0).toUpperCase() + value[val].slice(1);
        }else{
            continue;
        }
     }
        const { id = null, firstName, lastName, country ,password } = value;

        const query = 'INSERT INTO user (id, firstName, lastName, country, password) VALUES (?, ?, ?, ?, ?)';
        const values = [id, firstName, lastName, country, password];

        connection.query(query, values, (error, result) => {
            if (error) {
                console.error('Error inserting data', error);
                res.status(500).json({ error: 'Error inserting data' });
                return;
            }

            const token = jwt.sign({ userId: result.insertId }, config2.jwtSecret, { expiresIn: config2.jwtExpiration });
            res.status(201).json({ token });
        });
    });

app.get('/get_users', jwtMiddleware, (req, res) => {
    debug("Received request for /get_users");
    const query = "SELECT * FROM user ORDER BY id DESC LIMIT 5";
  
    connection.query(query, (error, result) => {
        if (error) {
            console.error('Error retrieving data', error);
            res.status(500).json({ Error: "Error retrieving data" });
            return;
        }
  
        const filteredResults = result.map(row => {
            const { Id, password, ...filteredRow } = row;
            return filteredRow;
        });
  
        res.status(200).json(filteredResults);
        console.log(result);
    });
});

app.delete('/Delete_all', jwtMiddleware,(req, res)=>{

    connection.query("Delete from user", (error, result) => {
        if (error) {
            console.error('Error deleting data', error);
            res.status(500).json({ Error: 'Error deleting data' });
            return;
        }
        console.log({ affectedRows: result});
        res.status(201).json({ affectedRows: result.affectedRows });
    });
});

app.delete('/Delete_user', jwtMiddleware,(req, res)=>{
    const { error, value } = validate_del(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { firstName, lastName, password } = value;
    const query = "DELETE FROM user WHERE firstName=? AND lastName=? AND password=?";
    const values = [ firstName, lastName, password];

    connection.query(query, values, (error, result) => {
        if (error) {
            console.error('Error deleting data', error);
            res.status(500).json({ error: 'Error deleting data' });
            return;
        }

        res.status(201).json({ affectedRows: result.affectedRows });
    });
});


app.put('/update_data', jwtMiddleware, (req, res) => {
    const { userId:Id } = req.auth;
    console.log(Id);

    const { error, value } = update_data(req.body);
    const { id:id2 = Id, firstName:firstName2, lastName:lastName2, country:country2, password:password2 } = value;

    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    
    connection.query("SELECT * FROM user WHERE Id=?", [Id], (error, result1)=>{
        if(error){
            res.status(500).json({ error:"Error with retreiving default userdata"});
        }else{

            // const {firstName, lastname, Country, password, Id =Id } = result1[0];//prev login credentials
            
            const values = [firstName2, lastName2, country2, password2, id2];//new login credentials
            const sql = 'UPDATE user SET firstname=?, lastname=?, country=? ,password=? WHERE id=?';
            connection.query(sql, values, (error, result) => {
                if (error) {
                    console.error("Error updating user data:", error);
                    return res.status(500).json({ error: "Error updating user data" });
                } else {
                    if (result.affectedRows > 0) {
                        console.log(result);
                        res.status(200).json({ message: "User data updated successfully" });
                    } else {
                        res.status(404).json({ error: "User not found" });
                    }
                }
            });
        }
    });
   
});


  debug("Starting server...");
  app.listen(config.port, () => {
      debug(`Server started on port ${config.port}`);
  });