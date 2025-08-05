import { Sequelize, ModelStatic, Model } from 'sequelize';
import config from '../config';
import Company from './Company';
import CompanyGst from './CompanyGst';
import User from './User';
import Menu from './Menu';
import MenuPermission from './MenuPermission';
import Permission from './Permission';
import Role from './Role';
import RolePermission from './RolePermission';
import UserPermission from './UserPermission';
import Approval from './Approval';
import ApprovalFile from './ApprovalFile';
import Transaction from './Transaction';

const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
  }
);

interface DbModels {
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
  Company: typeof Company;
  CompanyGst: typeof CompanyGst;
  User: typeof User;
  Menu: typeof Menu;
  MenuPermission: typeof MenuPermission;
  Permission: typeof Permission;
  Role: typeof Role;
  RolePermission: typeof RolePermission;
  UserPermission: typeof UserPermission;
  Approval: typeof Approval;
  ApprovalFile: typeof ApprovalFile;
  Transaction: typeof Transaction;
  [key: string]: any;
}

const db: DbModels = {
  sequelize,
  Sequelize,
  Company,
  CompanyGst,
  User,
  Menu,
  MenuPermission,
  Permission,
  Role,
  RolePermission,
  UserPermission,
  Approval,
  ApprovalFile,
  Transaction
};

// 모델 간의 관계 설정
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

export default db;
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
  Transaction
}; 