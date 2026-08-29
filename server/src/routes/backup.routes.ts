import { Router } from 'express';
import { createBackup, listBackups, downloadBackup } from '../controllers/backup.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.post('/create', createBackup);
router.get('/list', listBackups);
router.get('/download/:filename', downloadBackup);

export default router;
