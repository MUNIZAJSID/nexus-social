import { Router } from 'express';
import { register, login, getMe, updatePassword } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/change-password', requireAuth, updatePassword);

export default router;
