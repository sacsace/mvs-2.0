import express from 'express';
import cors from 'cors';
import path from 'path';
import config from './config';
import sequelize from './config/database';
import './models/associations';
import initRouter from './routes/init';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import companyRouter from './routes/company';
import menuRouter from './routes/menu';
import menuPermissionRouter from './routes/menuPermission';
import permissionRouter from './routes/permissions';
import userPermissionRouter from './routes/userPermissions';
import roleRouter from './routes/roles';
import approvalRouter from './routes/approval';
import accountingRouter from './routes/accounting';
import invoiceRouter from './routes/invoice';
import partnerRouter from './routes/partners';
import logger from './utils/logger';

const app = express();

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.202:3000'],
  credentials: true
}));

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 서빙 (업로드된 파일들)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 클라이언트 빌드 파일 서빙 (프로덕션용)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// Database connection
sequelize.authenticate()
  .then(() => {
    logger.info('Model associations setup completed.');
  })
  .catch((error) => {
    logger.error('Database connection failed:', error);
  });

// 라우터 등록
app.use('/api/init', initRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/companies', companyRouter);
app.use('/api/menus', menuRouter);
app.use('/api/menu-permissions', menuPermissionRouter);
app.use('/api/permissions', permissionRouter);
app.use('/api/user-permissions', userPermissionRouter);
app.use('/api/roles', roleRouter);
app.use('/api/approval', approvalRouter);
app.use('/api/accounting', accountingRouter);
app.use('/api/invoice', invoiceRouter);
app.use('/api/partners', partnerRouter);

// 프로덕션에서 클라이언트 라우팅 처리
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || config.server.port.toString() || '3001');

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server is running on port ${PORT}`);
}); 