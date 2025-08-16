import axios from 'axios';

const testAdminMenuTree = async () => {
  console.log('🧪 Admin 메뉴 트리 권한 테스트 시작...');
  
  try {
    // 1. Jinwoo Lee (admin) 로그인
    console.log('\n1️⃣ Jinwoo Lee (admin) 로그인 시도...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      userid: 'jwits',
      password: 'admin'
    });

    if (!loginResponse.data.success) {
      console.log('❌ 로그인 실패:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ 로그인 성공! 토큰 획득');

    // 2. 일반 메뉴 API 호출 (실제 접근 가능한 메뉴)
    console.log('\n2️⃣ 일반 메뉴 API (/api/menu) 호출...');
    const menuResponse = await axios.get('http://localhost:3001/api/menu', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const accessibleMenus = menuResponse.data.data || [];
    console.log(`✅ 실제 접근 가능한 메뉴: ${accessibleMenus.length}개`);
    accessibleMenus.forEach((menu: any, index: number) => {
      console.log(`  ${index + 1}. ${menu.name} (${menu.url})`);
    });

    // 3. 메뉴 트리 API 호출 (권한 설정 시 보이는 메뉴)
    console.log('\n3️⃣ 메뉴 트리 API (/api/menu/tree) 호출...');
    const treeResponse = await axios.get('http://localhost:3001/api/menu/tree', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const treeMenus = treeResponse.data.data || [];
    const flatTreeMenus = flattenMenuTree(treeMenus);
    console.log(`✅ 권한 설정 시 보이는 메뉴: ${flatTreeMenus.length}개`);
    flatTreeMenus.forEach((menu: any, index: number) => {
      console.log(`  ${index + 1}. ${menu.name} (${menu.url})`);
    });

    // 4. 비교 결과
    console.log('\n4️⃣ 결과 비교:');
    console.log(`실제 접근 가능한 메뉴: ${accessibleMenus.length}개`);
    console.log(`권한 설정 시 보이는 메뉴: ${flatTreeMenus.length}개`);
    
    if (accessibleMenus.length === flatTreeMenus.length) {
      console.log('✅ 성공! 메뉴 개수가 일치합니다.');
      
      // 메뉴 내용도 비교
      const accessibleMenuNames = accessibleMenus.map((m: any) => m.name).sort();
      const treeMenuNames = flatTreeMenus.map((m: any) => m.name).sort();
      
      const namesMatch = JSON.stringify(accessibleMenuNames) === JSON.stringify(treeMenuNames);
      if (namesMatch) {
        console.log('✅ 완벽! 메뉴 내용도 일치합니다.');
      } else {
        console.log('⚠️ 메뉴 내용이 다릅니다.');
        console.log('실제 메뉴:', accessibleMenuNames);
        console.log('트리 메뉴:', treeMenuNames);
      }
    } else {
      console.log('❌ 실패! 메뉴 개수가 다릅니다.');
      console.log('💡 Admin은 자신이 접근할 수 있는 메뉴만 다른 사용자에게 권한을 줄 수 있어야 합니다.');
    }

  } catch (error: any) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
  }
};

// 메뉴 트리를 평면화하는 함수
function flattenMenuTree(menuTree: any[]): any[] {
  const result: any[] = [];
  
  function traverse(menus: any[]) {
    for (const menu of menus) {
      result.push(menu);
      if (menu.children && menu.children.length > 0) {
        traverse(menu.children);
      }
    }
  }
  
  traverse(menuTree);
  return result;
}

testAdminMenuTree();
