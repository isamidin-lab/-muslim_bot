import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Context, Markup } from 'telegraf';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { MembershipService } from '../membership/membership.service';

const COINS_DAILY = 10;
const COINS_REFERRAL = 50;
const COINS_CHECKIN_STREAK_BONUS = 5;

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private membershipService: MembershipService,
  ) {}

  onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) { this.logger.warn('No bot token, disabled'); return; }
    this.bot = new Telegraf(token);
    this.setupCommands();
    this.setupPayments();
    this.setupCallbackHandlers();
    this.bot.launch();
    this.logger.log('Telegram bot started');
  }

  private isAdmin(role: string): boolean {
    return ['OWNER', 'SYSTEM_ADMIN', 'TENANT_ADMIN', 'MODERATOR'].includes(role);
  }

  private isOwner(role: string): boolean {
    return role === 'OWNER';
  }

  private getMainKeyboard(role: string) {
    const buttons: any[][] = [
      [{ text: '📚 Курсы', callback_data: 'courses' }, { text: '💳 Тарифы', callback_data: 'membership' }],
      [{ text: '📊 Прогресс', callback_data: 'progress' }, { text: '💰 Монеты', callback_data: 'coins' }],
      [{ text: '🎯 Достижения', callback_data: 'achievements' }, { text: '☪️ Ислам', callback_data: 'islamic' }],
      [{ text: '🔗 Реферал', callback_data: 'referral' }, { text: '👤 Профиль', callback_data: 'profile' }],
    ];
    if (this.isAdmin(role)) {
      buttons.push([{ text: '👑 Админ', callback_data: 'admin' }]);
    }
    return { reply_markup: { inline_keyboard: buttons } };
  }

  private getBackButton(target: string) {
    return { reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: target }]] } };
  }

  private setupCommands() {
    this.bot.start(async (ctx) => {
      const tid = ctx.from.id.toString();
      const tenant = await this.prisma.tenant.findFirst({ where: { isActive: true } });
      if (!tenant) return ctx.reply('Нет активной организации.');

      let user = await this.prisma.user.findFirst({ where: { telegramId: tid, tenantId: tenant.id } });
      if (!user) {
        const refCode = ctx.startPayload;
        user = await this.prisma.user.create({
          data: {
            telegramId: tid, telegramUsername: ctx.from.username,
            firstName: ctx.from.first_name || 'Пользователь',
            lastName: ctx.from.last_name,
            tenantId: tenant.id, role: 'MEMBER',
            referralCode: `ref_${tid}_${Date.now()}`,
          },
        });
        if (refCode) {
          const referrer = await this.prisma.user.findFirst({ where: { referralCode: refCode } });
          if (referrer && referrer.id !== user.id) {
            await this.prisma.user.update({ where: { id: user.id }, data: { referredById: referrer.id } });
            await this.prisma.referral.create({ data: { referrerId: referrer.id, referredId: user.id, reward: COINS_REFERRAL } });
            await this.prisma.user.update({ where: { id: referrer.id }, data: { coins: { increment: COINS_REFERRAL } } });
            await this.prisma.coinTransaction.create({ data: { userId: referrer.id, amount: COINS_REFERRAL, type: 'REFERRAL', reason: `Приглашение ${user.firstName}` } });
            await this.bot.telegram.sendMessage(parseInt(referrer.telegramId!), `🎉 ${user.firstName} присоединился по вашей ссылке! +${COINS_REFERRAL} монет`);
          }
        }
      }

      if (!user.referralCode) {
        await this.prisma.user.update({ where: { id: user.id }, data: { referralCode: `ref_${tid}_${Date.now()}` } });
        user = await this.prisma.user.findFirst({ where: { telegramId: tid } });
      }

      const badges = [];
      if (user.isVIP) badges.push('👑 VIP');
      else if (user.isPremium) badges.push('⭐ Premium');
      if (user.role === 'OWNER') badges.push('🔧 Owner');
      else if (user.role === 'SYSTEM_ADMIN') badges.push('🛡 Admin');

      return ctx.reply(
        `Ассалому алейкум, ${user.firstName}! 👋\nДобро пожаловать в Muslim Bot.\n${badges.length ? `\n${badges.join(' ')}` : ''}`,
        this.getMainKeyboard(user.role) as any,
      );
    });

    this.bot.command('admin', async (ctx) => {
      const user = await this.getUser(ctx);
      if (!user || !this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
      return this.showAdminPanel(ctx, user);
    });

    this.bot.command('help', (ctx) => ctx.reply(
      '🤖 Команды:\n' +
      '/start — Меню\n' +
      '/admin — Админ-панель\n' +
      '/help — Помощь\n\n' +
      'Оплата: /membership\n' +
      'Курсы: /courses\n' +
      'Прогресс: /progress',
    ));
  }

  private setupCallbackHandlers() {
    this.bot.on('callback_query', async (ctx) => {
      const data = (ctx.callbackQuery as any).data;
      if (!data) return;
      const [action, id, extra] = data.split(':');
      const user = await this.getUser(ctx);
      if (!user) return;

      try {
        await (ctx as any).answerCbQuery();
      } catch {}

      switch (action) {
        case 'courses': return this.handleCourses(ctx, user);
        case 'course': return this.handleCourseDetail(ctx, user, id);
        case 'lesson': return this.handleLesson(ctx, user, id);
        case 'test': return this.handleTest(ctx, user, id);
        case 'answer': return this.handleAnswer(ctx, user, id, extra);
        case 'membership': return this.handleMembership(ctx, user);
        case 'buy': return this.handleBuy(ctx, user, id);
        case 'progress': return this.handleProgress(ctx, user);
        case 'coins': return this.handleCoins(ctx, user);
        case 'checkin': return this.handleCheckin(ctx, user);
        case 'achievements': return this.handleAchievements(ctx, user);
        case 'islamic': return this.handleIslamic(ctx, user);
        case 'prayer': return this.handlePrayer(ctx, user);
        case 'azkar': return this.handleAzkar(ctx, user);
        case 'tasbih': return this.handleTasbih(ctx, user);
        case 'qibla': return this.handleQibla(ctx, user);
        case 'referral': return this.handleReferral(ctx, user);
        case 'profile': return this.handleProfile(ctx, user);
        case 'profile_edit': return this.handleProfileEdit(ctx, user);
        case 'admin': return this.showAdminPanel(ctx, user);
        case 'admin_stats': return this.handleAdminStats(ctx, user);
        case 'admin_users': return this.handleAdminUsers(ctx, user);
        case 'admin_broadcast': return this.handleAdminBroadcast(ctx, user);
        case 'admin_complaints': return this.handleAdminComplaints(ctx, user);
        case 'admin_logs': return this.handleAdminLogs(ctx, user);
        case 'admin_settings': return this.handleAdminSettings(ctx, user);
        case 'admin_user_action': return this.handleAdminUserAction(ctx, user, id);
        case 'admin_broadcast_target': return this.handleAdminBroadcastTarget(ctx, user, id);
        case 'admin_ban': return this.handleAdminBan(ctx, user, id);
        case 'admin_unban': return this.handleAdminUnban(ctx, user, id);
        case 'admin_premium': return this.handleAdminPremium(ctx, user, id);
        case 'admin_vip': return this.handleAdminVip(ctx, user, id);
        case 'complaint': return this.handleComplaint(ctx, user, id);
        case 'hidden_mode': return this.handleHiddenMode(ctx, user);
        case 'boost': return this.handleBoost(ctx, user);
        case 'buy_premium': return this.handleBuyPremium(ctx, user);
        case 'buy_vip': return this.handleBuyVip(ctx, user);
        case 'edit_name': return this.handleEditName(ctx, user);
        case 'edit_bio': return this.handleEditBio(ctx, user);
        case 'edit_gender': return this.handleEditGender(ctx, user);
        case 'set_gender': return this.handleSetGender(ctx, user, id);
        case 'edit_country': return this.handleEditCountry(ctx, user);
        case 'tasbih_count': return this.handleTasbihCount(ctx, user);
        case 'tasbih_reset': return this.handleTasbihReset(ctx, user);
        case 'find_match': return this.handleFindMatch(ctx, user);
        case 'like': return this.handleLike(ctx, user, id);
        case 'admin_setting_coins': return this.handleAdminSettingCoins(ctx, user);
        case 'admin_setting_referral': return this.handleAdminSettingReferral(ctx, user);
        case 'admin_setting_premium': return this.handleAdminSettingPremium(ctx, user);
        case 'admin_setting_notifications': return this.handleAdminSettingNotifications(ctx, user);
        default: break;
      }
    });
  }

  // === USER FEATURES ===

  private async handleCourses(ctx: Context, user: any) {
    const courses = await this.prisma.course.findMany({ where: { tenantId: user.tenantId, isPublished: true } });
    if (!courses.length) return ctx.reply('📚 Курсы пока отсутствуют.', this.getBackButton('start') as any);
    const buttons = courses.map(c => [{ text: c.title, callback_data: `course:${c.id}` }]);
    buttons.push([{ text: '🔙 Назад', callback_data: 'start' }]);
    return ctx.reply('📚 Доступные курсы:', { reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleCourseDetail(ctx: Context, user: any, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, include: { modules: { include: { lessons: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } } });
    if (!course) return ctx.reply('Курс не найден');
    let text = `📚 **${course.title}**\n\n${course.description || ''}\n\n`;
    const buttons: any[][] = [];
    for (const mod of course.modules) {
      text += `**${mod.title}**\n`;
      for (const l of mod.lessons) {
        text += `  ${l.isFree ? '🆓' : '🔒'} ${l.title}\n`;
        if (l.isFree) buttons.push([{ text: `📖 ${l.title}`, callback_data: `lesson:${l.id}` }]);
      }
      text += '\n';
    }
    buttons.push([{ text: '🔙 Назад к курсам', callback_data: 'courses' }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleLesson(ctx: Context, user: any, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId }, include: { module: { include: { course: true } }, tests: { include: { questions: true } } } });
    if (!lesson) return ctx.reply('Урок не найден');
    let text = `📖 **${lesson.title}**\n\n${lesson.content || 'Содержимое урока скоро будет добавлено.'}\n`;
    const buttons: any[][] = [];
    if (lesson.tests.length > 0) {
      text += `\n📝 Тест: ${lesson.tests[0].title} (${lesson.tests[0].questions.length} вопросов)`;
      buttons.push([{ text: '📝 Пройти тест', callback_data: `test:${lesson.tests[0].id}` }]);
    }
    buttons.push([{ text: '🔙 Назад к курсу', callback_data: `course:${lesson.module.courseId}` }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleTest(ctx: Context, user: any, testId: string) {
    const test = await this.prisma.test.findUnique({ where: { id: testId }, include: { questions: true } });
    if (!test || !test.questions.length) return ctx.reply('Тест не найден');
    const q = test.questions[0];
    const options = JSON.parse(q.options || '[]');
    let text = `📝 **${test.title}**\n\nВопрос 1/${test.questions.length}:\n${q.question}\n`;
    const buttons = options.map((opt: string, i: number) => [{ text: opt, callback_data: `answer:${testId}:0:${i}` }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleAnswer(ctx: Context, user: any, testId: string, answerIdx: string) {
    ctx.reply('✅ Ответ принят! (Демо режим)');
  }

  private async handleMembership(ctx: Context, user: any) {
    const plans = await this.prisma.membership.findMany({ where: { tenantId: user.tenantId, isActive: true }, orderBy: { sortOrder: 'asc' } });
    if (!plans.length) return ctx.reply('Тарифы пока отсутствуют.', this.getBackButton('start') as any);
    let text = '💳 **Тарифные планы**\n\n';
    const buttons: any[][] = [];
    for (const p of plans) {
      const features = JSON.parse(p.features || '[]');
      const starsPrice = Math.ceil(p.price);
      text += `**${p.name}** — ${starsPrice} ⭐\n${features.map((f: string) => `  • ${f}`).join('\n')}\n\n`;
      buttons.push([{ text: `⭐ Купить ${p.name} — ${starsPrice} ⭐`, callback_data: `buy:${p.id}` }]);
    }
    buttons.push([{ text: '🔙 Назад', callback_data: 'start' }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleBuy(ctx: Context, user: any, planId: string) {
    const plan = await this.prisma.membership.findUnique({ where: { id: planId } });
    if (!plan) return ctx.reply('План не найден');
    const starsPrice = Math.ceil(plan.price);
    const features = JSON.parse(plan.features || '[]');
    await ctx.replyWithInvoice({
      currency: 'XTR', title: `Подписка: ${plan.name}`,
      description: `${plan.description || plan.name}\n\n${features.join(', ')}`,
      payload: JSON.stringify({ userId: user.id, membershipId: plan.id, tenantId: user.tenantId }),
      provider_token: '', prices: [{ label: plan.name, amount: starsPrice }],
    } as any);
  }

  private async handleProgress(ctx: Context, user: any) {
    const progress = await this.prisma.courseProgress.findMany({ where: { userId: user.id }, include: { course: true } });
    if (!progress.length) return ctx.reply('📊 Вы ещё не начали ни одного курса.\nИспользуйте /courses', this.getBackButton('start') as any);
    let text = '📊 **Ваш прогресс**\n\n';
    for (const p of progress) {
      const bar = '█'.repeat(Math.floor(p.progress / 10)) + '░'.repeat(10 - Math.floor(p.progress / 10));
      text += `**${p.course.title}**\n${bar} ${p.progress.toFixed(0)}%\n\n`;
    }
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'start' }]] } } as any);
  }

  private async handleCoins(ctx: Context, user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkin = await this.prisma.dailyCheckin.findFirst({ where: { userId: user.id, date: { gte: today } } });
    const transactions = await this.prisma.coinTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 });
    let text = `💰 **Монеты: ${user.coins}**\n\n`;
    text += checkin ? '✅ Сегодня уже отмечено\n' : '❌ Ещё не отмечено сегодня\n';
    if (transactions.length) {
      text += '\n📋 Последние операции:\n';
      for (const t of transactions) text += `  ${t.amount > 0 ? '+' : ''}${t.amount} — ${t.reason}\n`;
    }
    const buttons: any[][] = [];
    if (!checkin) buttons.push([{ text: '📅 Ежедневный вход', callback_data: 'checkin' }]);
    buttons.push([{ text: '🔙 Назад', callback_data: 'start' }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleCheckin(ctx: Context, user: any) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await this.prisma.dailyCheckin.findFirst({ where: { userId: user.id, date: { gte: today } } });
    if (existing) return ctx.reply('✅ Вы уже отметились сегодня!');

    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastCheckin = await this.prisma.dailyCheckin.findFirst({ where: { userId: user.id, date: { gte: yesterday, lt: today } } });
    const streak = lastCheckin ? lastCheckin.streak + 1 : 1;
    const reward = COINS_DAILY + (streak > 1 ? streak * COINS_CHECKIN_STREAK_BONUS : 0);

    await this.prisma.dailyCheckin.create({ data: { userId: user.id, date: today, streak, reward } });
    await this.prisma.user.update({ where: { id: user.id }, data: { coins: { increment: reward } } });
    await this.prisma.coinTransaction.create({ data: { userId: user.id, amount: reward, type: 'CHECKIN', reason: `Ежедневный вход (серия ${streak} дн.)` } });
    await this.checkAndAwardAchievements(user.id);
    return ctx.reply(
      `📅 Ежедневный вход!\n\n` +
      `🔥 Серия: ${streak} дн.\n` +
      `💰 Получено: +${reward} монет\n` +
      `💰 Баланс: ${user.coins + reward}`,
      this.getBackButton('coins') as any,
    );
  }

  private async handleAchievements(ctx: Context, user: any) {
    const achievements = await this.prisma.achievement.findMany();
    const userAchievements = await this.prisma.userAchievement.findMany({ where: { userId: user.id } });
    const unlocked = new Set(userAchievements.map(ua => ua.achievementId));

    let text = '🎯 **Достижения**\n\n';
    for (const a of achievements) {
      const done = unlocked.has(a.id);
      text += `${done ? '✅' : '⬜'} ${a.icon} ${a.name}\n   ${a.description}${a.reward ? ` (+${a.reward} монет)` : ''}\n\n`;
    }
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'start' }]] } } as any);
  }

  private async handleIslamic(ctx: Context, user: any) {
    return ctx.reply(
      '☪️ **Исламские функции**\n\nВыберите:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '🕌 Время намаза', callback_data: 'prayer' }, { text: '📿 Азкары', callback_data: 'azkar' }],
        [{ text: '🔢 Тасбих', callback_data: 'tasbih' }, { text: '🧭 Кибла', callback_data: 'qibla' }],
        [{ text: '🔙 Назад', callback_data: 'start' }],
      ] } } as any,
    );
  }

  private async handlePrayer(ctx: Context, user: any) {
    const prayers = ['Фаджр — рассвет', 'Зухр — полдень', 'Аср — после полудня', 'Магриб — закат', 'Иша — ночь'];
    let text = '🕌 **Время намаза**\n\n';
    text += prayers.map(p => `  • ${p}`).join('\n');
    text += '\n\n_Точное время зависит от вашего расположения_';
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'islamic' }]] } } as any);
  }

  private async handleAzkar(ctx: Context, user: any) {
    const azkar = [
      'سُبْحَانَ اللَّهِ — СубханАллах (Пречист Аллах)',
      'الْحَمْدُ لِلَّهِ — Альхамдулиллях (Хвала Аллаху)',
      'اللَّهُ أَكْبَرُ — Аллаху Акбар (Аллах Велик)',
      'لَا إِلَهَ إِلَّا اللَّهُ — Ля иляха илляЛлах (Нет божества кроме Аллаха)',
    ];
    let text = '📿 **Утренние азкары**\n\n';
    text += azkar.map(a => `  • ${a}`).join('\n\n');
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'islamic' }]] } } as any);
  }

  private async handleTasbih(ctx: Context, user: any) {
    return ctx.reply(
      '🔢 **Счетчик тасбиха**\n\nНажмите кнопку для подсчета:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '0', callback_data: 'tasbih_count' }, { text: '🔄', callback_data: 'tasbih_reset' }],
        [{ text: '🔙 Назад', callback_data: 'islamic' }],
      ] } } as any,
    );
  }

  private async handleQibla(ctx: Context, user: any) {
    return ctx.reply(
      '🧭 **Направление Кибла**\n\nКибла — направление на Мекку (Каабу).\n\nДля точного определения используйте компас вашего телефона или приложение.',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'islamic' }]] } } as any,
    );
  }

  private async handleReferral(ctx: Context, user: any) {
    const refCount = await this.prisma.referral.count({ where: { referrerId: user.id } });
    const link = `https://t.me/${this.bot.botInfo?.username}?start=${user.referralCode}`;
    return ctx.reply(
      `🔗 **Реферальная программа**\n\n` +
      `Ваша ссылка:\n${link}\n\n` +
      `👥 Приглашено: ${refCount}\n` +
      `💰 Награда: ${COINS_REFERRAL} монет за друга\n`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'start' }]] } } as any,
    );
  }

  private async handleProfile(ctx: Context, user: any) {
    const memberCount = user.isPremium ? '⭐ Premium' : user.isVIP ? '👑 VIP' : 'Обычный';
    let text = `👤 **Ваш профиль**\n\n`;
    text += `Имя: ${user.firstName} ${user.lastName || ''}\n`;
    text += `Username: ${user.telegramUsername ? '@' + user.telegramUsername : '—'}\n`;
    text += `Статус: ${memberCount}\n`;
    text += `Роль: ${user.role}\n`;
    text += `Монеты: ${user.coins}\n`;
    text += `Скрытый режим: ${user.isHidden ? 'Да' : 'Нет'}\n`;
    if (user.gender) text += `Пол: ${user.gender === 'MALE' ? 'Мужской' : 'Женский'}\n`;
    if (user.country) text += `Страна: ${user.country}\n`;
    if (user.bio) text += `О себе: ${user.bio}\n`;
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
      [{ text: '✏️ Редактировать', callback_data: 'profile_edit' }],
      [{ text: '🔙 Назад', callback_data: 'start' }],
    ] } } as any);
  }

  private async handleProfileEdit(ctx: Context, user: any) {
    return ctx.reply(
      '✏️ **Редактирование профиля**\n\nВыберите:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '👤 Имя', callback_data: 'edit_name' }, { text: '📝 О себе', callback_data: 'edit_bio' }],
        [{ text: '⚧ Пол', callback_data: 'edit_gender' }, { text: '🌍 Страна', callback_data: 'edit_country' }],
        [{ text: '🔙 Назад', callback_data: 'profile' }],
      ] } } as any,
    );
  }

  private async handleHiddenMode(ctx: Context, user: any) {
    const newHidden = !user.isHidden;
    await this.prisma.user.update({ where: { id: user.id }, data: { isHidden: newHidden } });
    return ctx.reply(
      newHidden ? '🌙 Скрытый режим включён. Вы не отображаются в поиске.' : '☀️ Скрытый режим выключен. Вы снова видимы.',
      this.getBackButton('start') as any,
    );
  }

  private async handleBoost(ctx: Context, user: any) {
    if (user.coins < 20) return ctx.reply('❌ Недостаточно монет. Нужно 20.', this.getBackButton('coins') as any);
    await this.prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: 20 } } });
    await this.prisma.coinTransaction.create({ data: { userId: user.id, amount: -20, type: 'BOOST', reason: 'Поднятие анкеты' } });
    return ctx.reply('🚀 Анкета поднята! Вы будете в верху поиска 24 часа.', this.getBackButton('start') as any);
  }

  private async handleBuyPremium(ctx: Context, user: any) {
    if (user.coins < 500) return ctx.reply('❌ Недостаточно монет. Нужно 500.', this.getBackButton('coins') as any);
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    await this.prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: 500 }, isPremium: true, premiumExpiresAt: expires } });
    await this.prisma.coinTransaction.create({ data: { userId: user.id, amount: -500, type: 'PREMIUM', reason: 'Покупка Premium (30 дн.)' } });
    return ctx.reply('⭐ Premium активирован на 30 дней!', this.getBackButton('start') as any);
  }

  private async handleBuyVip(ctx: Context, user: any) {
    if (user.coins < 1500) return ctx.reply('❌ Недостаточно монет. Нужно 1500.', this.getBackButton('coins') as any);
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    await this.prisma.user.update({ where: { id: user.id }, data: { coins: { decrement: 1500 }, isVIP: true, vipExpiresAt: expires, isPremium: true } });
    await this.prisma.coinTransaction.create({ data: { userId: user.id, amount: -1500, type: 'VIP', reason: 'Покупка VIP (30 дн.)' } });
    return ctx.reply('👑 VIP активирован на 30 дней! Все функции Premium включены.', this.getBackButton('start') as any);
  }

  private async handleComplaint(ctx: Context, user: any, targetId: string) {
    await this.prisma.complaint.create({ data: { aboutId: targetId, byId: user.id, reason: 'Жалоба из профиля' } });
    return ctx.reply('📩 Жалоба отправлена. Модератор рассмотрит её.', this.getBackButton('start') as any);
  }

  // === 1. PROFILE EDITING ===
  private async handleEditName(ctx: Context, user: any) {
    await ctx.reply('Введите новое имя:', { reply_markup: { inline_keyboard: [[{ text: '🔙 Отмена', callback_data: 'profile_edit' }]] } } as any);
    this.bot.on('text', async (ctx2) => {
      await this.prisma.user.update({ where: { id: user.id }, data: { firstName: ctx2.message.text } });
      await ctx2.reply(`✅ Имя изменено на: ${ctx2.message.text}`, this.getBackButton('profile') as any);
    });
  }

  private async handleEditBio(ctx: Context, user: any) {
    await ctx.reply('Введите описание о себе:', { reply_markup: { inline_keyboard: [[{ text: '🔙 Отмена', callback_data: 'profile_edit' }]] } } as any);
    this.bot.on('text', async (ctx2) => {
      await this.prisma.user.update({ where: { id: user.id }, data: { bio: ctx2.message.text } });
      await ctx2.reply('✅ Описание обновлено', this.getBackButton('profile') as any);
    });
  }

  private async handleEditGender(ctx: Context, user: any) {
    return ctx.reply('Выберите пол:', { reply_markup: { inline_keyboard: [
      [{ text: '👨 Мужской', callback_data: 'set_gender:MALE' }, { text: '👩 Женский', callback_data: 'set_gender:FEMALE' }],
      [{ text: '🔙 Отмена', callback_data: 'profile_edit' }],
    ] } } as any);
  }

  private async handleSetGender(ctx: Context, user: any, gender: string) {
    await this.prisma.user.update({ where: { id: user.id }, data: { gender } });
    return ctx.reply(`✅ Пол изменён: ${gender === 'MALE' ? 'Мужской' : 'Женский'}`, this.getBackButton('profile') as any);
  }

  private async handleEditCountry(ctx: Context, user: any) {
    await ctx.reply('Введите страну:', { reply_markup: { inline_keyboard: [[{ text: '🔙 Отмена', callback_data: 'profile_edit' }]] } } as any);
    this.bot.on('text', async (ctx2) => {
      await this.prisma.user.update({ where: { id: user.id }, data: { country: ctx2.message.text } });
      await ctx2.reply(`✅ Страна изменена: ${ctx2.message.text}`, this.getBackButton('profile') as any);
    });
  }

  // === 2. TASBIH COUNTER ===
  private tasbihCounts = new Map<number, number>();

  private async handleTasbihCount(ctx: Context, user: any) {
    const chatId = ctx.chat?.id || 0;
    const count = (this.tasbihCounts.get(chatId) || 0) + 1;
    this.tasbihCounts.set(chatId, count);
    return ctx.reply(
      `📿 **Тасбих: ${count}**\n\nСубханАллах: ${count % 33}/33`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: `📿 ${count + 1}`, callback_data: 'tasbih_count' }],
        [{ text: '🔄 Сброс', callback_data: 'tasbih_reset' }],
        [{ text: '🔙 Назад', callback_data: 'islamic' }],
      ] } } as any,
    );
  }

  private async handleTasbihReset(ctx: Context, user: any) {
    const chatId = ctx.chat?.id || 0;
    const count = this.tasbihCounts.get(chatId) || 0;
    this.tasbihCounts.set(chatId, 0);
    if (count >= 100) {
      await this.prisma.user.update({ where: { id: user.id }, data: { coins: { increment: 5 } } });
      await this.prisma.coinTransaction.create({ data: { userId: user.id, amount: 5, type: 'TASBIH', reason: '100+ тасбихов' } });
      return ctx.reply(`📿 Сброшено! ${count} тасбихов. +5 монет!`, this.getBackButton('islamic') as any);
    }
    return ctx.reply(`📿 Сброшено! ${count} тасбихов.`, this.getBackButton('islamic') as any);
  }

  // === 3. BROADCAST SENDING ===
  private async handleBroadcastSend(ctx: Context, admin: any, audience: string, text: string) {
    const where: any = { tenantId: admin.tenantId, status: 'ACTIVE', telegramId: { not: null } };
    if (audience === 'male') where.gender = 'MALE';
    else if (audience === 'female') where.gender = 'FEMALE';
    else if (audience === 'premium') where.isPremium = true;
    const users = await this.prisma.user.findMany({ where });
    let sent = 0, failed = 0;
    for (const u of users) {
      try { await this.bot.telegram.sendMessage(parseInt(u.telegramId), text); sent++; } catch { failed++; }
    }
    await this.prisma.adminAction.create({ data: { adminId: admin.id, action: 'BROADCAST', details: `${audience}: ${sent} ok, ${failed} err` } });
    return ctx.reply(`📢 Рассылка!\n✅ ${sent}\n❌ ${failed}`, this.getBackButton('admin') as any);
  }

  // === 4. ACHIEVEMENT CHECK ===
  private async checkAndAwardAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const existing = await this.prisma.userAchievement.findMany({ where: { userId } });
    const unlocked = new Set(existing.map(e => e.achievementId));
    const checks = [
      { name: 'Первое знакомство', check: () => true },
      { name: 'Заполнил анкету', check: () => !!(user.bio && user.gender && user.country) },
      { name: 'Premium пользователь', check: () => user.isPremium },
      { name: 'VIP пользователь', check: () => user.isVIP },
    ];
    for (const ch of checks) {
      const ach = await this.prisma.achievement.findFirst({ where: { name: ch.name } });
      if (!ach || unlocked.has(ach.id)) continue;
      if (ch.check()) {
        await this.prisma.userAchievement.create({ data: { userId, achievementId: ach.id } });
        if (ach.reward > 0) {
          await this.prisma.user.update({ where: { id: userId }, data: { coins: { increment: ach.reward } } });
          await this.prisma.coinTransaction.create({ data: { userId, amount: ach.reward, type: 'ACHIEVEMENT', reason: ach.name } });
        }
        if (user.telegramId) {
          await this.bot.telegram.sendMessage(parseInt(user.telegramId), `🎯 Достижение: ${ach.icon} ${ach.name}${ach.reward ? ` +${ach.reward} 💰` : ''}`).catch(() => {});
        }
      }
    }
  }

  // === 5. DATING FEATURES ===
  private async handleFindMatch(ctx: Context, user: any) {
    if (!user.gender) return ctx.reply('❌ Заполните профиль (пол)', this.getBackButton('profile') as any);
    const oppositeGender = user.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const match = await this.prisma.user.findFirst({
      where: { tenantId: user.tenantId, gender: oppositeGender, status: 'ACTIVE', isHidden: false, id: { not: user.id } },
      orderBy: { lastActiveAt: 'desc' },
    });
    if (!match) return ctx.reply('😔 Нет анкет', this.getBackButton('start') as any);
    let text = `👤 **${match.firstName}**\n`;
    if (match.age) text += `Возраст: ${match.age}\n`;
    if (match.country) text += `Страна: ${match.country}\n`;
    if (match.bio) text += `${match.bio}\n`;
    if (match.isPremium) text += `⭐ Premium\n`;
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
      [{ text: '❤️ Нравится', callback_data: `like:${match.id}` }, { text: '👎 Далее', callback_data: 'find_match' }],
      [{ text: '📩 Жалоба', callback_data: `complaint:${match.id}` }],
      [{ text: '🔙 Назад', callback_data: 'start' }],
    ] } } as any);
  }

  private async handleLike(ctx: Context, user: any, targetId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return ctx.reply('Не найден');
    await this.prisma.savedItem.create({ data: { userId: user.id, type: 'LIKE', itemId: targetId } }).catch(() => {});
    const mutual = await this.prisma.savedItem.findFirst({ where: { userId: targetId, type: 'LIKE', itemId: user.id } });
    if (mutual) {
      if (user.telegramId) await this.bot.telegram.sendMessage(parseInt(user.telegramId), `🎉 Взаимная симпатия с ${target.firstName}!`).catch(() => {});
      if (target.telegramId) await this.bot.telegram.sendMessage(parseInt(target.telegramId), `🎉 Взаимная симпатия с ${user.firstName}!`).catch(() => {});
    }
    return this.handleFindMatch(ctx, user);
  }

  // === 6. ADMIN SETTINGS ===
  private async handleAdminSettingCoins(ctx: Context, admin: any) {
    if (!this.isOwner(admin.role)) return ctx.reply('Только владелец');
    const s = await this.prisma.botSettings.findMany();
    let text = '💰 **Настройки монет**\n\n';
    for (const x of s) text += `• ${x.key}: ${x.value}\n`;
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙', callback_data: 'admin_settings' }]] } } as any);
  }

  private async handleAdminSettingReferral(ctx: Context, admin: any) {
    if (!this.isOwner(admin.role)) return ctx.reply('Только владелец');
    return ctx.reply('🔗 **Рефералы**\n\nНаграда: 50 монет\nБонус: +5/день', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙', callback_data: 'admin_settings' }]] } } as any);
  }

  private async handleAdminSettingPremium(ctx: Context, admin: any) {
    if (!this.isOwner(admin.role)) return ctx.reply('Только владелец');
    return ctx.reply('⭐ **Premium**\n\nЦена: 500 монет/30д\nVIP: 1500 монет/30д', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙', callback_data: 'admin_settings' }]] } } as any);
  }

  private async handleAdminSettingNotifications(ctx: Context, admin: any) {
    if (!this.isOwner(admin.role)) return ctx.reply('Только владелец');
    return ctx.reply('🔔 **Уведомления**\n\n• Новые пользователи: ✅\n• Оплата: ✅\n• Жалобы: ✅', { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙', callback_data: 'admin_settings' }]] } } as any);
  }

  // === ADMIN PANEL ===

  private async showAdminPanel(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    return ctx.reply(
      '👑 **Админ-панель**\n\nВыберите раздел:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '📊 Статистика', callback_data: 'admin_stats' }, { text: '👥 Пользователи', callback_data: 'admin_users' }],
        [{ text: '📢 Рассылка', callback_data: 'admin_broadcast' }, { text: '📩 Жалобы', callback_data: 'admin_complaints' }],
        [{ text: '📜 Логи', callback_data: 'admin_logs' }, { text: '⚙ Настройки', callback_data: 'admin_settings' }],
        [{ text: '🔙 Назад', callback_data: 'start' }],
      ] } } as any,
    );
  }

  private async handleAdminStats(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    const total = await this.prisma.user.count({ where: { tenantId: user.tenantId } });
    const dayAgo = new Date(Date.now() - 86400000);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const activeDay = await this.prisma.user.count({ where: { tenantId: user.tenantId, lastActiveAt: { gte: dayAgo } } });
    const activeWeek = await this.prisma.user.count({ where: { tenantId: user.tenantId, lastActiveAt: { gte: weekAgo } } });
    const premium = await this.prisma.user.count({ where: { tenantId: user.tenantId, isPremium: true } });
    const vip = await this.prisma.user.count({ where: { tenantId: user.tenantId, isVIP: true } });
    const male = await this.prisma.user.count({ where: { tenantId: user.tenantId, gender: 'MALE' } });
    const female = await this.prisma.user.count({ where: { tenantId: user.tenantId, gender: 'FEMALE' } });
    const banned = await this.prisma.user.count({ where: { tenantId: user.tenantId, status: 'BANNED' } });
    const complaints = await this.prisma.complaint.count({ where: { status: 'PENDING' } });

    return ctx.reply(
      `📊 **Статистика**\n\n` +
      `👥 Всего: ${total}\n` +
      `🟢 Активных (24ч): ${activeDay}\n` +
      `🟢 Активных (7д): ${activeWeek}\n` +
      `👨 Мужчин: ${male}\n` +
      `👩 Женщин: ${female}\n` +
      `⭐ Premium: ${premium}\n` +
      `👑 VIP: ${vip}\n` +
      `🚫 Заблокировано: ${banned}\n` +
      `📩 Жалоб: ${complaints}\n`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin' }]] } } as any,
    );
  }

  private async handleAdminUsers(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    const users = await this.prisma.user.findMany({ where: { tenantId: user.tenantId }, orderBy: { createdAt: 'desc' }, take: 10 });
    let text = '👥 **Пользователи** (последние 10)\n\n';
    const buttons: any[][] = [];
    for (const u of users) {
      const status = u.status === 'BANNED' ? '🚫' : u.isVIP ? '👑' : u.isPremium ? '⭐' : '👤';
      text += `${status} ${u.firstName} ${u.lastName || ''} (${u.role})\n`;
      buttons.push([{ text: `${u.firstName}`, callback_data: `admin_user_action:${u.id}` }]);
    }
    buttons.push([{ text: '🔙 Назад', callback_data: 'admin' }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleAdminUserAction(ctx: Context, admin: any, targetId: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return ctx.reply('Пользователь не найден');
    const status = target.status === 'BANNED' ? '🚫 Заблокирован' : target.isVIP ? '👑 VIP' : target.isPremium ? '⭐ Premium' : '👤 Обычный';
    return ctx.reply(
      `👤 **${target.firstName} ${target.lastName || ''}**\n\n` +
      `Статус: ${status}\n` +
      `Роль: ${target.role}\n` +
      `Монеты: ${target.coins}\n` +
      `Telegram: ${target.telegramUsername ? '@' + target.telegramUsername : '—'}\n`,
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        target.status === 'BANNED'
          ? [{ text: '✅ Разблокировать', callback_data: `admin_unban:${targetId}` }]
          : [{ text: '🚫 Заблокировать', callback_data: `admin_ban:${targetId}` }],
        [{ text: '⭐ Выдать Premium', callback_data: `admin_premium:${targetId}` }, { text: '👑 Выдать VIP', callback_data: `admin_vip:${targetId}` }],
        [{ text: '🔙 Назад', callback_data: 'admin_users' }],
      ] } } as any,
    );
  }

  private async handleAdminBan(ctx: Context, admin: any, targetId: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    await this.prisma.user.update({ where: { id: targetId }, data: { status: 'BANNED', isActive: false } });
    await this.prisma.adminAction.create({ data: { adminId: admin.id, action: 'BAN', targetId, details: `Заблокирован пользователь ${targetId}` } });
    return ctx.reply('🚫 Пользователь заблокирован.', this.getBackButton('admin_users') as any);
  }

  private async handleAdminUnban(ctx: Context, admin: any, targetId: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    await this.prisma.user.update({ where: { id: targetId }, data: { status: 'ACTIVE', isActive: true } });
    await this.prisma.adminAction.create({ data: { adminId: admin.id, action: 'UNBAN', targetId, details: `Разблокирован пользователь ${targetId}` } });
    return ctx.reply('✅ Пользователь разблокирован.', this.getBackButton('admin_users') as any);
  }

  private async handleAdminPremium(ctx: Context, admin: any, targetId: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    await this.prisma.user.update({ where: { id: targetId }, data: { isPremium: true, premiumExpiresAt: expires } });
    await this.prisma.adminAction.create({ data: { adminId: admin.id, action: 'GIVE_PREMIUM', targetId } });
    return ctx.reply('⭐ Premium выдан.', this.getBackButton('admin_users') as any);
  }

  private async handleAdminVip(ctx: Context, admin: any, targetId: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    const expires = new Date(); expires.setDate(expires.getDate() + 30);
    await this.prisma.user.update({ where: { id: targetId }, data: { isVIP: true, vipExpiresAt: expires, isPremium: true } });
    await this.prisma.adminAction.create({ data: { adminId: admin.id, action: 'GIVE_VIP', targetId } });
    return ctx.reply('👑 VIP выдан.', this.getBackButton('admin_users') as any);
  }

  private async handleAdminBroadcast(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    return ctx.reply(
      '📢 **Рассылка**\n\nВыберите аудиторию:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '👥 Всем', callback_data: 'admin_broadcast_target:all' }, { text: '👨 Мужчинам', callback_data: 'admin_broadcast_target:male' }],
        [{ text: '👩 Женщинам', callback_data: 'admin_broadcast_target:female' }, { text: '⭐ Premium', callback_data: 'admin_broadcast_target:premium' }],
        [{ text: '🔙 Назад', callback_data: 'admin' }],
      ] } } as any,
    );
  }

  private async handleAdminBroadcastTarget(ctx: Context, admin: any, target: string) {
    if (!this.isAdmin(admin.role)) return ctx.reply('Нет доступа.');
    const where: any = { tenantId: admin.tenantId, status: 'ACTIVE' };
    if (target === 'male') where.gender = 'MALE';
    else if (target === 'female') where.gender = 'FEMALE';
    else if (target === 'premium') where.isPremium = true;
    const count = await this.prisma.user.count({ where });
    await ctx.reply(`📢 Аудитория: ${count} чел.\n\nОтправьте текст рассылки:`, { reply_markup: { inline_keyboard: [[{ text: '🔙 Отмена', callback_data: 'admin' }]] } } as any);
    this.bot.on('text', async (ctx2) => {
      if (ctx2.message.text === '🔙 Отмена') return;
      await this.handleBroadcastSend(ctx2, admin, target, ctx2.message.text);
    });
  }

  private async handleAdminComplaints(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    const complaints = await this.prisma.complaint.findMany({ where: { status: 'PENDING' }, include: { about: true, by: true }, orderBy: { createdAt: 'desc' }, take: 10 });
    if (!complaints.length) return ctx.reply('📩 Жалоб нет.', this.getBackButton('admin') as any);
    let text = '📩 **Жалобы**\n\n';
    const buttons: any[][] = [];
    for (const c of complaints) {
      text += `• На: ${c.about.firstName} — ${c.reason}\n`;
      buttons.push([{ text: `Рассмотреть: ${c.about.firstName}`, callback_data: `admin_complaint_action:${c.id}` }]);
    }
    buttons.push([{ text: '🔙 Назад', callback_data: 'admin' }]);
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } } as any);
  }

  private async handleAdminLogs(ctx: Context, user: any) {
    if (!this.isAdmin(user.role)) return ctx.reply('Нет доступа.');
    const logs = await this.prisma.adminAction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    let text = '📜 **Действия администраторов**\n\n';
    for (const l of logs) text += `• ${l.action} — ${l.details || l.targetId || '—'}\n`;
    return ctx.reply(text, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'admin' }]] } } as any);
  }

  private async handleAdminSettings(ctx: Context, user: any) {
    if (!this.isOwner(user.role)) return ctx.reply('Только владелец может менять настройки.');
    return ctx.reply(
      '⚙ **Настройки**\n\nВыберите:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [
        [{ text: '💰 Монеты', callback_data: 'admin_setting_coins' }, { text: '🔗 Рефералы', callback_data: 'admin_setting_referral' }],
        [{ text: '⭐ Premium', callback_data: 'admin_setting_premium' }, { text: '🔔 Уведомления', callback_data: 'admin_setting_notifications' }],
        [{ text: '🔙 Назад', callback_data: 'admin' }],
      ] } } as any,
    );
  }

  // === PAYMENTS ===

  private setupPayments() {
    this.bot.on('pre_checkout_query', async (ctx) => {
      await ctx.answerPreCheckoutQuery(true);
    });

    this.bot.on('successful_payment', async (ctx) => {
      const payment = (ctx.message as any).successful_payment;
      const tid = ctx.from.id.toString();
      this.logger.log(`Payment succeeded: ${payment.telegram_payment_charge_id} from ${tid}`);
      try {
        const payload = JSON.parse(payment.invoice_payload);
        const { userId, membershipId, tenantId } = payload;
        const purchase = await this.paymentService.createPurchase(userId, membershipId, 'telegram_stars');
        await this.paymentService.processPayment(purchase.id, payment.telegram_payment_charge_id);
        await this.grantChannelAccess(userId, tenantId);
        const plan = await this.prisma.membership.findUnique({ where: { id: membershipId } });
        await ctx.reply(
          `✅ Оплата прошла успешно!\n\n📦 Тариф: **${plan?.name}**\n💰 Сумма: ${payment.total_amount} ⭐\n\nДобро пожаловать! /courses`,
          { parse_mode: 'Markdown' },
        );
      } catch (err) {
        this.logger.error(`Payment error: ${err.message}`);
        await ctx.reply('⚠️ Оплата прошла, но произошла ошибка при активации. Обратитесь в поддержку.');
      }
    });
  }

  private async grantChannelAccess(userId: string, tenantId: string) {
    const channels = await this.prisma.channel.findMany({ where: { tenantId } });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.telegramId) return;
    for (const channel of channels) {
      try {
        await this.bot.telegram.unbanChatMember(channel.telegramId, parseInt(user.telegramId));
      } catch (err) {
        this.logger.warn(`Could not grant access to ${channel.title}: ${err.message}`);
      }
    }
  }

  private async getUser(ctx: Context) {
    const tid = ctx.from?.id?.toString();
    if (!tid) return null;
    const user = await this.prisma.user.findFirst({ where: { telegramId: tid } });
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date(), isOnline: true } }).catch(() => {});
    }
    return user;
  }

  async handleWebhook(update: any) { if (this.bot) await this.bot.handleUpdate(update); }
  async sendMessage(chatId: number, text: string, options?: any) { return this.bot?.telegram.sendMessage(chatId, text, options); }
}
