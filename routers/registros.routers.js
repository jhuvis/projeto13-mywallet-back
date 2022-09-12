import express from 'express';
import authorizationMiddleware from '../middlewares/authorization.middleware.js';
import * as registrosController from '../controllers/registros.controllers.js';

const router = express.Router();

//anexo o middleware nessas rotas
//router.use(authorizationMiddleware); //Express injeta 3 params: req, res, next

//anexando essas rotas na rota da aplicação
router.post('/entrada', registrosController.create);
router.post('/saida', registrosController.createSaida);
router.get('/registros', registrosController.list);

export default router;