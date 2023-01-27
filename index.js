const express = require('express');
const app = express();
require('dotenv').config(); 
const { User, Kitten } = require('./db');
const jwt = require('jsonwebtoken');

console.log("secret:", process.env.SIGNING_SECRET)
const SIGNING_SECRET = process.env.SIGNING_SECRET;

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

const setUser = async (req, res, next) => {
  try {
    const auth = req.header("Authorization");
    if (!auth) {
      next()
    }else {
      const [, token] = auth.split(' ')
      const user = jwt.verify(token, SIGNING_SECRET);
      req.user = user;
      console.log(user)
      next()
    }
  } catch (error){
    console.log(error)
    next()
  }
}

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(setUser);


app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});


// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password
app.post('/register', setUser, async  (req, res, next) => {
  try{
    const {username, password} = req.body;
    console.log(username, password);
    const { id } = await User.create({ username, password });
    const token = jwt.sign({ id, username }, SIGNING_SECRET)
    res.send({message: 'success', token})

  } catch (error){
    console.log(error)
    next(error);
  }

})

// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB

// GET /kittens/:id
// TODO - takes an id and returns the cat with that id

app.get('/kittens/:id', setUser, async (req, res, next) => {
  try{  
    const { id } = req.params;
    console.log({id}, req.user.id)
    const kitten = await Kitten.findOne({where :{ id:req.params }})
    if(id === req.user.id) {
      res.send(kitten)
      console.log(kitten)
      return kitten;
    } else {
      res.sendStatus(401)
      return;
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color

app.post('/kittens', setUser, async (req, res, next) => {
  try{
    if(!req.user){
      res.sendStatus(401)
    } else {
      ownerId = req.user.id
      const kitten = await Kitten.create({ownerId: req.user.id})
      
  }
  } catch(error){
    console.log(error)
    next(error)
  }
})
// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id

app.delete('/kittens/:id', setUser, async(req, res, next) => {
  if(!req.user){
    res.sendStatus(401)
  }

})
// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
