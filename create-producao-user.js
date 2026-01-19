const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createProducaoUser() {
  try {
    // Hash da senha
    const passwordHash = await bcrypt.hash('bruno0154', 10);
    
    // Criar usuário PRODUCAO
    const user = await prisma.user.create({
      data: {
        id: 'dc743e32-342c-49c7-a5ba-4a148956f07d',
        email: 'producao@ecompack.com',
        name: 'Produção',
        role: 'PRODUCAO',
        passwordHash: passwordHash,
        isActive: true
      }
    });
    
    console.log('✅ Usuário PRODUCAO criado com sucesso!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Nome:', user.name);
    console.log('Role:', user.role);
    console.log('Senha:', 'bruno0154');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createProducaoUser();
