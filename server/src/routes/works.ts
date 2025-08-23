import express, { Request, Response } from 'express';

// 업무 관리용 Request 타입 정의
interface WorkRequest extends Request {
  user?: {
    id: number;
    userid: string;
    username: string;
    company_id: number;
    role: string;
  };
}
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { authenticateJWT } from '../utils/jwtMiddleware';

const router = express.Router();

// 임시 데이터 저장소 (실제로는 데이터베이스를 사용해야 합니다)
let worksData: any[] = [
  {
    id: 1,
    title: '3분기 매출 보고서 작성',
    description: '3분기 매출 현황과 분석 자료를 포함한 보고서를 작성해주세요. 전년 동기 대비 분석과 향후 전망도 포함해야 합니다.',
    status: 'pending',
    priority: 'high',
    category: 'report',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigner: { id: 1, username: '김부장', userid: 'manager1' },
    assignee: { id: 2, username: '이대리', userid: 'emp1' }
  },
  {
    id: 2,
    title: '444444444444444444444444',
    description: '테스트용 긴 제목 업무입니다.',
    status: 'pending',
    priority: 'urgent',
    category: 'general',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigner: { id: 1, username: 'Minsub Lee', userid: 'manager1' },
    assignee: { id: 3, username: '박사원', userid: 'emp2' }
  },
  {
    id: 3,
    title: '신제품 마케팅 전략 수립',
    description: '신제품 출시를 위한 마케팅 전략을 수립하고 실행 계획을 작성해주세요.',
    status: 'pending',
    priority: 'normal',
    category: 'planning',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigner: { id: 1, username: '김부장', userid: 'manager1' },
    assignee: { id: 4, username: '최팀장', userid: 'emp3' }
  },
  {
    id: 4,
    title: '월간 실적 보고서 작성',
    description: '이번 달 실적을 정리하고 다음 달 계획을 포함한 보고서를 작성해주세요.',
    status: 'pending',
    priority: 'low',
    category: 'report',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigner: { id: 1, username: '김부장', userid: 'manager1' },
    assignee: { id: 5, username: '정대리', userid: 'emp4' }
  },
  {
    id: 5,
    title: '팀 워크샵 기획',
    description: '연말 팀 워크샵 계획을 수립하고 예산을 산출해주세요.',
    status: 'pending',
    priority: 'normal',
    category: 'meeting',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    assigner: { id: 1, username: '김부장', userid: 'manager1' },
    assignee: { id: 6, username: '한사원', userid: 'emp5' }
  }
];

let commentsData: any[] = [
  {
    id: 1,
    work_id: 1,
    content: '보고서 작성 양식과 참고 자료를 전달드렸습니다. 검토 후 진행 부탁드립니다.',
    created_at: new Date().toISOString(),
    author: { id: 1, username: '김부장', userid: 'manager1' }
  }
];

// 업무 목록 조회
router.get('/', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    logger.info('업무 목록 조회 요청');

    // 임시로 하드코딩된 데이터 반환
    const works = worksData.map(work => ({
      ...work,
      created_at: new Date(work.created_at),
      updated_at: new Date(work.updated_at)
    }));

    res.json({
      success: true,
      data: works,
      message: '업무 목록을 성공적으로 조회했습니다.'
    });
  } catch (error) {
    logger.error('업무 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

// 업무 상세 조회
router.get('/:id', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`업무 상세 조회 요청: ${id}`);

    const work = worksData.find(work => work.id === parseInt(id));
    
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '업무를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: work,
      message: '업무 상세 정보를 성공적으로 조회했습니다.'
    });
  } catch (error) {
    logger.error('업무 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 상세 조회 중 오류가 발생했습니다.'
    });
  }
});

// 업무 생성 (업무 지시)  
router.post('/', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { title, description, priority = 'normal', category = 'general', assignee_id, start_date, due_date } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    logger.info('새 업무 지시 요청:', { title, priority, category, assignee_id });

    // 유효성 검사
    if (!title || !description || !assignee_id || !due_date) {
      return res.status(400).json({
        success: false,
        message: '제목, 내용, 수행자, 완료예정일은 필수 항목입니다.'
      });
    }

    // 새 업무 생성
    const newWork = {
      id: worksData.length + 1,
      title,
      description,
      status: 'pending', // 업무 지시 시 수락 대기 상태
      priority,
      category,
      start_date: start_date || null,
      due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigner: {
        id: user.id,
        username: user.username,
        userid: user.userid
      },
      assignee: {
        id: parseInt(assignee_id),
        username: `사용자${assignee_id}`, // 실제 사용자명으로 표시
        userid: `user${assignee_id}`
      }
    };

    worksData.push(newWork);

    res.status(201).json({
      success: true,
      data: newWork,
      message: '업무가 성공적으로 지시되었습니다.'
    });
  } catch (error) {
    logger.error('업무 지시 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 지시 중 오류가 발생했습니다.'
    });
  }
});

// 업무 수정
router.put('/:id', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, category, assignee_id, start_date, due_date } = req.body;
    
    logger.info(`업무 수정 요청: ${id}`);

    const workIndex = worksData.findIndex(work => work.id === parseInt(id));
    
    if (workIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '업무를 찾을 수 없습니다.'
      });
    }

    // 업무 업데이트
    worksData[workIndex] = {
      ...worksData[workIndex],
      title: title || worksData[workIndex].title,
      description: description || worksData[workIndex].description,
      priority: priority || worksData[workIndex].priority,
      category: category || worksData[workIndex].category,
      assignee: assignee_id ? {
        id: parseInt(assignee_id),
        username: `사용자${assignee_id}`,
        userid: `user${assignee_id}`
      } : (assignee_id === '' ? null : worksData[workIndex].assignee),
      start_date: start_date !== undefined ? start_date : worksData[workIndex].start_date,
      due_date: due_date !== undefined ? due_date : worksData[workIndex].due_date,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: worksData[workIndex],
      message: '업무가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    logger.error('업무 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 수정 중 오류가 발생했습니다.'
    });
  }
});

// 업무 상태 변경 (수락, 거부, 진행, 완료)
router.patch('/:id/status', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    logger.info(`업무 상태 변경 요청: ${id} -> ${status} by ${user.username}`);

    const workIndex = worksData.findIndex(work => work.id === parseInt(id));
    
    if (workIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '업무를 찾을 수 없습니다.'
      });
    }

    const work = worksData[workIndex];
    
    // 권한 체크
    if (status === 'accepted' || status === 'rejected' || status === 'in_progress' || status === 'completed') {
      if (work.assignee?.id !== user.id) {
        return res.status(403).json({
          success: false,
          message: '업무 수행자만 상태를 변경할 수 있습니다.'
        });
      }
    }

    // 상태 업데이트
    worksData[workIndex].status = status;
    worksData[workIndex].updated_at = new Date().toISOString();

    // 상태 변경 시 자동 코멘트 추가
    const statusMessages = {
      'accepted': `${user.username}님이 업무를 수락했습니다.`,
      'rejected': `${user.username}님이 업무를 거부했습니다.`,
      'in_progress': `${user.username}님이 업무를 시작했습니다.`,
      'completed': `${user.username}님이 업무를 완료했습니다.`
    };

    if (statusMessages[status as keyof typeof statusMessages]) {
      commentsData.push({
        id: commentsData.length + 1,
        work_id: parseInt(id),
        content: statusMessages[status as keyof typeof statusMessages],
        created_at: new Date().toISOString(),
        author: {
          id: user.id,
          username: user.username,
          userid: user.userid
        }
      });
    }

    res.json({
      success: true,
      data: worksData[workIndex],
      message: '업무 상태가 성공적으로 변경되었습니다.'
    });
  } catch (error) {
    logger.error('업무 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 상태 변경 중 오류가 발생했습니다.'
    });
  }
});

// 업무 삭제
router.delete('/:id', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    logger.info(`업무 삭제 요청: ${id} by ${user.username}`);

    const workIndex = worksData.findIndex(work => work.id === parseInt(id));
    
    if (workIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '업무를 찾을 수 없습니다.'
      });
    }

    const work = worksData[workIndex];
    
    // 권한 체크 - 업무 지시자만 삭제 가능
    if (work.assigner.id !== user.id) {
      return res.status(403).json({
        success: false,
        message: '업무 지시자만 삭제할 수 있습니다.'
      });
    }

    // 업무 삭제
    worksData.splice(workIndex, 1);

    // 해당 업무의 코멘트도 삭제
    commentsData = commentsData.filter(comment => comment.work_id !== parseInt(id));

    res.json({
      success: true,
      message: '업무가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error('업무 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '업무 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 업무 코멘트 조회
router.get('/:id/comments', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    logger.info(`업무 코멘트 조회 요청: ${id}`);

    const comments = commentsData.filter(comment => comment.work_id === parseInt(id));

    res.json({
      success: true,
      data: comments,
      message: '코멘트를 성공적으로 조회했습니다.'
    });
  } catch (error) {
    logger.error('업무 코멘트 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '코멘트 조회 중 오류가 발생했습니다.'
    });
  }
});

// 업무 코멘트 추가
router.post('/:id/comments', authenticateJWT, async (req: WorkRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    logger.info(`업무 코멘트 추가 요청: ${id}`);

    // 유효성 검사
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '코멘트 내용을 입력해주세요.'
      });
    }

    // 업무 존재 확인
    const work = worksData.find(work => work.id === parseInt(id));
    if (!work) {
      return res.status(404).json({
        success: false,
        message: '업무를 찾을 수 없습니다.'
      });
    }

    // 새 코멘트 생성
    const newComment = {
      id: commentsData.length + 1,
      work_id: parseInt(id),
      content: content.trim(),
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        userid: user.userid
      }
    };

    commentsData.push(newComment);

    res.status(201).json({
      success: true,
      data: newComment,
      message: '코멘트가 성공적으로 추가되었습니다.'
    });
  } catch (error) {
    logger.error('업무 코멘트 추가 오류:', error);
    res.status(500).json({
      success: false,
      message: '코멘트 추가 중 오류가 발생했습니다.'
    });
  }
});

export default router;
