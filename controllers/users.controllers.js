import joi from 'joi';
import mongo from '../db/db.js';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
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

let db = await mongo();

const signup = async (req, res) => {

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
};

const signin = async (req, res) => {

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
  };

export { signup, signin };