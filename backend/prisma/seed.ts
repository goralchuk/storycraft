import 'dotenv/config';
import { PrismaClient, TemplateCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const topics = [
  { id: 'dark', icon: '🌙', label: 'Fear of the dark', prompts: ['A brave child discovers the dark is full of friendly glowing creatures', 'Nighttime becomes an adventure with a magical lantern', 'Stars come alive to keep watch over sleeping children'] },
  { id: 'alone', icon: '🏠', label: 'Fear of being alone', prompts: ['A child finds a tiny magical companion hidden in their room', 'The house itself whispers gentle secrets to keep them company', 'A friendly shadow becomes an unexpected best friend'] },
  { id: 'new', icon: '🏫', label: 'Starting something new', prompts: ['First day at a new school where everyone is nervous too', 'A new town turns out to hide the most amazing secret', 'Making the first friend is the hardest and best adventure'] },
  { id: 'thunder', icon: '⛈️', label: 'Fear of storms', prompts: ['Thunder is just giants bowling in the clouds above', 'A storm brings a magical visitor to the window', 'Rain and lightning are the sky putting on a show just for you'] },
  { id: 'monster', icon: '👾', label: 'Fear of monsters', prompts: ['The monster under the bed turns out to be the most timid creature ever', 'Monsters are just misunderstood creatures who need a friend', 'A child becomes the official Monster Tamer of their neighbourhood'] },
  { id: 'lose', icon: '💔', label: 'Fear of losing someone', prompts: ["Grandma's garden keeps growing even when she's far away", 'Love leaves traces everywhere in songs, smells and sunsets', 'A child learns that some things stay with us forever'] },
  { id: 'custom', icon: '✏️', label: 'Something else…', prompts: [] },
];

const ADMIN_EMAIL = 'goralchuk.r@gmail.com';

const priceItems = [
  { key: 'BOOK_UNIQUE', label: 'Unique book', category: 'BOOK', amount: 500 },
  { key: 'BOOK_TEMPLATE', label: 'Template book', category: 'BOOK', amount: 300 },
  { key: 'PAGE_16', label: '16 pages', category: 'PAGE', amount: 150 },
  { key: 'PAGE_20', label: '20 pages', category: 'PAGE', amount: 300 },
  { key: 'PAGE_24', label: '24 pages', category: 'PAGE', amount: 450 },
  { key: 'HERO_TOPUP', label: '3 more hero generations', category: 'HERO', amount: 100 },
  { key: 'COMPANION', label: 'Extra companion hero', category: 'HERO', amount: 100 },
  { key: 'PACK_300', label: '300 coins', category: 'PACK', amount: 300 },
  { key: 'PACK_800', label: '800 coins', category: 'PACK', amount: 800 },
  { key: 'PACK_2000', label: '2000 coins', category: 'PACK', amount: 2000 },
  { key: 'PACK_5000', label: '5000 coins', category: 'PACK', amount: 5000 },
];

const templates = [
  { id: 'tpl-enchanted-forest', title: 'The Enchanted Forest', icon: '🌳', category: TemplateCategory.FANTASY, description: 'A magical woodland adventure where courage grows like the trees.', ageRange: '3–7', availablePages: [12, 16, 20], pageCount: 16, defaultTone: 'whimsical and gentle', badge: 'Popular', coverColor: '#ede0ff', tags: [{ label: 'Magic', bg: '#ede0ff', color: '#7c3aed' }], prompt: 'A whimsical fantasy set in an enchanted forest where the hero meets kind magical creatures and finds their courage.' },
  { id: 'tpl-brave-explorer', title: 'The Brave Explorer', icon: '🧭', category: TemplateCategory.ADVENTURE, description: 'A daring journey across maps, mountains and hidden treasures.', ageRange: '4–8', availablePages: [16, 20, 24], pageCount: 20, defaultTone: 'exciting and bold', badge: 'New', coverColor: '#fff6f0', tags: [{ label: 'Adventure', bg: '#fff6f0', color: '#c0709a' }], prompt: 'An exciting adventure where the hero explores unknown lands, overcomes obstacles and discovers their inner bravery.' },
  { id: 'tpl-ocean-friends', title: 'Ocean Friends', icon: '🌊', category: TemplateCategory.NATURE, description: 'A calm undersea tale about kindness and the wonders of nature.', ageRange: '3–6', availablePages: [12, 16], pageCount: 12, defaultTone: 'calm and soothing', coverColor: '#eefaf5', tags: [{ label: 'Nature', bg: '#eefaf5', color: '#2f9e6e' }], prompt: 'A soothing nature story beneath the waves where the hero befriends sea creatures and learns to care for the ocean.' },
  { id: 'tpl-little-scientist', title: 'The Little Scientist', icon: '🔬', category: TemplateCategory.SCIENCE, description: 'Curious experiments turn everyday questions into big discoveries.', ageRange: '6–10', availablePages: [16, 20], pageCount: 20, defaultTone: 'curious and clever', coverColor: '#eef2ff', tags: [{ label: 'Science', bg: '#eef2ff', color: '#4f46e5' }], prompt: 'A curious science story where the hero asks big questions, runs playful experiments and makes a wonderful discovery.' },
  { id: 'tpl-best-friends', title: 'Best Friends Forever', icon: '🤝', category: TemplateCategory.FRIENDSHIP, description: 'A warm story about making friends and caring for each other.', ageRange: '4–8', availablePages: [12, 16, 20], pageCount: 16, defaultTone: 'warm and heartfelt', coverColor: '#ffeef5', tags: [{ label: 'Friendship', bg: '#ffeef5', color: '#c0709a' }], prompt: 'A heartfelt friendship story where the hero learns kindness, sharing and the joy of helping a friend in need.' },
  { id: 'tpl-animal-kingdom', title: 'Animal Kingdom', icon: '🦁', category: TemplateCategory.ANIMALS, description: 'A playful safari of brave, funny and loyal animal companions.', ageRange: '3–7', availablePages: [12, 16], pageCount: 12, defaultTone: 'playful and fun', coverColor: '#fff9e6', tags: [{ label: 'Animals', bg: '#fff9e6', color: '#b8860b' }], prompt: 'A playful animal story where the hero teams up with brave and funny creatures and learns about courage and loyalty.' },
];

async function main() {
  for (const topic of topics) {
    await prisma.topic.upsert({ where: { id: topic.id }, create: topic, update: topic });
  }

  for (const template of templates) {
    await prisma.template.upsert({ where: { id: template.id }, create: template, update: template });
  }

  // Singleton AI settings — create with defaults; leave existing values untouched on reseed.
  await prisma.appSettings.upsert({ where: { id: 'singleton' }, create: {}, update: {} });

  for (const item of priceItems) {
    await prisma.priceItem.upsert({ where: { key: item.key }, create: item, update: item });
  }

  // Promote the designated admin if that user already exists.
  const admin = await prisma.user.updateMany({
    where: { email: ADMIN_EMAIL },
    data: { role: 'ADMIN' },
  });
  console.log(
    admin.count > 0
      ? `Admin role set on ${ADMIN_EMAIL}.`
      : `Admin ${ADMIN_EMAIL} not found yet — sign in once, then re-run seed.`,
  );

  console.log(
    `Seeded ${topics.length} topics, ${templates.length} templates, ${priceItems.length} price items, AppSettings singleton.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
