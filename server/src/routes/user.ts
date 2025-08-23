import { Router, Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Menu from '../models/Menu';
import MenuPermission from '../models/MenuPermission';
import logger from '../utils/logger';

// 메뉴 권한 인터페이스 정의
interface MenuPermissionType {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}
import jwt from 'jsonwebtoken';
import config from '../config';

const router = Router();

// 시스템 초기화 상태 확인 (모듈화)
router.get('/check-initialization', async (req: Request, res: Response) => {
  try {
    // Sequelize 모델을 사용하여 올바른 테이블명으로 조회
    const userCount = await User.count({ where: { is_deleted: false } });
    const companyCount = await Company.count({ where: { is_deleted: false } });
    const isInitialized = userCount > 0 || companyCount > 0;
    res.json({
      success: true,
      data: { isInitialized, userCount, companyCount }
    });
  } catch (error) {
    logger.error('Error checking initialization status:', error);
    res.status(500).json({
      success: false,
      message: '시스템 초기화 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

// JWT 인증 미들웨어
function authMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

// 현재 로그인한 사용자 정보 반환
router.get('/me', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No user info in request' });
    }
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'userid', 'username', 'company_id', 'role', 'create_date', 'update_date']
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user info' });
  }
});

router.get('/', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  logger.info('GET /api/users called');
  try {
    const currentUser = req.user;
    logger.info(`Current user: ${currentUser?.userid}, role: ${currentUser?.role}, company_id: ${currentUser?.company_id}`);

    let whereCondition: any = { is_deleted: false };

    // 메뉴 권한 기반 권한 체크
    if (currentUser?.role === 'root') {
      // root는 모든 사용자 조회 가능
      logger.info('Root user - showing all users');
    } else if (currentUser?.role === 'admin' || currentUser?.role === 'audit') {
      // admin과 audit는 역할 기반으로 기본 권한 허용하되, 메뉴 권한도 확인
      logger.info(`${currentUser.role} user - checking permissions for user management`);
      
      let hasPermission = true; // 기본적으로 admin/audit는 권한 있음
      
      try {
        const { getUserPermissions } = require('../utils/permissionChecker');
        
        // 새로운 통합 권한 시스템을 사용하여 사용자 권한 확인
        const userPermissions = await getUserPermissions(currentUser.id);
        
        if (userPermissions && userPermissions.menuPermissions) {
          // 사용자 관련 메뉴 권한 확인 (URL 기반으로 동적 체크)
          const userManagementMenus = Object.entries(userPermissions.menuPermissions).filter(([menuName, permission]) => {
            return menuName.includes('사용자') || menuName.toLowerCase().includes('user');
          });
          
          logger.info(`User management related menus for ${currentUser.userid}:`, userManagementMenus.map(([name]) => name));
          
          // 사용자 관련 메뉴 중 하나라도 읽기 권한이 있으면 허용
          const hasUserMenuPermission = userManagementMenus.some(([menuName, permission]) => {
            const menuPermission = permission as MenuPermissionType;
            return menuPermission.can_read;
          });
          
          if (hasUserMenuPermission) {
            logger.info(`${currentUser.userid} has user management menu permission`);
          } else {
            logger.info(`${currentUser.userid} has no user management menu permission, using role-based default permission for ${currentUser.role}`);
          }
        } else {
          logger.info(`${currentUser.userid} has no explicit menu permissions, using role-based default permission for ${currentUser.role}`);
        }
      } catch (error) {
        logger.error('Menu permission check failed, using role-based permission:', error);
      }

      // admin과 audit는 같은 회사 사용자만 조회 가능
      whereCondition.company_id = currentUser.company_id;
      logger.info(`${currentUser.role} user - showing users from company_id: ${currentUser.company_id}`);
    } else {
      // user 역할은 명시적인 메뉴 권한 체크 필요
      try {
        const { getUserPermissions } = require('../utils/permissionChecker');
        
        // 새로운 통합 권한 시스템을 사용하여 사용자 권한 확인
        const userPermissions = await getUserPermissions(currentUser.id);
        
        logger.info(`Checking menu permission for user ${currentUser.userid} on user-related menus`);
        
        if (!userPermissions || !userPermissions.menuPermissions) {
          logger.info(`User ${currentUser.userid} has no menu permissions configured`);
          return res.status(403).json({ error: '사용자 목록을 조회할 권한이 없습니다.' });
        }
        
        // 사용자 관련 메뉴 권한 확인 (동적 체크)
        const userManagementMenus = Object.entries(userPermissions.menuPermissions).filter(([menuName, permission]) => {
          return menuName.includes('사용자') || menuName.toLowerCase().includes('user');
        });
        
        logger.info(`User management related menus for ${currentUser.userid}:`, userManagementMenus.map(([name]) => name));
        
        // 사용자 관련 메뉴 중 하나라도 읽기 권한이 있는지 확인
        const hasUserMenuPermission = userManagementMenus.some(([menuName, permission]) => {
          const menuPermission = permission as MenuPermissionType;
          return menuPermission.can_read;
        });
        
        if (!hasUserMenuPermission) {
          logger.info(`User ${currentUser.userid} does not have permission to view user list`);
          return res.status(403).json({ error: '사용자 목록을 조회할 권한이 없습니다.' });
        }

        logger.info(`User ${currentUser.userid} has menu permission for user management`);
        
        // 일반 사용자는 같은 회사 사용자 조회 가능
        whereCondition.company_id = currentUser.company_id;
        logger.info(`User role - showing users from company_id: ${currentUser.company_id}`);
      } catch (error) {
        logger.error('Menu permission check failed for user role:', error);
        return res.status(403).json({ error: '사용자 목록을 조회할 권한이 없습니다.' });
      }
    }

    const users = await User.findAll({
      where: whereCondition,
      attributes: [
        'id', 'userid', 'username', 'role', 'company_id', 'default_language', 
        'create_date', 'update_date', 'profile', 'employment', 'performance', 
        'education', 'skills', 'attendance', 'compensation'
      ],
      include: [{
        model: Company,
        as: 'company',
        attributes: ['name']
      }],
      order: [['create_date', 'DESC']]
    });
    logger.info(`Found ${users.length} users for user ${currentUser?.userid}`);
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: '사용자 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 사용자 추가
router.post('/', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { userid, username, password, role, company_id, default_language } = req.body;
    
    const currentUser = req.user;
    
    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin' && currentUser?.role !== 'audit') {
      return res.status(403).json({ error: '사용자를 추가할 권한이 없습니다.' });
    }

    // 필수 필드 검증
    if (!userid || !username || !password || !role || !company_id) {
      return res.status(400).json({ error: '모든 필수 필드를 입력해주세요.' });
    }

    // admin과 audit는 같은 회사에만 사용자 추가 가능
    if ((currentUser?.role === 'admin' || currentUser?.role === 'audit') && currentUser?.company_id !== company_id) {
      return res.status(403).json({ error: '다른 회사에 사용자를 추가할 권한이 없습니다.' });
    }

    // 사용자 ID 중복 검사
    const existingActiveUser = await User.findOne({ where: { userid, is_deleted: false } });
    if (existingActiveUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자 ID입니다.' });
    }

    // 삭제된 사용자가 있는지 확인
    const deletedUser = await User.findOne({ where: { userid, is_deleted: true } });
    let user;

    // 역할 권한 검증
    // auditor('audit')는 root만 부여 가능
    if (role === 'audit' && currentUser?.role !== 'root') {
      return res.status(403).json({ error: 'auditor 역할은 root만 부여할 수 있습니다.' });
    }
    if (currentUser?.role === 'admin') {
      // 관리자는 일반 사용자만 추가 가능
      if (role !== 'user') {
        return res.status(403).json({ error: '관리자는 일반 사용자 역할만 부여할 수 있습니다.' });
      }
    } else if (currentUser?.role === 'audit') {
      // 감사자는 일반 사용자만 추가 가능
      if (role !== 'user') {
        return res.status(403).json({ error: '감사자는 일반 사용자 역할만 부여할 수 있습니다.' });
      }
    } else if (currentUser?.role === 'root') {
      // root는 모든 역할 추가 가능 (자신 제외)
      if (role === 'root') {
        return res.status(403).json({ error: 'root 사용자는 다른 root 사용자를 추가할 수 없습니다.' });
      }
    }

    if (deletedUser) {
      // 삭제된 사용자가 있으면 userid를 변경하여 중복을 해제
      const timestamp = Date.now();
      const newUserid = `${deletedUser.userid}_deleted_${timestamp}`;
      
      await deletedUser.update({
        userid: newUserid,
        update_date: new Date()
      });
      
      logger.info(`Changed deleted user's userid from ${userid} to ${newUserid} to allow reuse`);
    }

    // 항상 새 사용자 생성 (복원하지 않음)
    user = await User.create({
      userid,
      username,
      password, // 모델 훅에서 해싱 처리
      role,
      company_id,
      default_language: default_language || 'ko', // 기본값은 한국어
      create_date: new Date(),
      update_date: new Date(),
      // 확장된 프로필 데이터 추가
      profile: req.body.profile || null,
      employment: req.body.employment || null,
      performance: req.body.performance || null,
      education: req.body.education || null,
      skills: req.body.skills || null,
      attendance: req.body.attendance || null,
      compensation: req.body.compensation || null
    });
    logger.info(`New user created: ${userid}`);

    // 새로운 사용자에게 상위 메뉴들의 기본 읽기 권한 부여
    const parentMenus = await Menu.findAll({
      where: { parent_id: null }
    });

    if (parentMenus.length > 0) {
      const defaultPermissions = parentMenus.map(menu => ({
        user_id: user.id,
        menu_id: menu.menu_id,
        can_read: true,    // 상위 메뉴는 기본 읽기 권한 부여
        can_create: false,
        can_update: false,
        can_delete: false,
        create_date: new Date()
      }));

      await MenuPermission.bulkCreate(defaultPermissions);
      logger.info(`Default menu permissions granted to user ${userid}: ${parentMenus.length} parent menus`);
    }

    res.status(201).json({ 
      success: true, 
      message: '사용자가 성공적으로 생성되었습니다.',
      user: { id: user.id, userid: user.userid, username: user.username, role: user.role },
      wasReused: !!deletedUser  // ID가 재사용되었는지 여부
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ error: '사용자 생성 중 오류가 발생했습니다.' });
  }
});

// userid 중복 체크 (삭제된 사용자는 제외)
router.get('/check-userid/:userid', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { userid } = req.params;
    
    if (!userid) {
      return res.status(400).json({ error: 'userid가 필요합니다.' });
    }

    // 활성 사용자 중에서만 중복 체크
    const existingUser = await User.findOne({ 
      where: { userid, is_deleted: false }
    });

    res.json({ 
      available: !existingUser,
      userid: userid
    });
  } catch (error) {
    logger.error('Error checking userid:', error);
    res.status(500).json({ error: 'userid 확인 중 오류가 발생했습니다.' });
  }
});

// 사용자 수정
router.put('/:id', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const { userid, username, role, company_id, password } = req.body;
    const currentUser = req.user;
    
    console.log('=== 서버 사용자 수정 요청 로그 ===');
    console.log('현재 사용자:', currentUser?.userid, '역할:', currentUser?.role);
    console.log('수정할 사용자 ID:', id);
    console.log('요청 본문:', req.body);
    console.log('비밀번호 포함 여부:', !!password);
    console.log('비밀번호 값:', password);
    console.log('비밀번호 길이:', password?.length);
    console.log('===============================');
    
    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin' && currentUser?.role !== 'audit') {
      return res.status(403).json({ error: '사용자를 수정할 권한이 없습니다.' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // admin과 audit는 같은 회사 사용자만 수정 가능
    if ((currentUser?.role === 'admin' || currentUser?.role === 'audit') && currentUser?.company_id !== user.company_id) {
      return res.status(403).json({ error: '다른 회사 사용자를 수정할 권한이 없습니다.' });
    }

    // 사용자 ID 중복 검사 (자신 제외)
    if (userid !== user.userid) {
      const existingUser = await User.findOne({ where: { userid, is_deleted: false } });
      if (existingUser) {
        return res.status(400).json({ error: '이미 존재하는 사용자 ID입니다.' });
      }
    }

    // 역할 권한 검증
    // auditor('audit')는 root만 부여/변경 가능
    if (role === 'audit' && currentUser?.role !== 'root') {
      return res.status(403).json({ error: 'auditor 역할은 root만 부여하거나 변경할 수 있습니다.' });
    }
    if (currentUser?.role === 'admin') {
      // 관리자는 일반 사용자로만 변경 가능
      if (role !== 'user') {
        return res.status(403).json({ error: '관리자는 일반 사용자 역할만 부여할 수 있습니다.' });
      }
    } else if (currentUser?.role === 'audit') {
      // 감사자는 일반 사용자로만 변경 가능
      if (role !== 'user') {
        return res.status(403).json({ error: '감사자는 일반 사용자 역할만 부여할 수 있습니다.' });
      }
    } else if (currentUser?.role === 'root') {
      // root는 모든 역할로 변경 가능 (자신 제외)
      if (role === 'root' && currentUser.id !== parseInt(id)) {
        return res.status(403).json({ error: 'root 사용자는 다른 root 사용자로 변경할 수 없습니다.' });
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      userid,
      username,
      role,
      company_id,
      default_language: req.body.default_language || user.default_language,
      update_date: new Date()
    };

    // 확장된 프로필 데이터 추가
    if (req.body.profile) {
      updateData.profile = req.body.profile;
    }
    if (req.body.employment) {
      updateData.employment = req.body.employment;
    }
    if (req.body.performance) {
      updateData.performance = req.body.performance;
    }
    if (req.body.education) {
      updateData.education = req.body.education;
    }
    if (req.body.skills) {
      updateData.skills = req.body.skills;
    }
    if (req.body.attendance) {
      updateData.attendance = req.body.attendance;
    }
    if (req.body.compensation) {
      updateData.compensation = req.body.compensation;
    }

    // 비밀번호가 제공된 경우: 모델 훅에서 해싱 처리
    if (password && password.trim() !== '') {
      console.log('비밀번호 업데이트 수행');
      updateData.password = password;
      console.log('비밀번호 값 설정 (해싱은 모델 훅에서 처리)');
    } else {
      console.log('비밀번호 업데이트 없음');
    }

    console.log('업데이트할 데이터:', updateData);

    // 사용자 정보 업데이트
    await user.update(updateData);

    logger.info(`User updated: ${userid}`);
    res.json({ success: true, user: { id: user.id, userid: user.userid, username: user.username, role: user.role } });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ error: '사용자 수정 중 오류가 발생했습니다.' });
  }
});

// 사용자 삭제 (소프트 삭제)
router.delete('/:id', authMiddleware, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;
    
    // 권한 검사
    if (currentUser?.role !== 'root' && currentUser?.role !== 'admin') {
      return res.status(403).json({ error: '사용자를 삭제할 권한이 없습니다.' });
    }
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // admin은 같은 회사 사용자만 삭제 가능
    if (currentUser?.role === 'admin' && currentUser?.company_id !== user.company_id) {
      return res.status(403).json({ error: '다른 회사 사용자를 삭제할 권한이 없습니다.' });
    }

    // root 사용자는 삭제 불가
    if (user.role === 'root') {
      return res.status(400).json({ error: '최고관리자는 삭제할 수 없습니다.' });
    }

    // 소프트 삭제
    await user.update({
      is_deleted: true,
      update_date: new Date()
    });

    logger.info(`User deleted: ${user.username}`);
    res.json({ success: true, message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ error: '사용자 삭제 중 오류가 발생했습니다.' });
  }
});

// 사용자 비밀번호 존재 여부 확인
router.get('/:id/has-password', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      attributes: ['id', 'password'] // 비밀번호 해시만 조회
    });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호가 설정되어 있는지 확인 (해시가 null이 아니고 빈 문자열이 아닌 경우)
    const hasPassword = user.password && user.password.trim() !== '';
    
    res.json({ 
      success: true, 
      hasPassword 
    });
  } catch (error) {
    logger.error('Error checking password existence:', error);
    res.status(500).json({ error: '비밀번호 확인 중 오류가 발생했습니다.' });
  }
});

// 사용자 비밀번호 존재 여부 확인
router.get('/:id/has-password', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 비밀번호가 설정되어 있는지 확인 (빈 문자열이 아닌지)
    const hasPassword = user.password && user.password.trim() !== '';
    
    res.json({ 
      success: true, 
      hasPassword 
    });
  } catch (error) {
    logger.error('Error checking user password:', error);
    res.status(500).json({ error: '비밀번호 확인 중 오류가 발생했습니다.' });
  }
});

export default router; 