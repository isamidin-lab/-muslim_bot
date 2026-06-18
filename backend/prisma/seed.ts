import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  // Tenant
  const tenant = await prisma.tenant.create({
    data: { name: 'Demo Academy', slug: 'demo-academy', description: 'Islamic education platform' }
  });

  // Admin user
  const pw = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id, firstName: 'Admin', lastName: 'User',
      email: 'admin@muslim-bot.com', passwordHash: pw, role: 'OWNER',
      referralCode: 'ref_admin_' + Date.now(), coins: 1000,
    }
  });

  // Channels
  await prisma.channel.create({
    data: { tenantId: tenant.id, telegramId: '-1001234567890', title: 'Demo Channel', username: 'demo_channel' }
  });

  // Memberships
  await prisma.membership.create({
    data: { tenantId: tenant.id, name: 'Basic', description: 'Basic access', price: 9.99, interval: 'MONTHLY', features: JSON.stringify(['Courses', 'Channel']) }
  });
  await prisma.membership.create({
    data: { tenantId: tenant.id, name: 'Premium', description: 'Full access', price: 29.99, interval: 'MONTHLY', features: JSON.stringify(['Everything', '1-on-1']), sortOrder: 1 }
  });

  // Course
  const course = await prisma.course.create({
    data: { tenantId: tenant.id, title: 'Arabic for Beginners', slug: 'arabic-beginners', description: 'Learn Arabic from scratch', isPublished: true, isFeatured: true }
  });
  const mod = await prisma.courseModule.create({
    data: { courseId: course.id, title: 'Module 1: Arabic Alphabet', sortOrder: 1, isPublished: true }
  });
  const lesson = await prisma.lesson.create({
    data: { moduleId: mod.id, title: 'Lesson 1: Alif, Ba, Ta', content: 'Introduction to Arabic alphabet...', isPublished: true, isFree: true, sortOrder: 1 }
  });
  const test = await prisma.test.create({
    data: { lessonId: lesson.id, title: 'Alphabet Quiz', passScore: 70, isPublished: true }
  });
  await prisma.testQuestion.create({
    data: { testId: test.id, question: 'What is the first Arabic letter?', type: 'MULTIPLE_CHOICE', options: JSON.stringify(['Alif', 'Ba', 'Ta', 'Tha']), correctAnswer: 'Alif' }
  });

  // Promocode
  const promo = await prisma.promotion.create({
    data: { tenantId: tenant.id, name: 'Launch', discount: 20, isPercent: true, maxUses: 100, codes: { create: { code: 'LAUNCH20' } } }
  });

  // Achievements
  const achievements = [
    { name: 'Первое знакомство', description: 'Зарегистрировались в боте', icon: '👋', category: 'social', requirement: 'register', reward: 10 },
    { name: 'Заполнил анкету', description: 'Заполнили профиль полностью', icon: '📝', category: 'profile', requirement: 'complete_profile', reward: 20 },
    { name: 'Неделя активности', description: 'Были активны 7 дней подряд', icon: '🔥', category: 'activity', requirement: 'streak_7', reward: 50 },
    { name: 'Первый курс', description: 'Начали первый курс', icon: '📚', category: 'learning', requirement: 'first_course', reward: 15 },
    { name: 'Пригласил друга', description: 'Пригласили первого друга', icon: '🤝', category: 'social', requirement: 'first_referral', reward: 30 },
    { name: 'Premium пользователь', description: 'Купили Premium', icon: '⭐', category: 'premium', requirement: 'premium', reward: 0 },
    { name: 'VIP пользователь', description: 'Купили VIP', icon: '👑', category: 'premium', requirement: 'vip', reward: 0 },
    { name: 'Мастер тасбиха', description: 'Сделали 100 тасбихов', icon: '📿', category: 'islamic', requirement: 'tasbih_100', reward: 25 },
    { name: 'Пятница Мубарак', description: 'Были активны в пятницу', icon: '🕌', category: 'islamic', requirement: 'friday_active', reward: 10 },
  ];
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }

  // BotSettings
  const settings = [
    { key: 'coins_daily', value: '10' },
    { key: 'coins_referral', value: '50' },
    { key: 'premium_price_coins', value: '500' },
    { key: 'vip_price_coins', value: '1500' },
    { key: 'boost_price_coins', value: '20' },
    { key: 'max_referral_reward', value: '100' },
  ];
  for (const s of settings) {
    await prisma.botSettings.create({ data: s });
  }

  console.log('Seed complete!');
  console.log(`Tenant: ${tenant.id}`);
  console.log(`Admin: admin@muslim-bot.com / admin123`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
