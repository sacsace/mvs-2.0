import axios from 'axios';

async function testMenuAPIEndpoint() {
  try {
    console.log('메뉴 API 엔드포인트 테스트 시작...');
    
    // 1. 로그인하여 토큰 얻기
    console.log('\n1. 로그인 시도...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'root',
      password: 'admin'
    });
    
    console.log('로그인 응답:', loginResponse.status);
    console.log('로그인 데이터:', loginResponse.data);
    
    if (!loginResponse.data.token) {
      console.error('토큰을 받지 못했습니다.');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('토큰 받음:', token.substring(0, 20) + '...');
    
    // 2. 메뉴 트리 API 호출 (인증 필요)
    console.log('\n2. 메뉴 트리 API 호출...');
    const menuResponse = await axios.get('http://localhost:3001/api/menus/tree', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('메뉴 API 응답 상태:', menuResponse.status);
    console.log('메뉴 API 응답 데이터:', JSON.stringify(menuResponse.data, null, 2));
    
    // 3. 일반 메뉴 API 호출 (인증 필요)
    console.log('\n3. 일반 메뉴 API 호출...');
    const menuResponse2 = await axios.get('http://localhost:3001/api/menus', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('일반 메뉴 API 응답 상태:', menuResponse2.status);
    console.log('일반 메뉴 API 응답 데이터:', JSON.stringify(menuResponse2.data, null, 2));
    
  } catch (error: any) {
    console.error('API 테스트 중 오류 발생:');
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('요청 오류:', error.request);
    } else {
      console.error('오류:', error.message);
    }
  }
}

testMenuAPIEndpoint(); 