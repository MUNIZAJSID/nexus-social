import { Router } from 'express';
import {
  getNotifications,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from '../controllers/notifications.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', requireAuth, getNotifications);
router.get('/unread-count', requireAuth, getUnreadNotificationCount);
router.post('/read-all', requireAuth, markAllNotificationsAsRead);

export default router;
