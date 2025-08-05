import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

class User extends Model {
  public id!: number;
  public userid!: string;
  public username!: string;
  public password!: string;
  public company_id!: number;
  public role!: string;
  public default_language!: string;
  public is_deleted!: boolean;
  public create_date!: Date;
  public update_date!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userid: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    default_language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'ko',
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    create_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    update_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'user',
    timestamps: false,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password && !user.password.startsWith('$2a$')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password') && !user.password.startsWith('$2a$')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  }
);

export default User; 