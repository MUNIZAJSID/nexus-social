import { Router } from 'express';
import { addComment, getComments, deleteComment } from '../controllers/comments.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/post/:postId', optionalAuth, getComments);
router.post('/post/:postId', requireAuth, addComment);
router.delete('/:commentId', requireAuth, deleteComment);

export default router;
