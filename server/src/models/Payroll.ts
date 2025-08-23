import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 급여 인터페이스 정의
export interface PayrollAttributes {
  id: number;
  user_id: number;
  month: string; // YYYY-MM 형식
  year: number;
  basic_salary: number; // 기본급
  hra: number; // House Rent Allowance (주택임대수당)
  da: number; // Dearness Allowance (물가수당)
  ta: number; // Transport Allowance (교통수당)
  ma: number; // Medical Allowance (의료수당)
  special_allowance: number; // 특별수당
  bonus: number; // 보너스
  overtime_pay: number; // 초과근무수당
  gross_salary: number; // 총 급여
  pf_contribution: number; // EPF 기여금 (Employee Provident Fund)
  esi_contribution: number; // ESI 기여금 (Employee State Insurance)
  tds: number; // TDS (Tax Deducted at Source)
  professional_tax: number; // 전문직세
  net_salary: number; // 실수령액
  working_days: number; // 근무일수
  leave_days: number; // 휴가일수
  overtime_hours: number; // 초과근무시간
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date?: Date | null;
  remarks?: string;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface PayrollCreationAttributes extends Optional<PayrollAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Payroll extends Model<PayrollAttributes, PayrollCreationAttributes> implements PayrollAttributes {
  public id!: number;
  public user_id!: number;
  public month!: string;
  public year!: number;
  public basic_salary!: number;
  public hra!: number;
  public da!: number;
  public ta!: number;
  public ma!: number;
  public special_allowance!: number;
  public bonus!: number;
  public overtime_pay!: number;
  public gross_salary!: number;
  public pf_contribution!: number;
  public esi_contribution!: number;
  public tds!: number;
  public professional_tax!: number;
  public net_salary!: number;
  public working_days!: number;
  public leave_days!: number;
  public overtime_hours!: number;
  public status!: 'pending' | 'approved' | 'paid' | 'cancelled';
  public payment_date?: Date;
  public remarks?: string;
  public created_by!: number;
  public updated_by!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

Payroll.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    month: {
      type: DataTypes.STRING(7), // YYYY-MM
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    basic_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    hra: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    da: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ta: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    ma: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    special_allowance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    bonus: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    overtime_pay: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    gross_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    pf_contribution: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    esi_contribution: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tds: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    professional_tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    net_salary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    working_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    leave_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    overtime_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'payrolls',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'month', 'year'],
      },
      {
        fields: ['month', 'year'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default Payroll;
