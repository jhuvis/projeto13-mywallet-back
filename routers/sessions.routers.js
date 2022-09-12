import express from 'express';
import * as sessionsController from '../controllers/sessions.controllers.js';

const router = express.Router();


//anexando essas rotas na rota da aplicação
router.post('/status', sessionsController.status);

export default router;
