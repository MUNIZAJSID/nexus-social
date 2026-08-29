import { Router } from 'express';
import { getClips, incrementClipView } from '../controllers/clips.controller';
import { optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getClips);
router.post('/:postId/view', optionalAuth, incrementClipView);

export default router;
