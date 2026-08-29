import { Router } from 'express';
import { searchMusic } from '../controllers/music.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/search', optionalAuth, searchMusic);

export default router;
