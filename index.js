import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';
import registroRouter from './routers/registros.routers.js';
import sessionsRouter from './routers/sessions.routers.js';
import usersRouter from './routers/users.routers.js';

import mongo from './db/db.js';

let db = await mongo();

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use(registroRouter);
app.use(sessionsRouter);
app.use(usersRouter);

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
    
  }, 15000);



app.listen(5000, () => console.log(`App running in port: 5000`));