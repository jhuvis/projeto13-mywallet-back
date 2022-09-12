import mongo from '../db/db.js';

//middleware - daqui a pouco ele sai daqui
async function hasUser(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    let db = await mongo();

    const user = await db.collection('sessions').findOne({token : token });

    if (!user) {
      return res.sendStatus(401);
    }

    res.locals.bolinha = user;
    //Passar pro controller
    next();
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export default hasUser;