import { Router } from 'express';
import {
  getAdminOverview,
  getAllUsers,
  toggleUserBlock,
  toggleUserRole,
  deleteUser,
  getAllPosts,
} from '../controllers/admin.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/admin.middleware';

const router = Router();

// Todas as rotas admin requerem autenticação e cargo ADMIN
router.use(requireAuth, requireAdmin);

router.get('/overview', getAdminOverview);
router.get('/users', getAllUsers);
router.patch('/users/:userId/block', toggleUserBlock);
router.patch('/users/:userId/role', toggleUserRole);
router.delete('/users/:userId', deleteUser);
router.get('/posts', getAllPosts);

export default router;
