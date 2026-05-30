import type { Task } from '../types';
import task1Img from '../assets/tasks/task1.png';
import task2Img from '../assets/tasks/task2.jpeg';
import task3Img from '../assets/tasks/task3.png';
import task4Img from '../assets/tasks/task4.png';
import task5Img from '../assets/tasks/task5.png';
import task6Img from '../assets/tasks/task6.jpeg';
import task8aImg from '../assets/tasks/task8a.png';
import task8bImg from '../assets/tasks/task8b.png';

export const TASKS: Task[] = [
  {
    id: 1,
    title: 'משימה 1',
    questionLines: [
      'מה המילה שפירושה באנגלית שמח,',
      'אבל אף אחד מכם לא אוהב את המילה הזאת.',
    ],
    image: task1Img,
    acceptedAnswers: ['glad'],
    inputDir: 'ltr',
    inputPlaceholder: 'מילה באנגלית',
    hint: 'מילה באנגלית שמשמעותה שמח...',
  },
  {
    id: 2,
    title: 'משימה 2',
    questionLines: [
      'אני הבן האהוב',
      'קיבלתי כותונת מיוחדת',
      'האחים שלי קינאו בי',
      'מי אני?',
    ],
    image: task2Img,
    acceptedAnswers: ['יוסף', 'joseph', 'יוסי'],
    hint: 'סיפור ממשפחת האבות...',
  },
  {
    id: 3,
    title: 'משימה 3',
    questionLines: [
      'מכתב, כתב, כוכב, כתבה',
      'רק שלוש מהמילים שייכות לאותה משפחה. איזה מילה לא שייכת?',
    ],
    image: task3Img,
    acceptedAnswers: ['כוכב'],
    hint: 'שלוש מילים קשורות לכתיבה...',
  },
  {
    id: 4,
    title: 'משימה 4',
    questionLines: [
      'טיילנו בין שבילים ופרחים',
      'ראינו טבע ונוף מקסים',
      'לא היינו בחרמון ולא במדבר',
      'איפה ביקרנו בטיול השנתי?',
    ],
    image: task4Img,
    acceptedAnswers: ['רמת הנדיב', 'רמת הנדיב גן לאומי', 'גן לאומי רמת הנדיב'],
    hint: 'גן לאומי עם שבילים ופרחים ליד הים...',
  },
  {
    id: 5,
    title: 'משימה 5',
    questionLines: [
      'אני מספר זוגי',
      'אני גדול מ-20',
      'אם מחלקים אותי ב-5 מקבלים 6',
      'איזה מספר אני?',
    ],
    image: task5Img,
    acceptedAnswers: ['30'],
    hint: '5 כפול 6 שווה ל...?',
  },
  {
    id: 6,
    title: 'משימה 6',
    questionLines: [
      'בכל שבוע יצאתם ללמוד בטבע',
      'עם שקית רב פעמית, לא משנה הצבע',
      'לאן הלכתם?',
    ],
    image: task6Img,
    acceptedAnswers: ['החווה החקלאית', 'חווה חקלאית', 'החווה'],
    hint: 'מקום שבו לומדים בטבע עם שקית רב-פעמית...',
  },
  {
    id: 7,
    title: 'משימה 7',
    questionLines: [
      'השלימו את האותיות חסרות',
      'Aa, Bb, Cc, Dd, Ee, Ff,',
      'Gg, Hh, __, Jj, __',
    ],
    questionLineDirs: ['rtl', 'ltr', 'ltr'],
    acceptedAnswers: ['ii, kk', 'ii kk', 'Ii, Kk', 'Ii Kk'],
    inputPlaceholder: '',
    inputDir: 'ltr',
    hint: 'אחרי Hh בא Ii, ואחרי Jj בא Kk',
  },
  {
    id: 8,
    title: 'משימה 8',
    questionLines: [
      'בימי שישי, בשיעור כישורי חיים,',
      'אם היה זמן, אהבתם לצפות ב....?',
    ],
    image: task8aImg,
    imageSecondary: task8bImg,
    acceptedAnswers: ['הכיתה שלנו', 'כיתה שלנו'],
    hint: 'תוכנית שאהבתם לצפות בה בכישורי חיים...',
  },
  {
    id: 9,
    title: 'משימה 9',
    questionLines: ['איזה מילה באנגלית כולכם אהבתם במיוחד השנה?'],
    image: task1Img,
    acceptedAnswers: ['sofa'],
    inputPlaceholder: 'מילה באנגלית',
    inputDir: 'ltr',
    hint: 'מילה באנגלית שאהבתם במיוחד השנה...',
  },
  {
    id: 10,
    title: 'משימה 10',
    questionLines: [
      'בתיבה יש 4 שקיקים קטנים',
      'בכל שקיק יש בדיוק 8 מטבעות זהב.',
      'בנוסף, יש עוד 5 מטבעות רופפים.',
      'כמה מטבעות זהב יש בסך הכל בתיבה?',
    ],
    image: task5Img,
    acceptedAnswers: ['37'],
    hint: '4 כפול 8, ועוד 5...',
  },
  {
    id: 11,
    title: 'משימה 11',
    questionLines: [
      'אני לא אח של יוסף',
      'אני לא בן אדם',
      'האחים זרקו אותי אליי',
      'מה אני?',
    ],
    image: task2Img,
    acceptedAnswers: ['בור', 'הבור'],
    hint: 'מקום עמוק באדמה...',
  },
  {
    id: 12,
    title: 'משימה 12',
    questionLines: [
      'איזו מהמילים הבאות היא פועל בזמן עתיד?',
      'רקדנו, רוקדים, נרקוד, ריקוד',
    ],
    image: task3Img,
    acceptedAnswers: ['נרקוד'],
    hint: 'עתיד = מה שעוד יקרה...',
  },
];

export function getTaskByStep(step: number): Task | undefined {
  return TASKS.find((t) => t.id === step);
}
