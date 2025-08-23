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
  public last_notification_check?: Date;
  
  // 확장된 프로필 필드들
  public profile?: any;
  public employment?: any;
  public performance?: any;
  public education?: any;
  public skills?: any;
  public attendance?: any;
  public compensation?: any;

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
    last_notification_check: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // 확장된 프로필 필드들
    profile: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    employment: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    performance: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    education: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    attendance: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    compensation: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'user',
    tableName: 'user',
    timestamps: false,
    hooks: {
      // 비밀번호는 항상 여기서만 해싱한다. 이미 해시 형태($2a/$2b/$2y$)면 재해싱하지 않음
      beforeCreate: async (user: User) => {
        const isHashed = typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);
        if (user.password && !isHashed) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const isHashed = typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);
          if (user.password && !isHashed) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        }
      },
    },
  }
);

export default User; 