import { Router } from 'express';
import { toggleLikePost, getPostLikes } from '../controllers/likes.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/post/:postId', requireAuth, toggleLikePost);
router.get('/post/:postId', optionalAuth, getPostLikes);

export default router;
