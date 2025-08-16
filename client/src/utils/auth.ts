import axios from 'axios';

// 인증 관련 유틸리티 함수들
export const AuthUtils = {
  // 토큰 가져오기
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  // 사용자 정보 가져오기
  getUser: (): any | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
        return null;
      }
    }
    return null;
  },

  // 로그인 상태 확인
  isLoggedIn: (): boolean => {
    const token = AuthUtils.getToken();
    if (!token) return false;

    try {
      // JWT 토큰의 만료 시간 확인
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      // 토큰이 만료되었으면 false 반환
      if (payload.exp && payload.exp < currentTime) {
        AuthUtils.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('토큰 검증 오류:', error);
      AuthUtils.logout();
      return false;
    }
  },

  // 로그아웃
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // axios 기본 헤더에서 Authorization 제거
    delete axios.defaults.headers.common['Authorization'];
  },

  // 토큰 설정
  setToken: (token: string): void => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // 사용자 정보 설정
  setUser: (user: any): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // 토큰을 axios 기본 헤더에 설정
  setupAxiosToken: (): void => {
    const token = AuthUtils.getToken();
    if (token && AuthUtils.isLoggedIn()) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

// Axios 인터셉터 설정
let isRedirecting = false;

export const setupAxiosInterceptors = () => {
  // 요청 인터셉터: 토큰을 자동으로 헤더에 추가
  axios.interceptors.request.use(
    (config) => {
      const token = AuthUtils.getToken();
      if (token && AuthUtils.isLoggedIn()) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터: 401 에러 시 자동 로그인 페이지로 리다이렉트
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // 401 Unauthorized 에러 처리
      if (error.response?.status === 401 && !isRedirecting) {
        console.log('401 에러 감지 - 자동 로그아웃 및 로그인 페이지로 이동');
        
        isRedirecting = true;
        
        // 토큰 제거
        AuthUtils.logout();
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        
        // 몇 초 후 플래그 초기화 (페이지 이동이 안될 경우를 대비)
        setTimeout(() => {
          isRedirecting = false;
        }, 3000);
      }
      
      return Promise.reject(error);
    }
  );
};
