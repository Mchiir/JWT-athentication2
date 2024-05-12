const express = require('express');
const body_parser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const config = require('./config');
const jwt = require('jsonwebtoken');
const { validateUserData,validate_del,update_data } = require('./validation');
const _ = require('lodash');
const debug = require("debug")("app:startup");

// const unless = require('express-unless');
// const Joi = require("joi");
// const userRoutes = require("./routes/user");
// const serverConfig = config.get("server");

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

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const token = jwt.sign({ userId: 1, role: 'admin' }, config.jwtConfig.jwtSecret, { expiresIn: config.jwtConfig.jwtExpiration });
    res.setHeader('x-access-token', token);//set in localStorage;
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
    //...   
});
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

app.post('/Register', (req, res) => {
    /*
    const { id, firstName, lastName, country } = req.body;

    const userData = {
        id: id || null,
        firstName: firstName || 'Kamali',
        lastName: lastName || 'Washington',
        country: country || 'USA',
    };
 */
    const { error, value } = validateUserData(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
  
    const { id, firstName, lastName, country ,password } = value;
    const query = 'INSERT INTO user (id, firstName, lastName, country, password) VALUES (?, ?, ?, ?, ?)';
    const values = [id, firstName, lastName, country, password];

    connection.query(query, values, (error, result) => {
        if (error) {
            console.error('Error inserting data', error);
            res.status(500).json({ error: 'Error inserting data' });
            return;
        }

        const token = jwt.sign({ userId: id }, config2.jwtSecret, { expiresIn: config2.jwtExpiration });
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
  
        // const filteredResults = _.filter(result, (row) => row.Id >= 30);
        const filteredResults = result.map(row => {
            const { Id, password, ...filteredRow } = row;
            return filteredRow;
        });
  
        res.status(200).json(filteredResults);
        console.log(result);
    });
});

app.delete('/Delete_user', jwtMiddleware,(req, res)=>{
    const { error, value } = validate_del(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { firstName, lastName, password } = value;
    const query = "DELETE FROM user WHERE firstName=? AND lastName=? AND password=?";
    //query= 'delete from user where (firstname="napoleon" AND lastname="mugesera") OR country="Nowhere"';
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
    const { error, value } = update_data(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    const { firstName, lastName, country, password } = value;
    const values = [firstName, lastName, country, password];
    const sql = 'UPDATE user SET firstname=?, lastname=?, country=? WHERE password=?';
    connection.query(sql, values, (error, result) => {
        if (error) {
            console.error("Error updating user data:", error);
            return res.status(500).json({ error: "Error updating user data" });
        } else {
            if (result.affectedRows > 0) {
                res.status(200).json({ message: "User data updated successfully" });
            } else {
                res.status(404).json({ error: "User not found" });
            }
        }
    });
});


  debug("Starting server...");
  app.listen(config.port, () => {
      debug(`Server started on port ${config.port}`);
  });