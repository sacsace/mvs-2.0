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
import Payroll from './Payroll';
import Notice from './Notice';
import Expense from './Expense';
import ExpenseItem from './ExpenseItem';

// User - Company 관계
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

// Partner - Company 관계
Partner.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Partner, { foreignKey: 'company_id', as: 'partners' });

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

// Payroll 관련 관계
Payroll.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(Payroll, { foreignKey: 'user_id', as: 'payrolls' });
Payroll.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });
User.hasMany(Payroll, { foreignKey: 'created_by', as: 'createdPayrolls' });
Payroll.belongsTo(User, { foreignKey: 'updated_by', as: 'Updater' });
User.hasMany(Payroll, { foreignKey: 'updated_by', as: 'updatedPayrolls' });

// Notice 관련 관계
Notice.belongsTo(Company, { foreignKey: 'company_id', as: 'Company' });
Company.hasMany(Notice, { foreignKey: 'company_id', as: 'notices' });
Notice.belongsTo(User, { foreignKey: 'author_id', as: 'Author' });
User.hasMany(Notice, { foreignKey: 'author_id', as: 'authoredNotices' });
Notice.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });
User.hasMany(Notice, { foreignKey: 'created_by', as: 'createdNotices' });
Notice.belongsTo(User, { foreignKey: 'updated_by', as: 'Updater' });
User.hasMany(Notice, { foreignKey: 'updated_by', as: 'updatedNotices' });

// Expense 관련 관계
Expense.belongsTo(Company, { foreignKey: 'company_id', as: 'company', targetKey: 'id' });
Company.hasMany(Expense, { foreignKey: 'company_id', as: 'expenses', sourceKey: 'id' });
Expense.belongsTo(User, { foreignKey: 'requester_id', as: 'Requester' });
User.hasMany(Expense, { foreignKey: 'requester_id', as: 'requestedExpenses' });
Expense.belongsTo(User, { foreignKey: 'approver_id', as: 'Approver' });
User.hasMany(Expense, { foreignKey: 'approver_id', as: 'approvingExpenses' });
Expense.belongsTo(User, { foreignKey: 'created_by', as: 'Creator' });
User.hasMany(Expense, { foreignKey: 'created_by', as: 'createdExpenses' });
Expense.belongsTo(User, { foreignKey: 'updated_by', as: 'Updater' });
User.hasMany(Expense, { foreignKey: 'updated_by', as: 'updatedExpenses' });

// ExpenseItem 관련 관계
Expense.hasMany(ExpenseItem, { foreignKey: 'expense_id', as: 'Items' });
ExpenseItem.belongsTo(Expense, { foreignKey: 'expense_id', as: 'Expense' });

export {
  User,
  Company,
  Menu,
  Notice,
  Expense,
  ExpenseItem,
  MenuPermission,
  Permission,
  Role,
  RolePermission,
  UserPermission,
  Approval,
  ApprovalFile,
  ApprovalComment,
  Transaction,
  Invoice,
  Payroll
}; 