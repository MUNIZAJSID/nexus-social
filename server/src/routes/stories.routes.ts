import { Router } from 'express';
import {
  getStoriesFeed,
  createStory,
  viewStory,
  toggleLikeStory,
  getStoryViewers,
  deleteStory,
  getUserHighlights,
  voteStorySticker,
  answerStorySticker,
  replyToStory,
} from '../controllers/stories.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { uploadPostMedia } from '../middlewares/upload.middleware';

const router = Router();

router.get('/feed', optionalAuth, getStoriesFeed);
router.post('/', requireAuth, uploadPostMedia.single('media'), createStory);
router.post('/:storyId/view', requireAuth, viewStory);
router.post('/:storyId/like', requireAuth, toggleLikeStory);
router.get('/:storyId/viewers', requireAuth, getStoryViewers);
router.delete('/:storyId', requireAuth, deleteStory);
router.get('/highlights/:username', optionalAuth, getUserHighlights);
router.post('/stickers/:stickerId/vote', requireAuth, voteStorySticker);
router.post('/stickers/:stickerId/answer', requireAuth, answerStorySticker);
router.post('/:storyId/reply', requireAuth, replyToStory);

export default router;
