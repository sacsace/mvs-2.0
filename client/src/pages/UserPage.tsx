import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Snackbar, 
  Alert, 
  IconButton, 
  FormControl, 
  InputLabel, 
  Select, 
  InputAdornment, 
  Chip,
  Grid,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Rating,
  Chip as MuiChip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import axios from 'axios';
import { useMenuPermission, getAvailableRoles, filterUsersByPermission } from '../hooks/useMenuPermission';

interface Company {
  company_id: number;
  name: string;
}

interface User {
  id: number;
  userid?: string;
  username: string;
  role: string;
  company_id: number;
  company?: {
    name: string;
  };
  create_date?: string;
  update_date?: string;
  defaultLanguage?: string;
  
  // 개인 정보
  profile?: {
    photo?: string;
    fullName: string;
    phone: string;
    email: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    emergencyContact: string;
  };
  
  // 직무 이력
  employment?: {
    hireDate: string;
    department: string;
    position: string;
    jobDescription: string;
    promotionHistory: string[];
    supervisor: string;
  };
  
  // 성과 평가
  performance?: {
    lastEvaluationDate: string;
    overallRating: number;
    goalAchievement: number;
    competencyScore: number;
    evaluationNotes: string;
  };
  
  // 교육 이력
  education?: {
    degree: string;
    major: string;
    university: string;
    graduationYear: string;
    certifications: string[];
    trainingPrograms: string[];
  };
  
  // 스킬 및 역량
  skills?: {
    technicalSkills: string[];
    languageSkills: string[];
    leadershipSkills: string[];
    problemSolvingSkills: string[];
    softSkills: string[];
  };
  
  // 근태 정보
  attendance?: {
    workSchedule: string;
    vacationDays: number;
    sickDays: number;
    overtimeHours: number;
    attendanceRate: number;
  };
  
  // 보상 정보
  compensation?: {
    baseSalary: number;
    bonus: number;
    benefits: string[];
    lastRaiseDate: string;
    raiseAmount: number;
  };
}

const UserPage: React.FC = () => {
  const { permission: userMenuPermission, currentUser } = useMenuPermission('직원 정보 관리');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // 전체 사용자 목록 저장
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<any>({
    userid: '',
    username: '', 
    password: '', 
    newPassword: '',
    role: 'user', 
    company_id: 1,
    defaultLanguage: 'ko',
    profile: {
      fullName: '',
      phone: '',
      email: '',
      birthDate: '',
      gender: 'male',
      address: '',
      emergencyContact: ''
    },
    employment: {
      hireDate: '',
      department: '',
      position: '',
      jobDescription: '',
      promotionHistory: [],
      supervisor: ''
    },
    performance: {
      lastEvaluationDate: '',
      overallRating: 3,
      goalAchievement: 3,
      competencyScore: 3,
      evaluationNotes: ''
    },
    education: {
      degree: '',
      major: '',
      university: '',
      graduationYear: '',
      certifications: [],
      trainingPrograms: []
    },
    skills: {
      technicalSkills: [],
      languageSkills: [],
      leadershipSkills: [],
      problemSolvingSkills: [],
      softSkills: []
    },
    attendance: {
      workSchedule: '09:00-18:00',
      vacationDays: 0,
      sickDays: 0,
      overtimeHours: 0,
      attendanceRate: 100
    },
    compensation: {
      baseSalary: 0,
      bonus: 0,
      benefits: [],
      lastRaiseDate: '',
      raiseAmount: 0
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [activeTab, setActiveTab] = useState(0);
  
  // 검색 관련 state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('전체');
  const [selectedCompany, setSelectedCompany] = useState<string>('전체');

  // 역할별 색상 함수
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';       // 빨간색 - Administrator
      case 'root':
        return 'warning';     // 주황색 - System Administrator
      case 'audit':
        return 'info';        // 파란색 - Auditor
      case 'user':
        return 'success';     // 녹색 - User
      default:
        return 'default';     // 회색 - 기타
    }
  };

  // 역할별 레이블 함수
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'root':
        return 'System Administrator';
      case 'audit':
        return 'Auditor';
      case 'user':
        return 'User';
      default:
        return role;
    }
  };



  const fetchUsers = async () => {
    setLoading(true);
    try {
      console.log('Fetching users and companies...');
      console.log('Current user:', currentUser);
      
      const [usersRes, companiesRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/companies')
      ]);
      
      console.log('Users response:', {
        status: usersRes.status,
        statusText: usersRes.statusText,
        data: usersRes.data,
        dataLength: Array.isArray(usersRes.data) ? usersRes.data.length : 'Not an array'
      });
      console.log('Companies response:', {
        status: companiesRes.status,
        statusText: companiesRes.statusText,
        data: companiesRes.data,
        dataLength: Array.isArray(companiesRes.data) ? companiesRes.data.length : 'Not an array'
      });

      if (!Array.isArray(usersRes.data)) {
        console.error('Users response is not an array:', usersRes.data);
        throw new Error('Invalid response format: users data is not an array');
      }

      // root 계정은 모든 사용자를 볼 수 있음, 다른 계정은 권한 기반 필터링 적용
      let filteredUsers;
      if (currentUser?.role === 'root') {
        filteredUsers = usersRes.data; // root는 모든 사용자 접근 가능
        console.log('ROOT 사용자 - 모든 사용자 표시:', {
          전체사용자수: usersRes.data.length,
          필터링후사용자수: filteredUsers.length,
          현재사용자권한: currentUser.role
        });
      } else {
        filteredUsers = currentUser ? filterUsersByPermission(usersRes.data, currentUser) : usersRes.data;
      console.log('권한 필터링 적용:', {
        전체사용자수: usersRes.data.length,
        필터링후사용자수: filteredUsers.length,
        현재사용자권한: currentUser?.role
      });
      }
      
      console.log('Final filtered users:', filteredUsers);
      setAllUsers(filteredUsers); // 전체 목록 저장
      setUsers(filteredUsers); // 화면에 표시할 목록
      setCompanies(companiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      }
      setError('데이터를 불러오는데 실패했습니다.');
      setSnackbar({
        open: true,
        message: `사용자 정보를 불러오는데 실패했습니다. ${axios.isAxiosError(error) ? error.response?.data?.details || '' : ''}`,
        severity: 'error'
      });
      setUsers([]);
      setAllUsers([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // 현재 사용자가 볼 수 있는 역할 목록 가져오기
  const getAvailableRoleOptions = () => {
    console.log('🔍 getAvailableRoleOptions 호출됨, currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('❌ currentUser가 없음, ["전체"] 반환');
      return ['전체'];
    }
    
    const availableRoles = [];
    if (currentUser.role === 'root') {
      availableRoles.push('관리자', '감사자', '일반');
      console.log('✅ ROOT 사용자 - 모든 역할 표시:', availableRoles);
    } else if (currentUser.role === 'admin' || currentUser.role === 'audit') {
      availableRoles.push('일반');
      console.log('✅ ADMIN/AUDIT 사용자 - 일반만 표시:', availableRoles);
    } else {
      console.log('✅ USER 사용자 - 아무 역할 없음');
    }
    
    const result = ['전체', ...availableRoles];
    console.log('🎯 최종 역할 옵션:', result);
    return result;
  };

  // 검색 및 역할 필터링 적용
  const applyFilters = () => {
    let filtered = [...allUsers];

    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.userid && user.userid.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.profile?.fullName && user.profile.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 역할 필터링
    if (selectedRole !== '전체') {
      let roleFilter = '';
      switch (selectedRole) {
        case '관리자':
          roleFilter = 'admin';
          break;
        case '감사자':
          roleFilter = 'audit';
          break;
        case '일반':
          roleFilter = 'user';
          break;
        default:
          roleFilter = selectedRole;
      }
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // 회사 필터링
    if (selectedCompany !== '전체') {
      const companyId = parseInt(selectedCompany);
      filtered = filtered.filter(user => user.company_id === companyId);
    }

    setUsers(filtered);
  };

  // 검색어나 역할, 회사 선택이 변경될 때마다 필터링 적용
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedRole, selectedCompany, allUsers]);

  useEffect(() => {
    console.log('useEffect triggered, currentUser:', currentUser);
    if (currentUser) {
      console.log('Fetching users for currentUser:', currentUser);
      fetchUsers();
    } else {
      console.log('No currentUser, skipping fetchUsers');
    }
  }, [currentUser]);



  const handleDialogOpen = () => {
    if (!currentUser) {
      setError('사용자 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }

    if (!userMenuPermission.can_create) {
      setError('사용자를 추가할 권한이 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (availableRoles.length === 0) {
      setError('사용자를 추가할 권한이 없습니다.');
      return;
    }

    if (companies.length === 0) {
      setError('회사 정보를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      return;
    }
    
    setEditingUser(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setNewUser({
      userid: '',
      username: '', 
      password: '', 
      newPassword: '',
      role: availableRoles[0], 
      company_id: companies[0]?.company_id || 1,
      defaultLanguage: 'ko',
      profile: {
        fullName: '',
        phone: '',
        email: '',
        birthDate: '',
        gender: 'male' as const,
        address: '',
        emergencyContact: ''
      },
      employment: {
        hireDate: '',
        department: '',
        position: '',
        jobDescription: '',
        promotionHistory: [],
        supervisor: ''
      },
      performance: {
        lastEvaluationDate: '',
        overallRating: 3,
        goalAchievement: 3,
        competencyScore: 3,
        evaluationNotes: ''
      },
      education: {
        degree: '',
        major: '',
        university: '',
        graduationYear: '',
        certifications: [],
        trainingPrograms: []
      },
      skills: {
        technicalSkills: [],
        languageSkills: [],
        leadershipSkills: [],
        problemSolvingSkills: [],
        softSkills: []
      },
      attendance: {
        workSchedule: '09:00-18:00',
        vacationDays: 0,
        sickDays: 0,
        overtimeHours: 0,
        attendanceRate: 100
      },
      compensation: {
        baseSalary: 0,
        bonus: 0,
        benefits: [],
        lastRaiseDate: '',
        raiseAmount: 0
      }
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setViewDialogOpen(true);
  };

  const handlePrintUser = (user: User) => {
    // 인쇄 기능 구현
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>사용자 정보 - ${user.username}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
              .info-row { display: flex; margin-bottom: 10px; }
              .label { font-weight: bold; width: 150px; }
              .value { flex: 1; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>사용자 정보</h1>
              <p>출력일시: ${new Date().toLocaleString('ko-KR')}</p>
            </div>
            
            <div class="section">
              <h3>기본 정보</h3>
              <div class="info-row">
                <span class="label">사용자명:</span>
                <span class="value">${user.username}</span>
              </div>
              <div class="info-row">
                <span class="label">사용자 ID:</span>
                <span class="value">${user.userid || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="label">역할:</span>
                <span class="value">${getRoleLabel(user.role)}</span>
              </div>
              <div class="info-row">
                <span class="label">회사:</span>
                <span class="value">${user.company?.name || 'N/A'}</span>
              </div>
            </div>
            
            ${user.profile ? `
            <div class="section">
              <h3>개인 정보</h3>
              <div class="info-row">
                <span class="label">전체 이름:</span>
                <span class="value">${user.profile.fullName}</span>
              </div>
              <div class="info-row">
                <span class="label">전화번호:</span>
                <span class="value">${user.profile.phone}</span>
              </div>
              <div class="info-row">
                <span class="label">이메일:</span>
                <span class="value">${user.profile.email}</span>
              </div>
              <div class="info-row">
                <span class="label">생년월일:</span>
                <span class="value">${user.profile.birthDate}</span>
              </div>
              <div class="info-row">
                <span class="label">성별:</span>
                <span class="value">${user.profile.gender === 'male' ? '남성' : user.profile.gender === 'female' ? '여성' : '기타'}</span>
              </div>
              <div class="info-row">
                <span class="label">주소:</span>
                <span class="value">${user.profile.address}</span>
              </div>
            </div>
            ` : ''}
            
            ${user.employment ? `
            <div class="section">
              <h3>직무 정보</h3>
              <div class="info-row">
                <span class="label">입사일:</span>
                <span class="value">${user.employment.hireDate}</span>
              </div>
              <div class="info-row">
                <span class="label">부서:</span>
                <span class="value">${user.employment.department}</span>
              </div>
              <div class="info-row">
                <span class="label">직책:</span>
                <span class="value">${user.employment.position}</span>
              </div>
            </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleEditUser = (user: User) => {
    if (!currentUser) {
      setError('사용자 정보를 불러올 수 없습니다.');
      return;
    }

    if (!userMenuPermission.can_update) {
      setError('사용자를 수정할 권한이 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (availableRoles.length === 0 || !availableRoles.includes(user.role)) {
      setError('이 사용자를 수정할 권한이 없습니다.');
      return;
    }

    setEditingUser(user);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (user.profile?.photo) {
      setPhotoPreview(user.profile.photo);
    }
    setNewUser({ 
      userid: user.userid || user.username, 
      username: user.username, 
      password: '', 
      newPassword: '',
      role: user.role, 
      company_id: user.company_id,
      defaultLanguage: user.defaultLanguage || 'ko',
      profile: user.profile || {
        fullName: '',
        phone: '',
        email: '',
        birthDate: '',
        gender: 'male' as const,
        address: '',
        emergencyContact: ''
      },
      employment: user.employment || {
        hireDate: '',
        department: '',
        position: '',
        jobDescription: '',
        promotionHistory: [],
        supervisor: ''
      },
      performance: user.performance || {
        lastEvaluationDate: '',
        overallRating: 3,
        goalAchievement: 3,
        competencyScore: 3,
        evaluationNotes: ''
      },
      education: user.education || {
        degree: '',
        major: '',
        university: '',
        graduationYear: '',
        certifications: [],
        trainingPrograms: []
      },
      skills: user.skills || {
        technicalSkills: [],
        languageSkills: [],
        leadershipSkills: [],
        problemSolvingSkills: [],
        softSkills: []
      },
      attendance: user.attendance || {
        workSchedule: '09:00-18:00',
        vacationDays: 0,
        sickDays: 0,
        overtimeHours: 0,
        attendanceRate: 100
      },
      compensation: user.compensation || {
        baseSalary: 0,
        bonus: 0,
        benefits: [],
        lastRaiseDate: '',
        raiseAmount: 0
      }
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setError(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewingUser(null);
  };

  const handlePhotoDialogOpen = () => {
    setPhotoDialogOpen(true);
  };

  const handlePhotoDialogClose = () => {
    setPhotoDialogOpen(false);
  };

  // 사진 압축 함수
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 원본 비율 유지하면서 크기 조정
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 사진 그리기
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 압축된 이미지를 base64로 변환
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('사진 파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }
      
      setPhotoFile(file);
      
      try {
        // 사진 압축
        const compressedPhoto = await compressImage(file, 800, 0.7);
        setPhotoPreview(compressedPhoto);
        
        // newUser 상태도 업데이트
        setNewUser((prev: any) => ({
          ...prev,
          profile: {
            ...prev.profile,
            photo: compressedPhoto
          }
        }));
        
        setError(null);
        setSnackbar({
          open: true,
          message: '사진이 성공적으로 압축되어 업로드되었습니다.',
          severity: 'success'
        });
      } catch (error) {
        console.error('사진 압축 실패, 원본 파일 사용:', error);
        
        // 압축 실패 시 원본 파일 사용
        const reader = new FileReader();
        reader.onload = (e) => {
          const originalPhoto = e.target?.result as string;
          setPhotoPreview(originalPhoto);
          setNewUser((prev: any) => ({
            ...prev,
            profile: {
              ...prev.profile,
              photo: originalPhoto
            }
          }));
        };
        reader.readAsDataURL(file);
        
        setSnackbar({
          open: true,
          message: '사진 압축에 실패하여 원본 파일을 사용합니다.',
          severity: 'error'
        });
      }
    }
  };

  const handlePhotoDelete = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setNewUser((prev: any) => ({
      ...prev,
      profile: { ...prev.profile, photo: '' }
    }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handlePhotoUpload(event);
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    event.target.value = '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, role: e.target.value });
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, company_id: Number(e.target.value) });
  };

  const handleSaveUser = async () => {
    if (!newUser.username || (!editingUser && !newUser.password)) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }

    if (!currentUser) {
      setError('현재 사용자 정보를 불러올 수 없습니다.');
      return;
    }

    const availableRoles = getAvailableRoles(currentUser.role);
    if (!availableRoles.includes(newUser.role)) {
      setError('선택한 역할을 부여할 권한이 없습니다.');
      return;
    }

    try {
      // 사진 데이터 준비
      let userDataToSend = { ...newUser };
      
      // 사진이 있는 경우 base64 데이터를 profile.photo에 설정
      if (photoFile && photoPreview) {
        userDataToSend.profile = {
          ...userDataToSend.profile,
          photo: photoPreview
        };
      } else if (photoPreview && !photoFile) {
        // 기존 사진이 있고 새로 선택하지 않은 경우
        userDataToSend.profile = {
          ...userDataToSend.profile,
          photo: photoPreview
        };
      }

      if (editingUser) {
        // 사용자 수정
        const updateData = {
          userid: newUser.userid,
          username: newUser.username,
          role: newUser.role,
          company_id: newUser.company_id,
          ...(newUser.password && { password: newUser.password }),
          profile: userDataToSend.profile,
          employment: userDataToSend.employment,
          performance: userDataToSend.performance,
          education: userDataToSend.education,
          skills: userDataToSend.skills,
          attendance: userDataToSend.attendance,
          compensation: userDataToSend.compensation,
          default_language: userDataToSend.defaultLanguage
        };
        
        await axios.put(`/api/users/${editingUser.id}`, updateData);
        
        setSnackbar({
          open: true,
          message: '사용자가 성공적으로 수정되었습니다.',
          severity: 'success'
        });
      } else {
        // 사용자 추가
        const addData = {
          userid: newUser.userid,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          company_id: newUser.company_id,
          default_language: newUser.defaultLanguage,
          profile: userDataToSend.profile,
          employment: userDataToSend.employment,
          performance: userDataToSend.performance,
          education: userDataToSend.education,
          skills: userDataToSend.skills,
          attendance: userDataToSend.attendance,
          compensation: userDataToSend.compensation
        };
        
        await axios.post('/api/users', addData);
        
        setSnackbar({
          open: true,
          message: '사용자가 성공적으로 추가되었습니다.',
          severity: 'success'
        });
      }
      fetchUsers();
      setDialogOpen(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || (editingUser ? '사용자 수정에 실패했습니다.' : '사용자 추가에 실패했습니다.');
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700} fontSize="0.85rem">직원정보관리</Typography>
        {currentUser && !!userMenuPermission.can_create && getAvailableRoles(currentUser.role).length > 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleDialogOpen} sx={{ fontSize: '0.8rem', textTransform: 'none' }}>사용자 추가</Button>
        )}
      </Box>

      {/* 검색 영역 */}
      <Paper sx={{ p: 2, mb: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="사용자 ID 또는 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666', fontSize: '1rem' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>역할</InputLabel>
            <Select
              value={selectedRole}
              label="역할"
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {getAvailableRoleOptions().map(role => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>회사</InputLabel>
            <Select
              value={selectedCompany}
              label="회사"
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <MenuItem value="전체">전체</MenuItem>
              {companies.map(company => (
                <MenuItem key={company.company_id} value={company.company_id.toString()}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <IconButton 
            size="small" 
            onClick={() => {
              setSearchTerm('');
              setSelectedRole('전체');
              setSelectedCompany('전체');
            }}
            sx={{ color: '#666' }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress size={18} />
        </Box>
      ) : users.length === 0 ? (
        <Paper sx={{ 
          boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', 
          borderRadius: 3, 
          border: '1px solid #e3eafc',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#8b95a1',
              fontSize: '1rem',
              fontWeight: 500,
              mb: 1 
            }}
          >
            사용자가 없습니다
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#8b95a1',
              fontSize: '0.875rem' 
            }}
          >
            {currentUser?.role === 'root' 
              ? '등록된 사용자가 없습니다. 새 사용자를 추가해보세요.' 
              : '내 회사에 등록된 사용자가 없습니다. 새 사용자를 추가해보세요.'
            }
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 4px 24px rgba(25, 118, 210, 0.10)', borderRadius: 3, border: '1px solid #e3eafc' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>사용자명</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>부서</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>직책</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>권한</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222' }}>입사일</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.7, color: '#222', textAlign: 'center' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => {
                const hasRolePermission = currentUser && getAvailableRoles(currentUser.role).includes(user.role);
                const hasMenuPermission = userMenuPermission.can_update;
                const canEdit = hasRolePermission && hasMenuPermission;
                
                return (
                  <TableRow 
                    key={user.id} 
                    hover 
                    sx={{ 
                      '&:hover': { background: '#f0f6ff' },
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewUser(user)}
                  >
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar 
                          src={user.profile?.photo || undefined}
                          onClick={(e) => {
                            if (user.profile?.photo) {
                              e.stopPropagation();
                              setViewingUser(user);
                              handlePhotoDialogOpen();
                            }
                          }}
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: '0.6rem', 
                            bgcolor: user.profile?.photo ? 'transparent' : '#1976d2',
                            cursor: user.profile?.photo ? 'pointer' : 'default',
                            transition: 'transform 0.2s ease-in-out',
                            '&:hover': user.profile?.photo ? {
                              transform: 'scale(1.2)'
                            } : {}
                          }}
                        >
                          {!user.profile?.photo && (user.profile?.fullName?.charAt(0) || user.username.charAt(0))}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {user.profile?.fullName || user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.employment?.department || 'N/A'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>{user.employment?.position || 'N/A'}</TableCell>
                    <TableCell sx={{ py: 0.7 }}>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role) as any}
                        size="small"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', py: 0.7, color: '#4b5b6b' }}>
                      {user.employment?.hireDate ? new Date(user.employment.hireDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                        disabled={!canEdit}
                        sx={{ 
                          fontSize: '0.75rem',
                          color: canEdit ? '#1976d2' : '#ccc',
                          '&:hover': { 
                            backgroundColor: canEdit ? 'rgba(25, 118, 210, 0.1)' : 'transparent' 
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          {editingUser ? '직원 정보 수정' : '직원 정보 관리'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
            <Tab label="기본 정보" />
            <Tab label="개인 정보" />
            <Tab label="직무 정보" />
            <Tab label="성과 평가" />
            <Tab label="교육/스킬" />
            <Tab label="근태/보상" />
          </Tabs>
          
          {activeTab === 0 && (
            <Grid container spacing={2}>
              {/* 프로필 사진 업로드 */}
              <Grid item xs={12} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    src={photoPreview || undefined}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      fontSize: '2rem',
                      bgcolor: photoPreview ? 'transparent' : '#1976d2',
                      border: '2px solid #e0e0e0'
                    }}
                  >
                    {!photoPreview && (newUser.profile?.fullName?.charAt(0) || newUser.username.charAt(0))}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 1 }}>
                      프로필 사진
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                      />
                      <label htmlFor="photo-upload">
                        <Button
                          component="span"
                          variant="outlined"
                          size="small"
                          startIcon={<PhotoCameraIcon />}
                          sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                        >
                          사진 선택
                        </Button>
                      </label>
                      {photoPreview && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handlePhotoDelete}
                          sx={{ fontSize: '0.7rem', textTransform: 'none', color: '#d32f2f' }}
                        >
                          삭제
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#999', mt: 0.5, display: 'block' }}>
                      JPG, PNG, GIF 파일 (최대 5MB, 자동 압축됨)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
          <TextField 
                  label="사용자 ID (로그인용)" 
                  name="userid" 
                  value={newUser.userid} 
            onChange={handleInputChange} 
            fullWidth 
            size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          />
              </Grid>
              <Grid item xs={12} sm={6}>
          <TextField 
                  label="사용자명 (실제 이름)" 
                  name="profile.fullName" 
                  value={newUser.profile?.fullName || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, fullName: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label={editingUser ? "기존 비밀번호:" : "비밀번호 *"} 
            name="password" 
            type="password" 
            value={newUser.password} 
            onChange={handleInputChange} 
            fullWidth 
            size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label={editingUser ? "새 비밀번호 (변경하지 않으려면 비워두세요)" : ""} 
                  name="newPassword" 
                  type="password" 
                  value={newUser.newPassword || ''} 
                  onChange={(e) => setNewUser({ ...newUser, newPassword: e.target.value })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
          <TextField 
            select 
                  label="역할" 
            name="role" 
            value={newUser.role} 
            onChange={handleRoleChange} 
            fullWidth 
            size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          >
            {currentUser && getAvailableRoles(currentUser.role).map(role => (
              <MenuItem key={role} value={role} sx={{ fontSize: '0.75rem' }}>
                {role}
              </MenuItem>
            ))}
          </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
          <TextField 
            select 
            label="회사" 
            name="company_id" 
            value={newUser.company_id} 
            onChange={handleCompanyChange} 
            fullWidth 
            size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
          >
            {companies.map(company => (
              <MenuItem key={company.company_id} value={company.company_id} sx={{ fontSize: '0.75rem' }}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  select 
                  label="기본 언어" 
                  name="defaultLanguage" 
                  value={newUser.defaultLanguage || 'ko'} 
                  onChange={(e) => setNewUser({ ...newUser, defaultLanguage: e.target.value })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                >
                  <MenuItem value="ko" sx={{ fontSize: '0.75rem' }}>한국어</MenuItem>
                  <MenuItem value="en" sx={{ fontSize: '0.75rem' }}>English</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="사용자명 (실제 이름)" 
                  name="profile.fullName" 
                  value={newUser.profile?.fullName || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, fullName: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="연락처" 
                  name="profile.phone" 
                  value={newUser.profile?.phone || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, phone: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="이메일" 
                  name="profile.email" 
                  value={newUser.profile?.email || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, email: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="생년월일" 
                  name="profile.birthDate" 
                  type="date" 
                  value={newUser.profile?.birthDate || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, birthDate: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  select 
                  label="성별" 
                  name="profile.gender" 
                  value={newUser.profile?.gender || 'male'} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, gender: e.target.value as 'male' | 'female' | 'other' }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                >
                  <MenuItem value="male">남성</MenuItem>
                  <MenuItem value="female">여성</MenuItem>
                  <MenuItem value="other">기타</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="주소" 
                  name="profile.address" 
                  value={newUser.profile?.address || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, address: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="비상연락처" 
                  name="profile.emergencyContact" 
                  value={newUser.profile?.emergencyContact || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    profile: { ...newUser.profile, emergencyContact: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="입사일" 
                  name="employment.hireDate" 
                  type="date" 
                  value={newUser.employment?.hireDate || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    employment: { ...newUser.employment, hireDate: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="부서" 
                  name="employment.department" 
                  value={newUser.employment?.department || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    employment: { ...newUser.employment, department: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="직책" 
                  name="employment.position" 
                  value={newUser.employment?.position || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    employment: { ...newUser.employment, position: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="상사" 
                  name="employment.supervisor" 
                  value={newUser.employment?.supervisor || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    employment: { ...newUser.employment, supervisor: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="직무 내용" 
                  name="employment.jobDescription" 
                  value={newUser.employment?.jobDescription || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    employment: { ...newUser.employment, jobDescription: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  multiline
                  rows={3}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="최근 평가일" 
                  name="performance.lastEvaluationDate" 
                  type="date" 
                  value={newUser.performance?.lastEvaluationDate || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    performance: { ...newUser.performance, lastEvaluationDate: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>전체 평가</Typography>
                  <Rating 
                    value={newUser.performance?.overallRating || 3} 
                    onChange={(e, newValue) => setNewUser({
                      ...newUser,
                      performance: { ...newUser.performance, overallRating: newValue || 3 }
                    })}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>목표 달성도</Typography>
                  <Rating 
                    value={newUser.performance?.goalAchievement || 3} 
                    onChange={(e, newValue) => setNewUser({
                      ...newUser,
                      performance: { ...newUser.performance, goalAchievement: newValue || 3 }
                    })}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 1 }}>역량 점수</Typography>
                  <Rating 
                    value={newUser.performance?.competencyScore || 3} 
                    onChange={(e, newValue) => setNewUser({
                      ...newUser,
                      performance: { ...newUser.performance, competencyScore: newValue || 3 }
                    })}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="평가 메모" 
                  name="performance.evaluationNotes" 
                  value={newUser.performance?.evaluationNotes || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    performance: { ...newUser.performance, evaluationNotes: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  multiline
                  rows={3}
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 4 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="학위" 
                  name="education.degree" 
                  value={newUser.education?.degree || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    education: { ...newUser.education, degree: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="전공" 
                  name="education.major" 
                  value={newUser.education?.major || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    education: { ...newUser.education, major: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="대학교" 
                  name="education.university" 
                  value={newUser.education?.university || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    education: { ...newUser.education, university: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="졸업년도" 
                  name="education.graduationYear" 
                  value={newUser.education?.graduationYear || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    education: { ...newUser.education, graduationYear: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="기술 스킬 (쉼표로 구분)" 
                  name="skills.technicalSkills" 
                  value={newUser.skills?.technicalSkills?.join(', ') || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    skills: { ...newUser.skills, technicalSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="외국어 능력 (쉼표로 구분)" 
                  name="skills.languageSkills" 
                  value={newUser.skills?.languageSkills?.join(', ') || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    skills: { ...newUser.skills, languageSkills: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 5 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="근무 시간" 
                  name="attendance.workSchedule" 
                  value={newUser.attendance?.workSchedule || ''} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    attendance: { ...newUser.attendance, workSchedule: e.target.value }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="연차 일수" 
                  name="attendance.vacationDays" 
                  type="number" 
                  value={newUser.attendance?.vacationDays || 0} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    attendance: { ...newUser.attendance, vacationDays: parseInt(e.target.value) || 0 }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="기본급" 
                  name="compensation.baseSalary" 
                  type="number" 
                  value={newUser.compensation?.baseSalary || 0} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    compensation: { ...newUser.compensation, baseSalary: parseInt(e.target.value) || 0 }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  label="상여금" 
                  name="compensation.bonus" 
                  type="number" 
                  value={newUser.compensation?.bonus || 0} 
                  onChange={(e) => setNewUser({
                    ...newUser,
                    compensation: { ...newUser.compensation, bonus: parseInt(e.target.value) || 0 }
                  })} 
                  fullWidth 
                  size="small"
                  sx={{ '& .MuiInputLabel-root': { fontSize: '0.75rem' }, '& .MuiInputBase-input': { fontSize: '0.75rem' } }} 
                />
              </Grid>
            </Grid>
          )}

          {error && <Typography color="error" sx={{ mt: 2, fontSize: '0.75rem' }}>{error}</Typography>}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleDialogClose} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>취소</Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editingUser ? '수정' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 정보 보기 다이얼로그 */}
      <Dialog open={viewDialogOpen} onClose={handleViewDialogClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontSize: '0.85rem', fontWeight: 700, pb: 1 }}>
          직원 정보 상세보기
        </DialogTitle>
        <DialogContent>
          {viewingUser && (
            <Box>
              {/* 프로필 사진 */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Avatar 
                  src={viewingUser.profile?.photo || undefined}
                  onClick={viewingUser.profile?.photo ? handlePhotoDialogOpen : undefined}
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    fontSize: '3rem',
                    bgcolor: viewingUser.profile?.photo ? 'transparent' : '#1976d2',
                    border: '3px solid #e0e0e0',
                    cursor: viewingUser.profile?.photo ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': viewingUser.profile?.photo ? {
                      transform: 'scale(1.05)'
                    } : {}
                  }}
                >
                  {!viewingUser.profile?.photo && (viewingUser.profile?.fullName?.charAt(0) || viewingUser.username.charAt(0))}
                </Avatar>
              </Box>
              
              {/* 기본 정보 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                기본 정보
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>사용자 ID</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>{viewingUser.userid || viewingUser.username}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>역할</Typography>
                  <Chip
                    label={getRoleLabel(viewingUser.role)}
                    color={getRoleColor(viewingUser.role) as any}
                    size="small"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>회사</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {companies.find(c => c.company_id === viewingUser.company_id)?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>기본 언어</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.defaultLanguage === 'ko' ? '한국어' : 'English'}
                  </Typography>
                </Grid>
              </Grid>

              {/* 개인 정보 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                개인 정보
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>사용자명</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.fullName || viewingUser.username}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>연락처</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.phone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>이메일</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>생년월일</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.birthDate || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>성별</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.gender === 'male' ? '남성' : viewingUser.profile?.gender === 'female' ? '여성' : '기타'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>주소</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.profile?.address || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* 직무 정보 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                직무 정보
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>부서</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.employment?.department || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>직책</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.employment?.position || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>입사일</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.employment?.hireDate || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>상사</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.employment?.supervisor || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>직무 내용</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.employment?.jobDescription || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* 성과 평가 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                성과 평가
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>최근 평가일</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.performance?.lastEvaluationDate || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>전체 평가</Typography>
                  <Rating value={viewingUser.performance?.overallRating || 0} readOnly size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>목표 달성도</Typography>
                  <Rating value={viewingUser.performance?.goalAchievement || 0} readOnly size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>역량 점수</Typography>
                  <Rating value={viewingUser.performance?.competencyScore || 0} readOnly size="small" />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>평가 메모</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.performance?.evaluationNotes || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* 교육/스킬 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                교육/스킬
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>학위</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.education?.degree || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>전공</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.education?.major || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>대학교</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.education?.university || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>졸업년도</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.education?.graduationYear || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>기술 스킬</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.skills?.technicalSkills?.join(', ') || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>외국어 능력</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.skills?.languageSkills?.join(', ') || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* 근태/보상 */}
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 2, color: '#1976d2' }}>
                근태/보상
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>근무 시간</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.attendance?.workSchedule || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>연차 일수</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.attendance?.vacationDays || 0}일
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>기본급</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.compensation?.baseSalary?.toLocaleString() || 0}원
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>상여금</Typography>
                  <Typography variant="body1" sx={{ fontSize: '0.8rem' }}>
                    {viewingUser.compensation?.bonus?.toLocaleString() || 0}원
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button onClick={handleViewDialogClose} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>닫기</Button>
          <Button 
            onClick={() => handlePrintUser(viewingUser!)}
            variant="outlined"
            startIcon={<PrintIcon />}
            sx={{ 
              fontSize: '0.75rem', 
              textTransform: 'none',
              color: '#1976d2',
              borderColor: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }}
          >
            인쇄
          </Button>
          {currentUser && getAvailableRoles(currentUser.role).includes(viewingUser?.role || '') && userMenuPermission.can_update && (
            <Button 
              onClick={() => {
                handleViewDialogClose();
                handleEditUser(viewingUser!);
              }} 
              variant="contained" 
              sx={{ fontSize: '0.75rem', textTransform: 'none' }}
            >
              수정
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 사진 팝업 다이얼로그 */}
      <Dialog
        open={photoDialogOpen}
        onClose={handlePhotoDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          textAlign: 'center',
          color: '#1976d2'
        }}>
          {viewingUser?.profile?.fullName || viewingUser?.username}의 프로필 사진
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {viewingUser?.profile?.photo && (
            <Box
              component="img"
              src={viewingUser.profile.photo}
              alt="프로필 사진"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2, justifyContent: 'center' }}>
          <Button 
            onClick={handlePhotoDialogClose} 
            variant="outlined"
            sx={{ 
              fontSize: '0.75rem', 
              textTransform: 'none',
              borderRadius: '8px',
              px: 3
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', fontSize: '0.75rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserPage; 