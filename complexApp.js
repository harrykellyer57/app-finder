/* 
Filename: complexApp.js
Content: A complex JavaScript application demonstrating various advanced concepts and techniques.
*/

// Importing external libraries and modules
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Initializing the application
const app = express();

// Setting up middleware
app.use(bodyParser.json());

// Configuring database connection
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost/complexApp';

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(() => console.log('Connected to the database'))
   .catch((error) => console.error(`Error connecting to the database: ${error}`));

// Defining User Schema and Model
const userSchema = new mongoose.Schema({
   username: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   email: { type: String, required: true, unique: true },
   role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

// API endpoints
app.post('/api/register', async (req, res) => {
   try {
      const { username, password, email } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({ username, password: hashedPassword, email });
      await user.save();

      res.status(201).json({ message: 'User registered successfully' });
   } catch (error) {
      res.status(500).json({ error: 'Error registering user' });
   }
});

app.post('/api/login', async (req, res) => {
   try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (!user) {
         return res.status(404).json({ error: 'User not found' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
         return res.status(401).json({ error: 'Invalid password' });
      }

      const token = jwt.sign({ username: user.username, role: user.role }, 'secretKey', { expiresIn: '1h' });
      res.status(200).json({ token });
   } catch (error) {
      res.status(500).json({ error: 'Error logging in' });
   }
});

// Handling invalid routes
app.use((req, res) => {
   res.status(404).json({ error: 'Route not found' });
});

// Starting the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`Server listening on port ${port}`);
});