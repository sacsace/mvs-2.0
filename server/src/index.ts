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
import approvalRouter from './routes/approval';
import accountingRouter from './routes/accounting';
import invoiceRouter from './routes/invoice';
import partnerRouter from './routes/partners';
import dashboardRouter from './routes/dashboard';
import einvoiceRouter from './routes/einvoice';
import pushRouter from './routes/push';
import worksRouter from './routes/works';
import payrollRouter from './routes/payroll';
import noticeRouter from './routes/notice';
import expensesRouter from './routes/expenses';
import logger from './utils/logger';

// 프로세스 에러 핸들링
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();

// CORS 설정
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// JSON 파싱 미들웨어 (사진 업로드를 위해 제한 늘림)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 정적 파일 서빙 (업로드된 파일들)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 클라이언트 빌드 파일 서빙 (프로덕션용)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// Database connection (non-blocking)
sequelize.authenticate()
  .then(() => {
    logger.info('✅ Database connection established successfully.');
  })
  .catch((error) => {
    logger.error('⚠️  Database connection failed:', error);
    logger.info('Continuing without database connection...');
  });

// 라우터 등록
app.use('/api/init', initRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/companies', companyRouter);
app.use('/api/menu', menuRouter);
app.use('/api/menu-permissions', menuPermissionRouter);
app.use('/api/approval', approvalRouter);
app.use('/api/accounting', accountingRouter);
app.use('/api/invoice', invoiceRouter);
app.use('/api/partners', partnerRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/e-invoice', einvoiceRouter);
app.use('/api/push', pushRouter);
app.use('/api/works', worksRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/notice', noticeRouter);
app.use('/api/expenses', expensesRouter);

// Railway 헬스체크 대응 - 추가 엔드포인트
app.get('/', (req, res) => {
  logger.info(`🏠 ROOT 경로 접근: ${req.ip} at ${new Date().toISOString()}`);
  res.status(200).json({
    status: 'healthy',
    message: 'MVS 2.0 Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'MVS 2.0 Server is running',  
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

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

// Railway 환경 디버깅
logger.info(`🔧 Railway Environment Debug:`);
logger.info(`  - PORT: ${PORT}`);
logger.info(`  - NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`  - DATABASE_URL exists: ${!!process.env.DATABASE_URL}`);
logger.info(`  - Memory limit: ${process.env.NODE_OPTIONS || 'default'}`);

// 서버 시작 전 로그
logger.info(`Starting server on port ${PORT}`);
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Database URL exists: ${!!process.env.DATABASE_URL}`);

// Railway 헬스체크 대응
const server = app.listen(PORT, '0.0.0.0', async () => {
  const serverHost = process.env.SERVER_HOST || 'localhost';
  logger.info(`✅ Server is running on port ${PORT}`);
  logger.info(`✅ Health check available at: http://${serverHost}:${PORT}/api/init/health`);
  logger.info(`🚀 Server deployment successful at ${new Date().toISOString()}`);
  
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    logger.info('✅ Database connection established');
    
    // 개발 및 프로덕션 환경에서 테이블 동기화
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Database tables synchronized');
    }
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    // 데이터베이스 연결 실패해도 서버는 계속 실행 (헬스체크용)
  }
  
  logger.info(`✅ Server startup completed successfully`);
}).on('error', (error) => {
  logger.error(`❌ Server failed to start:`, error);
  process.exit(1);
});

// 메모리 최적화
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 30000); // 30초마다 가비지 컬렉션

// Graceful shutdown handling for Railway
process.on('SIGTERM', () => {
  logger.info('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 메모리 사용량 모니터링 (Railway 512MB 제한 고려)
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.rss / 1024 / 1024);
  if (memMB > 400) { // 400MB 이상일 때 경고 (Railway 제한의 80%)
    logger.warn(`높은 메모리 사용량: ${memMB}MB (Railway 제한: 512MB)`);
  }
}, 300000); // 5분마다 체크 (빈도 감소) 