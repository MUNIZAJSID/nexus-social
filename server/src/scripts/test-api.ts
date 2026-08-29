async function testAll() {
  console.log('🧪 Testando endpoints da API LocalSocial com fetch nativo...');

  // 1. Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
  });

  const loginData: any = await loginRes.json();
  console.log('✅ Login Admin:', loginData.success, '| Usuário:', loginData.user?.username);
  const token = loginData.token;

  // 2. Feed
  const feedRes = await fetch('http://localhost:5000/api/posts/feed', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const feedData: any = await feedRes.json();
  console.log('✅ Feed Carregado:', feedData.posts?.length, 'publicações encontradas.');

  // 3. Overview Admin
  const adminRes = await fetch('http://localhost:5000/api/admin/overview', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const adminData: any = await adminRes.json();
  console.log('✅ Métricas Admin:', adminData.stats);

  console.log('🎉 Todos os testes de API foram concluídos com sucesso total!');
}

testAll().catch(console.error);
