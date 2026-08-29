import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getUserHighlights,
  createHighlight,
  deleteHighlight,
} from '../controllers/highlights.controller';

const router = Router();

router.get('/user/:userId', optionalAuth, getUserHighlights);
router.post('/', requireAuth, createHighlight);
router.delete('/:id', requireAuth, deleteHighlight);

export default router;
