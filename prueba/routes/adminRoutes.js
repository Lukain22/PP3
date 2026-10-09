const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requirePermission } = require('../rbac/guard');
const {
  listPermissions,
  listRoles,
  getFormOptions,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  duplicateRole,
  listAssignableRoles,
  getUserAccess,
  setUserRoles
} = require('../controllers/rolesController');
const {
  getAllTickets,
  getAnyTicket,
  updateAnyTicket,
  deleteAnyTicket,
  getAnyTicketHistory,
  getAnyTicketComments,
  addAnyTicketComment,
  updateAnyComment,
  deleteAnyComment,
  getUsers,
  getUser,
  updateUserRole
} = require('../controllers/adminController');

const {
  getSlaPolicies,
  updateSlaPolicies
} = require('../controllers/slaController');
const {
  getGroups,
  getGroupById,
  getTechnicians,
  createGroup,
  updateGroup,
  deleteGroup
} = require('../controllers/groupsController');
const {
  listSolutions,
  getSolution,
  listSolutionGroups,
  createSolution,
  updateSolution,
  setSolutionStatus,
  setSolutionApproval,
  deleteSolution
} = require('../controllers/solutionsController');

router.use(authMiddleware, requirePermission('admin.access'));

router.get('/tickets', requirePermission('tickets.view'), getAllTickets);
router.get('/tickets/:id/history', requirePermission('tickets.view'), getAnyTicketHistory);
router.get('/tickets/:id', requirePermission('tickets.view'), getAnyTicket);
router.patch('/tickets/:id', updateAnyTicket);
router.delete('/tickets/:id', requirePermission('tickets.delete'), deleteAnyTicket);
router.get('/tickets/:id/comments', requirePermission('tickets.view'), getAnyTicketComments);
router.post('/tickets/:id/comments', requirePermission('tickets.comment'), addAnyTicketComment);
router.patch('/comments/:commentId', requirePermission('tickets.edit'), updateAnyComment);
router.delete('/comments/:commentId', requirePermission('tickets.edit'), deleteAnyComment);

router.get('/users', requirePermission('admin.users'), getUsers);
router.get('/users/role-options', requirePermission('admin.users'), listAssignableRoles);
router.get('/users/:id', requirePermission('admin.users'), getUser);
router.get('/users/:id/access', requirePermission('admin.users'), getUserAccess);
router.put('/users/:id/roles', requirePermission('admin.users'), setUserRoles);
router.patch('/users/:id/role', requirePermission('admin.users'), updateUserRole);

router.get('/sla-policies', requirePermission('admin.settings'), getSlaPolicies);
router.put('/sla-policies', requirePermission('admin.settings'), updateSlaPolicies);

router.get('/groups', requirePermission('admin.groups'), getGroups);
router.get('/groups/technicians', requirePermission('admin.groups'), getTechnicians);
router.get('/groups/:id', requirePermission('admin.groups'), getGroupById);
router.post('/groups', requirePermission('admin.groups'), createGroup);
router.patch('/groups/:id', requirePermission('admin.groups'), updateGroup);
router.delete('/groups/:id', requirePermission('admin.groups'), deleteGroup);

router.get('/permissions', requirePermission('admin.roles'), listPermissions);
router.get('/roles/options', requirePermission('admin.roles'), getFormOptions);
router.get('/roles', requirePermission('admin.roles'), listRoles);
router.post('/roles', requirePermission('admin.roles'), createRole);
router.get('/roles/:id', requirePermission('admin.roles'), getRole);
router.patch('/roles/:id', requirePermission('admin.roles'), updateRole);
router.delete('/roles/:id', requirePermission('admin.roles'), deleteRole);
router.post('/roles/:id/duplicate', requirePermission('admin.roles'), duplicateRole);

const canManageSolutions = requirePermission('kb.create', 'kb.edit', 'kb.delete', 'kb.publish', 'kb.approve');
router.get('/solutions/groups', canManageSolutions, listSolutionGroups);
router.get('/solutions', canManageSolutions, listSolutions);
router.post('/solutions', requirePermission('kb.create'), createSolution);
router.get('/solutions/:id', canManageSolutions, getSolution);
router.patch('/solutions/:id', requirePermission('kb.edit'), updateSolution);
router.patch('/solutions/:id/status', requirePermission('kb.publish'), setSolutionStatus);
router.patch('/solutions/:id/approval', requirePermission('kb.approve'), setSolutionApproval);
router.delete('/solutions/:id', requirePermission('kb.delete'), deleteSolution);

module.exports = router;
