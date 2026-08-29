import { Router } from 'express';
import {
  toggleFollow,
  getFollowRequests,
  respondFollowRequest,
} from '../controllers/follow.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/:targetUserId', requireAuth, toggleFollow);
router.get('/requests/pending', requireAuth, getFollowRequests);
router.post('/requests/:requestId/respond', requireAuth, respondFollowRequest);

export default router;
