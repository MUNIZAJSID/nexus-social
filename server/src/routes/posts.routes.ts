import { Router } from 'express';
import {
  createPost,
  getFeed,
  getExplorePosts,
  getUserPosts,
  getSavedPosts,
  getPostById,
  deletePost,
  toggleSavePost,
} from '../controllers/posts.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { uploadPostMedia } from '../middlewares/upload.middleware';

const router = Router();

router.post('/', requireAuth, uploadPostMedia.array('media', 10), createPost);
router.get('/feed', optionalAuth, getFeed);
router.get('/explore', optionalAuth, getExplorePosts);
router.get('/saved', requireAuth, getSavedPosts);
router.get('/user/:username', optionalAuth, getUserPosts);
router.get('/:postId', optionalAuth, getPostById);
router.delete('/:postId', requireAuth, deletePost);
router.post('/:postId/save', requireAuth, toggleSavePost);

export default router;
