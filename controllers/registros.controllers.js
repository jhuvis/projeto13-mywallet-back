import joi from 'joi';
import dayjs from 'dayjs';

import mongo from '../db/db.js';

const entradaSchema = joi.object({
    valor: joi.number().positive().required(),
    desc: joi.string().required(),
  });

let db = await mongo();

const create = async (req, res) => {

  console.log('CONTROLLER ', res.locals);
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
};

const createSaida = async (req, res) => {

    console.log('CONTROLLER ', res.locals);
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
  };

const list = async (req, res) => {
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
};

export { create, createSaida, list };