import express from 'express';
import * as usersController from '../controllers/users.controllers.js';

const router = express.Router();


//anexando essas rotas na rota da aplicação
router.post('/sign-up', usersController.signup);
router.post('/sign-in', usersController.signin);

export default router;