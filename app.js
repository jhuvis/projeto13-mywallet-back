import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';


const signupSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().required().strict(),
  confirmPassword: joi.string().valid(joi.ref('password')).required().strict(),
});

const signinSchema = joi.object({
  email: joi.string().email().required(),
  password: joi.string().required(),
});

const entradaSchema = joi.object({
    valor: joi.number().positive().required(),
    desc: joi.string().required(),
  });

dotenv.config();

const server = express();
server.use(cors());
server.use(json());

const mongoClient = new MongoClient(process.env.MONGO_URI);

console.log(process.env.MONGO_URI);

let db;

mongoClient.connect().then(()=> {
  db = mongoClient.db('mywallet');
});

server.post('/sign-up', async (req, res) => {
  const { name, email, password } = req.body;

  const validation = signupSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) 
  {
    console.log(validation.error.details);
    res.sendStatus(422);
    return;
  }

  const hashPassword = bcrypt.hashSync(password, 11);

  try {
    const u = await db.collection('users').findOne({name : name });
    if(u) 
    {
      return res.sendStatus(409);
    }
    else
    {
      db.collection('users').insertOne({
      name,
      email,
      password: hashPassword
    })
    return res.sendStatus(201);
    }

  } catch (error) {
    console.error(error)
    return res.send(500)
  }
});

server.post('/sign-in', async (req, res) => {
  const { email, password } = req.body;
  const lastStatus = Date.now();

  const validation = signinSchema.validate(req.body, {
    abortEarly: false,
  });

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    res.status(422).send(errors);
    return;
  }

  const user = await db.collection('users').findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    const u = await db.collection('sessions').findOne({userId : user._id });
    if(u)
    {
        await db.collection('sessions').deleteOne({ _id: new ObjectId(u._id) });
    }

    const token = uuid();
    db.collection('sessions').insertOne({
      token,
      userId: user._id,
      lastStatus : lastStatus,
    })

    return res.send(token)
  } else {
    return res.sendStatus(401);
  }
});

server.post('/entrada', async (req, res) => {
    const valor = req.body.valor;
    const desc = req.body.desc;
    const token = req.headers.authorization?.replace('Bearer ', '');
  
    
    const validation = entradaSchema.validate(req.body, { abortEarly: false });
    if (validation.error) 
    {
      const erros = validation.error.details.map((detail) => detail.message);
      res.status(422).send(erros);
      return;
    }
    
    try {
      const u = await db.collection('sessions').findOne({token : token });
      if(u) 
      {
        const msg = {from: u.userId, desc: desc, valor: valor, time: dayjs().format("DD/MM")};
        db.collection('registros').insertOne(msg);
        return res.sendStatus(201);
      }
      else
      {
        return res.sendStatus(409);
      }
      
  
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  });

  server.post('/saida', async (req, res) => {
    const valor = req.body.valor;
    const desc = req.body.desc;
    const token = req.headers.authorization?.replace('Bearer ', '');
  
    
    const validation = entradaSchema.validate(req.body, { abortEarly: false });
    if (validation.error) 
    {
      const erros = validation.error.details.map((detail) => detail.message);
      res.status(422).send(erros);
      return;
    }
    
    try {
      const u = await db.collection('sessions').findOne({token : token });
      if(u) 
      {
        const msg = {from: u.userId, desc: desc, valor: -valor, time: dayjs().format("DD/MM")};
        db.collection('registros').insertOne(msg);
        return res.sendStatus(201);
      }
      else
      {
        return res.sendStatus(409);
      }
      
  
    } catch (error) {
      console.error(error);
      return res.sendStatus(500);
    }
  });

  server.get('/registros', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const u = await db.collection('sessions').findOne({token : token });
    if(!u)
    {
        return res.sendStatus(409);
    }
    
    try {
      const registros = await db.collection('registros').find({
        from : u.userId
      }).toArray();
  
    return res.send(registros);

    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });
  
  server.post('/status', async (req, res) => {
    const { token } = req.headers;
    const lastStatus = Date.now();
    try {
      const u = await db.collection('sessions').findOne({token : token });
      if(!u)
      {
        return res.sendStatus(404);
      }
      else
      {
        await db.collection('sessions').updateOne({ token: token }, { $set: {lastStatus} });
        res.sendStatus(200);
      }
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  });


  setInterval(async () => {
    const limit = 10000;
    const now = Date.now();
    try {
      const p = await db.collection('sessions').find().toArray();
      for(let i = 0; i < p.length; i++)
      {
        if(p[i].lastStatus + limit < now )
        {
          await db.collection('sessions').deleteOne({ _id: new ObjectId(p[i]._id) });  
        }
      }
    } catch (error) {
      console.error(error);
    }
    
  }, 400000);


server.listen(5000, () => {
  console.log("Rodando em http://localhost:5000");
});

