import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  updateAvatar,
  getUserFollowers,
  getUserFollowing,
  getSuggestedUsers,
} from '../controllers/users.controller';
import { requireAuth, optionalAuth } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../middlewares/upload.middleware';

const router = Router();

router.get('/suggestions', optionalAuth, getSuggestedUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.patch('/profile', requireAuth, updateProfile);
router.post('/avatar', requireAuth, uploadAvatar.single('avatar'), updateAvatar);
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/followers', optionalAuth, getUserFollowers);
router.get('/:username/following', optionalAuth, getUserFollowing);

export default router;
