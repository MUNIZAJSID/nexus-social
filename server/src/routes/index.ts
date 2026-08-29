import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import postsRoutes from './posts.routes';
import commentsRoutes from './comments.routes';
import likesRoutes from './likes.routes';
import followRoutes from './follow.routes';
import chatRoutes from './chat.routes';
import notificationsRoutes from './notifications.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';
import backupRoutes from './backup.routes';
import storiesRoutes from './stories.routes';
import clipsRoutes from './clips.routes';
import musicRoutes from './music.routes';
import highlightsRoutes from './highlights.routes';
import { getStorageStats } from '../services/storage.service';
import { getLocalIPAddresses } from '../config/network';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/posts', postsRoutes);
router.use('/stories', storiesRoutes);
router.use('/highlights', highlightsRoutes);
router.use('/clips', clipsRoutes);
router.use('/music', musicRoutes);
router.use('/comments', commentsRoutes);
router.use('/likes', likesRoutes);
router.use('/follow', followRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/backup', backupRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'online',
    appName: 'NEXUS Social',
    timestamp: new Date(),
    ips: getLocalIPAddresses(),
    storage: getStorageStats(),
  });
});

export default router;
