import User from './User';
import Company from './Company';
import Partner from './Partner';
import Menu from './Menu';
import MenuPermission from './MenuPermission';
import Permission from './Permission';
import Role from './Role';
import RolePermission from './RolePermission';
import UserPermission from './UserPermission';
import Approval from './Approval';
import ApprovalFile from './ApprovalFile';
import ApprovalComment from './ApprovalComment';
import Transaction from './Transaction';
import Invoice from './Invoice';

// User - Company 관계
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

// User - MenuPermission 관계
User.hasMany(MenuPermission, { foreignKey: 'user_id', as: 'menuPermissions' });
MenuPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Menu - MenuPermission 관계
Menu.hasMany(MenuPermission, { foreignKey: 'menu_id', as: 'menuPermissions' });
MenuPermission.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });

// Menu - Menu (self-referencing for hierarchy)
Menu.belongsTo(Menu, { foreignKey: 'parent_id', as: 'parentMenu' });
Menu.hasMany(Menu, { foreignKey: 'parent_id', as: 'childMenus' });

// User - UserPermission 직접 관계
User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'userPermissions' });
UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Permission - UserPermission 직접 관계
Permission.hasMany(UserPermission, { foreignKey: 'permission_id', as: 'userPermissions' });
UserPermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission' });

// User - Permission 관계 (through UserPermission)
User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'user_id', as: 'permissions' });
Permission.belongsToMany(User, { through: UserPermission, foreignKey: 'permission_id', as: 'users' });

// Role - Permission 관계 (through RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

// Approval 관련 관계
User.hasMany(Approval, { foreignKey: 'requester_id', as: 'requestedApprovals' });
User.hasMany(Approval, { foreignKey: 'approver_id', as: 'approvingApprovals' });
Approval.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });
Approval.belongsTo(User, { foreignKey: 'approver_id', as: 'approver' });
Approval.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Approval, { foreignKey: 'company_id', as: 'approvals' });

// ApprovalFile 관계
Approval.hasMany(ApprovalFile, { foreignKey: 'approval_id', as: 'files' });
ApprovalFile.belongsTo(Approval, { foreignKey: 'approval_id', as: 'approval' });
ApprovalFile.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(ApprovalFile, { foreignKey: 'uploaded_by', as: 'uploadedFiles' });

// ApprovalComment 관계
Approval.hasMany(ApprovalComment, { foreignKey: 'approval_id', as: 'comments' });
ApprovalComment.belongsTo(Approval, { foreignKey: 'approval_id', as: 'approval' });
ApprovalComment.belongsTo(User, { foreignKey: 'user_id', as: 'author' });
User.hasMany(ApprovalComment, { foreignKey: 'user_id', as: 'approvalComments' });

// Transaction 관련 관계
Transaction.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Transaction, { foreignKey: 'company_id', as: 'transactions' });
Transaction.belongsTo(Company, { foreignKey: 'partner_company_id', as: 'partnerCompany' });
Company.hasMany(Transaction, { foreignKey: 'partner_company_id', as: 'partnerTransactions' });
Transaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Transaction, { foreignKey: 'created_by', as: 'createdTransactions' });

// Invoice 관련 관계
Invoice.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Invoice, { foreignKey: 'company_id', as: 'invoices' });
Invoice.belongsTo(Company, { foreignKey: 'partner_company_id', as: 'partnerCompany' });
Company.hasMany(Invoice, { foreignKey: 'partner_company_id', as: 'partnerInvoices' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Invoice, { foreignKey: 'created_by', as: 'createdInvoices' });

export {
  User,
  Company,
  Menu,
  MenuPermission,
  Permission,
  Role,
  RolePermission,
  UserPermission,
  Approval,
  ApprovalFile,
  ApprovalComment,
  Transaction,
  Invoice
}; 