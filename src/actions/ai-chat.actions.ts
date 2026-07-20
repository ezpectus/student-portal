'use server';

import { z } from 'zod';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StudentContext {
  gpa: number;
  courses: { name: string; grade: number }[];
  attendance: { present: number; total: number };
}

const STUDY_TIPS: Record<string, string> = {
  exam: 'Підготовка до іспиту: складіть план повторення за 7 днів до дати. Розбий матеріал на теми, повторюй по 2-3 теми за день. Використовуй метод інтервального повторення (flashcards).',
  grade: 'Щоб покращити оцінки: проаналізуй, де втратила найбільше балів. Попроси детальний розбір у викладача. Зосередься на слабких темах.',
  deadline: 'Дедлайни: використовуй метод Помодоро (25 хв роботи + 5 хв перерва). Починай з найскладнішого завдання. Розбий велике завдання на підзадачі.',
  stress: 'Стрес перед іспитом: нормальний фізіологічний стан. Спи 7-8 годин, не вчи в ніч перед іспитом. Зроби коротку прогулянку перед заліком.',
  motivation: 'Мотивація: згадай свою ціль — навіщо ти вчишся. Нагороджуй себе за кожну виконану задачу. Знайди напарника для спільного навчання.',
  attendance: 'Відвідуваність важлива: пропуски лекцій = прогалини в знаннях. Якщо пропустила — попроси конспект у однокурсників, переглянь матеріал самостійно.',
  gpa: 'Твій середній бал — це твій рейтинг. Щоб його підняти: фокусуйся на предметах, де найнижчі оцінки — там найбільший потенціал для росту.',
  course: 'По предмету: переглянь силабус, зрозумій структуру оцінювання. Активно беріть участь на семінарах — це дає додаткові бали.',
  project: 'Проєктна робота: почни з планування структури. Розбий на етапи: дослідження → прототип → реалізація → презентація. Не залишай на останню ніч.',
  presentation: 'Презентація: структуруй по принципу "проблема → рішення → результат". Тренуйся перед дзеркалом. Тайминг — 1 слайд на 1-2 хвилини.',
};

const DEFAULT_RESPONSE = 'Я можу допомогти з порадами щодо: підготовки до іспитів, покращення оцінок, тайм-менеджменту, дедлайнів, стресу, мотивації, відвідуваності, проєктних робіт та презентацій. Про що б ти хотів дізнатися?';

function findRelevantTip(message: string): string {
  const lower = message.toLowerCase();

  const keywords: Record<string, string[]> = {
    exam: ['іспит', 'залік', 'екзамен', 'exam', 'test', 'здача'],
    grade: ['оцінк', 'бал', 'grade', 'оценка', 'покращ', 'підвищ'],
    deadline: ['дедлайн', 'deadline', 'термін', 'здач', 'невиконан'],
    stress: ['стрес', 'тривог', 'нерв', 'паніка', 'stress', 'anxiety', 'боюсь'],
    motivation: ['мотивац', 'немає сил', 'втом', 'лінь', 'motivation', 'tired', 'не хочу'],
    attendance: ['пропуск', 'відвідув', 'не був', 'attendance', 'missed'],
    gpa: ['gpa', 'середній', 'рейтинг', 'средний'],
    course: ['предмет', 'курс', 'лекц', 'семінар', 'course', 'subject'],
    project: ['проєкт', 'проект', 'project', 'робота', 'дослідж'],
    presentation: ['презентац', 'виступ', 'доповідь', 'presentation', 'speech'],
  };

  for (const [key, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) {
      return STUDY_TIPS[key];
    }
  }

  return DEFAULT_RESPONSE;
}

async function getStudentContext(userId: number): Promise<StudentContext | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        gpa: true,
        courses: { select: { name: true, grade: true } },
        attendance: { select: { present: true, total: true } },
      },
    });

    if (!user) return null;

    return {
      gpa: user.gpa,
      courses: user.courses.map((c) => ({ name: c.name, grade: c.grade })),
      attendance: user.attendance.length > 0
        ? { present: user.attendance[0].present, total: user.attendance[0].total }
        : { present: 0, total: 0 },
    };
  } catch {
    return null;
  }
}

function buildContextualResponse(tip: string, ctx: StudentContext | null): string {
  if (!ctx) return tip;

  const parts: string[] = [tip];

  if (ctx.gpa > 0 && ctx.gpa < 60) {
    parts.push(`\n\n📊 Твій поточний середній бал: ${ctx.gpa.toFixed(1)}. Є куди рости — фокусуйся на предметах з найнижчими оцінками.`);
  } else if (ctx.gpa >= 80) {
    parts.push(`\n\n📊 Твій середній бал: ${ctx.gpa.toFixed(1)} — ти в топі! Продовжуй у тому ж дусі.`);
  }

  if (ctx.attendance.total > 0) {
    const rate = Math.round((ctx.attendance.present / ctx.attendance.total) * 100);
    if (rate < 70) {
      parts.push(`\n\n⚠️ Відвідуваність: ${rate}%. Це критично — пропуски прямо впливають на оцінки.`);
    }
  }

  return parts.join('');
}

const messageSchema = z.string().min(1).max(500);

export async function getAiChatResponse(message: string): Promise<string> {
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const validated = validateInput(messageSchema, message, 'getAiChatResponse');

  const tip = findRelevantTip(validated);
  const ctx = await getStudentContext(user.id);

  return buildContextualResponse(tip, ctx);
}
