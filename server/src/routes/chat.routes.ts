import { Router } from 'express';
import {
  getConversations,
  getOrCreateDirectConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from '../controllers/chat.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { uploadChatMedia } from '../middlewares/upload.middleware';

const router = Router();

router.get('/conversations', requireAuth, getConversations);
router.post('/conversations/direct/:targetUserId', requireAuth, getOrCreateDirectConversation);
router.get('/conversations/:conversationId/messages', requireAuth, getMessages);
router.post(
  '/conversations/:conversationId/messages',
  requireAuth,
  uploadChatMedia.single('media'),
  sendMessage
);
router.post('/conversations/:conversationId/read', requireAuth, markConversationAsRead);

export default router;
