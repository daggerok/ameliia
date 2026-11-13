/// <reference lib="esnext" />
import { type L10n, L } from './core';

// A chapter opens every STARS_PER_CHAPTER stars. Each one is a short read with a little math inside.
export const STARS_PER_CHAPTER = 30;

export type Chapter = { title: L10n; icon: string; text: L10n[] };

export const CHAPTERS: Chapter[] = [
    {
        title: L('The Secret Plan', 'Секретный план'), icon: '✉️',
        text: [
            L('One rainy evening in Fort Lee, Mom and Dad sat down on the couch with Ameliia and little Martin. Dad had a big smile. "We have a secret plan," he whispered.',
                'Однажды дождливым вечером в Форт-Ли мама и папа сели на диван рядом с Амелией и маленьким Мартином. Папа широко улыбался. «У нас есть секретный план», - прошептал он.'),
            L('"First we fly to Florida, where the sea is warm and the sun is bright. And next year... we go to Italy to visit Grandma Olga and Grandpa Valeriy!"',
                '«Сначала мы полетим во Флориду, где тёплое море и яркое солнце. А в следующем году... мы поедем в Италию к бабушке Оле и дедушке Валерию!»'),
            L('Martin clapped his hands, even though he did not know what Italy was. Grandma Sveta and Grandpa Valerik laughed from the kitchen.',
                'Мартин захлопал в ладоши, хотя и не знал, что такое Италия. Бабушка Света и дедушка Валерик смеялись на кухне.'),
            L('"A trip like that needs a great planner," said Mom, and she looked at Ameliia. "Someone who is good with numbers." Ameliia gulped. Numbers? Well... maybe it was time to become friends with them.',
                '«Для такой поездки нужен отличный планировщик, - сказала мама и посмотрела на Амелию. - Кто-то, кто дружит с числами». Амелия сглотнула. С числами? Ну... может, пора с ними подружиться.'),
        ],
    },
    {
        title: L('Lina and Pip', 'Лина и Пип'), icon: '🐾',
        text: [
            L('That night a tiny light glowed on Ameliia\'s iPad. Out of the screen stepped a girl with round glasses and light brown hair, and next to her trotted a fluffy little capybara with an orange on her head.',
                'Той ночью на iPad Амелии загорелся маленький огонёк. Из экрана вышла девочка в круглых очках со светло-русыми волосами, а рядом с ней топала пушистая маленькая капибара с апельсином на голове.'),
            L('"Hi! I am Lina, and this is Pip," said the girl. "Pip loves math, but she makes funny mistakes. Will you help us catch them?"',
                '«Привет! Я Лина, а это Пип, - сказала девочка. - Пип обожает математику, но делает смешные ошибки. Поможешь нам их ловить?»'),
            L('Pip squeaked proudly: "I know that 618 divided by 3 is 26!" Lina sighed. Ameliia giggled: "26 times 3 is only 78. You lost a zero, Pip! It is 206."',
                'Пип гордо пискнула: «Я знаю, что 618 разделить на 3 будет 26!» Лина вздохнула. Амелия захихикала: «26 умножить на 3 - всего 78. Ты потеряла ноль, Пип! Будет 206».'),
            L('Lina grinned. "See? You are already a math detective."', 'Лина улыбнулась: «Видишь? Ты уже настоящий математический детектив».'),
        ],
    },
    {
        title: L('Grandma Sveta\'s Cookie Plan', 'Печеньковый план бабушки Светы'), icon: '🍪',
        text: [
            L('On Saturday Grandma Sveta baked chocolate cookies for the Florida trip. "96 cookies," she said, "for 4 bags. Each bag the same, please!"',
                'В субботу бабушка Света испекла шоколадное печенье в дорогу во Флориду. «96 печенек, - сказала она, - на 4 пакета. В каждом поровну, пожалуйста!»'),
            L('Ameliia remembered the family trick: Dad - divide, Mom - multiply, Sister - subtract, Brother - bring down. 9 tens shared by 4 is 2 tens, 1 ten left. Bring down the 6: 16 ones shared by 4 is 4.',
                'Амелия вспомнила семейную запоминалку: Папа - делим, Мама - умножаем, Сестра - вычитаем, Брат - сносим. 9 десятков на 4 - по 2 десятка, 1 десяток остаётся. Сносим 6: 16 единиц на 4 - по 4.'),
            L('"24 in each bag!" she said. Grandma Sveta checked: 24 times 4 is 96. "My clever girl!" Martin tried to eat bag number five, which did not exist.',
                '«По 24 в каждом пакете!» - сказала она. Бабушка Света проверила: 24 умножить на 4 - это 96. «Моя умница!» Мартин пытался съесть пятый пакет, которого не было.'),
        ],
    },
    {
        title: L('Fast, Faster, Fastest', 'Быстро, быстрее, быстрее всех'), icon: '✈️',
        text: [
            L('"How long is the trip to Florida?" asked Ameliia. Dad showed the map: about 1,000 miles. "By car, about 20 hours of driving. By plane, about 2 hours in the air."',
                '«Долго ехать во Флориду?» - спросила Амелия. Папа показал карту: около 1 000 миль. «На машине - примерно 20 часов за рулём. На самолёте - около 2 часов в воздухе».'),
            L('Ameliia divided: 1,000 miles in 20 hours is 50 miles each hour. 1,000 miles in 2 hours is 500 miles each hour! "The plane is ten times faster!"',
                'Амелия разделила: 1 000 миль за 20 часов - это 50 миль за каждый час. 1 000 миль за 2 часа - 500 миль за каждый час! «Самолёт в десять раз быстрее!»'),
            L('"And is the car always at 50?" asked Lina. "No," said Ameliia, "it stops, it speeds up. 50 is the AVERAGE." Pip fainted from happiness.',
                '«А машина всё время едет 50?» - спросила Лина. «Нет, - ответила Амелия, - она останавливается, разгоняется. 50 - это СРЕДНЯЯ скорость». Пип упала в обморок от счастья.'),
        ],
    },
    {
        title: L('The Ice Cream Estimate', 'Мороженая прикидка'), icon: '🍦',
        text: [
            L('In Florida the family went to an ice cream cafe by the beach. Mom ordered: chocolate for Ameliia, vanilla for Martin, and coffee ice cream for the grown-ups.',
                'Во Флориде семья пошла в кафе-мороженое у пляжа. Мама заказала шоколадное Амелии, ванильное Мартину и кофейное взрослым.'),
            L('"The bill is $38 and $47," said Dad. "Do we have enough with $100?" Ameliia rounded: 38 is about 40, 47 is about 50. 40 plus 50 is 90. "Yes! And $10 left for gummy bears!"',
                '«Счёт - $38 и $47, - сказал папа. - Хватит ли $100?» Амелия округлила: 38 - это примерно 40, 47 - примерно 50. 40 плюс 50 будет 90. «Хватит! И ещё $10 останется на мармеладных мишек!»'),
            L('Dad laughed. "Rounding saves the day again." Martin had ice cream on his nose, his ears and somehow on his shoe.',
                'Папа засмеялся: «Округление снова спасает». У Мартина мороженое было на носу, на ушах и почему-то на ботинке.'),
        ],
    },
    {
        title: L('The Painting by the Sea', 'Картина у моря'), icon: '🎨',
        text: [
            L('Ameliia painted the sea with her watercolors. She wanted 3 waves, 3 shells and 3 seagulls in each of her 4 pictures. "How many of each do I need in all?"',
                'Амелия рисовала море акварелью. Она хотела на каждой из 4 картин 3 волны, 3 ракушки и 3 чайки. «Сколько всего нужно каждого?»'),
            L('"3 times 4 is 12 of each," she counted, "and 12 times 3 kinds is 36 little things to paint!" Lina whispered: "Artists use math all the time."',
                '«3 умножить на 4 - по 12 каждого, - посчитала она, - а 12 умножить на 3 вида - это 36 маленьких рисунков!» Лина шепнула: «Художники всё время пользуются математикой».'),
            L('Mom hung the pictures in the hotel room. "When you grow up you can paint, play the flute, do gymnastics and be great at math. You can be anything you want."',
                'Мама повесила картины в номере. «Когда вырастешь, сможешь рисовать, играть на флейте, заниматься гимнастикой и отлично знать математику. Ты можешь стать кем захочешь».'),
        ],
    },
    {
        title: L('The Train Through Italy', 'Поезд через Италию'), icon: '🚆',
        text: [
            L('A year later the family landed in Rome. The fast train took them north: 180 miles in 2 hours. "90 miles per hour!" said Ameliia before Dad could even ask.',
                'Через год семья приземлилась в Риме. Скоростной поезд повёз их на север: 180 миль за 2 часа. «90 миль в час!» - сказала Амелия раньше, чем папа успел спросить.'),
            L('Then a slow local train: 60 miles in 3 hours. "Pip says the average is (90 + 20) ÷ 2 = 55," said Lina. "No way," said Ameliia. "All the distance, 240 miles, divided by all the time, 5 hours, is 48."',
                'Потом медленная электричка: 60 миль за 3 часа. «Пип говорит, что средняя скорость (90 + 20) ÷ 2 = 55», - сказала Лина. «Ни за что, - ответила Амелия. - Всё расстояние, 240 миль, делим на всё время, 5 часов, получается 48».'),
            L('Pip hid behind Lina. On the platform stood Grandma Olga and Grandpa Valeriy, waving with both hands.',
                'Пип спряталась за спину Лины. На платформе стояли бабушка Оля и дедушка Валерий и махали обеими руками.'),
        ],
    },
    {
        title: L('An Owl at the Window', 'Сова за окном'), icon: '🦉',
        text: [
            L('Every evening in Italy Ameliia and Mom read Harry Potter together, one chapter before bed. Mom did the voices, and Ameliia always guessed what happened next.',
                'Каждый вечер в Италии Амелия и мама читали вместе «Гарри Поттера», по главе перед сном. Мама говорила разными голосами, а Амелия всегда угадывала, что будет дальше.'),
            L('One night something tapped on the window. It was Pip, wearing round glasses and a red and gold scarf, holding a letter. "Owl post!" she squeaked. "Well, capybara post."',
                'Однажды ночью кто-то постучал в окно. Это была Пип в круглых очках и красно-золотом шарфе, с письмом в лапах. «Совиная почта! - пискнула она. - Ну, капибарья почта».'),
            L('The letter said: "The castle library has 4 shelves with 125 books on each. How many books?" Ameliia smiled: "4 × 25 is 100, so 4 × 125 is 500."',
                'В письме было: «В библиотеке замка 4 полки, на каждой 125 книг. Сколько всего книг?» Амелия улыбнулась: «4 × 25 - это 100, значит 4 × 125 - это 500».'),
            L('"Ten points to Ameliia!" said Mom, and turned the page. Pip curled up at the foot of the bed and fell asleep in the middle of the next chapter.',
                '«Десять очков Амелии!» - сказала мама и перевернула страницу. Пип свернулась клубочком в ногах кровати и заснула на середине следующей главы.'),
        ],
    },
    {
        title: L('The Biggest Hug', 'Самые крепкие объятия'), icon: '❤️',
        text: [
            L('Grandma Olga hugged Ameliia so tight and so long that Pip had to walk around them twice to find a free spot for her own hug. Grandpa Valeriy lifted Martin high up to the sky.',
                'Бабушка Оля обнимала Амелию так крепко и так долго, что Пип пришлось дважды обойти их, чтобы найти свободное местечко для своих объятий. Дедушка Валерий подбросил Мартина высоко к небу.'),
            L('That evening Grandpa Valeriy asked: "So, who planned this whole trip?" Everybody looked at Ameliia. She had divided cookies, rounded the cafe bill and found every average speed.',
                'Вечером дедушка Валерий спросил: «Ну, кто же спланировал всю поездку?» Все посмотрели на Амелию. Она делила печенье, округляла счёт в кафе и находила каждую среднюю скорость.'),
            L('"Math is not scary," Ameliia said. "It is a map for adventures." Mom and Dad smiled the biggest smiles. "We love you so much," they said. "And we are so proud of you."',
                '«Математика совсем не страшная, - сказала Амелия. - Это карта для приключений». Мама и папа улыбались самыми широкими улыбками. «Мы так тебя любим, - сказали они. - И так тобой гордимся».'),
        ],
    },
    // back home in Fort Lee: the wizard school chapters (2026-11-12)
    {
        title: L('A Letter by Capybara Post', 'Письмо капибарьей почтой'), icon: '🪄',
        text: [
            L('Back home in Fort Lee the leaves were orange and red, and the evenings were dark early. One evening something scratched at the window. It was Pip, with a big envelope sealed with gold wax.',
                'Дома в Форт-Ли листья стали оранжевыми и красными, а вечером рано темнело. Однажды кто-то заскрёбся в окно. Это была Пип с большим конвертом, запечатанным золотым сургучом.'),
            L('"Dear Ameliia," Lina read. "You are invited to the Evening School of Number Wizards. It opens inside your iPad after homework. To open the door, say the password: 2,400 divided by 6."',
                '«Дорогая Амелия, - прочитала Лина. - Приглашаем тебя в Вечернюю школу числовых волшебников. Она открывается внутри твоего iPad после домашнего задания. Чтобы открыть дверь, назови пароль: 2 400 разделить на 6».'),
            L('"40!" squeaked Pip. The door did not move. Ameliia thought: "The basic fact is 24 ÷ 6 = 4. There are two zeros in 2,400, so the answer gets two zeros too: 2,400 ÷ 6 = 400."',
                '«40!» - пискнула Пип. Дверь не шелохнулась. Амелия подумала: «Основной факт: 24 ÷ 6 = 4. В числе 2 400 два нуля, значит и в ответе два нуля: 2 400 ÷ 6 = 400».'),
            L('The door swung open with a happy creak. Pip looked at her lost zero on the floor and quietly put it in her pocket for next time.',
                'Дверь со скрипом радостно распахнулась. Пип посмотрела на свой потерянный ноль на полу и тихонько положила его в карман - на следующий раз.'),
        ],
    },
    {
        title: L('The Sorting Hat\'s Riddle', 'Загадка шляпы-распределителя'), icon: '🎩',
        text: [
            L('Inside was a hall with a thousand candles floating in the air. On a stool sat an old patched hat. It opened its brim and said in a deep voice: "Every new student must answer my riddle!"',
                'Внутри был зал, где в воздухе парила тысяча свечей. На табурете сидела старая латаная шляпа. Она открыла поля и сказала низким голосом: «Каждый новый ученик должен отгадать мою загадку!»'),
            L('"174 owls fly to 9 towers, the same number to each tower. About how many owls in each tower?" Pip whispered: "174 is close to 170!" Ameliia shook her head: "170 is not friendly with 9. 174 is close to 180, and 180 ÷ 9 = 20. About 20 owls!"',
                '«174 совы летят к 9 башням, к каждой поровну. Примерно сколько сов в каждой башне?» Пип прошептала: «174 близко к 170!» Амелия покачала головой: «170 не дружит с 9. 174 близко к 180, а 180 ÷ 9 = 20. Примерно 20 сов!»'),
            L('"Compatible numbers!" the hat cried. "Clever and brave. You belong to the house of red and gold!" Lina clapped, and Pip got a tiny red and gold scarf.',
                '«Совместимые числа! - воскликнула шляпа. - Умная и смелая. Твой факультет - красно-золотой!» Лина захлопала, а Пип получила крошечный красно-золотой шарф.'),
            L('At home Martin put a cooking pot on his head and announced that he was a sorting hat too. He sorted everybody into the house of cookies.',
                'А дома Мартин надел на голову кастрюлю и объявил, что он тоже шляпа-распределитель. Он распределил всех на факультет печенья.'),
        ],
    },
    {
        title: L('Potions Class', 'Урок зелий'), icon: '🧪',
        text: [
            L('In the cold stone classroom green cauldrons bubbled. The potions teacher, a tall wizard with a silver beard, gave the recipe: "360 drops of moonberry juice, shared equally into 9 bottles."',
                'В холодном каменном классе булькали зелёные котлы. Учитель зелий, высокий волшебник с серебряной бородой, дал рецепт: «360 капель лунной ягоды, поровну в 9 бутылочек».'),
            L('Pip poured 50 drops into each bottle, very fast. Ameliia stopped her: "Check by multiplying back: 50 × 9 = 450. That is more than 360!" Too late: Pip\'s fur turned bright green.',
                'Пип очень быстро налила в каждую бутылочку по 50 капель. Амелия остановила её: «Проверим умножением: 50 × 9 = 450. Это больше, чем 360!» Поздно: шёрстка Пип стала ярко-зелёной.'),
            L('Ameliia used the basic fact: 36 ÷ 9 = 4, so 360 ÷ 9 = 40. And the check: 40 × 9 = 360. Every bottle began to glow soft gold.',
                'Амелия взяла основной факт: 36 ÷ 9 = 4, значит 360 ÷ 9 = 40. И проверка: 40 × 9 = 360. Все бутылочки засветились мягким золотым светом.'),
            L('"Ten points to the red and gold house!" said the teacher, and he even smiled a little. Pip stayed green until bedtime and said it was her new style.',
                '«Десять очков красно-золотому факультету!» - сказал учитель и даже чуть-чуть улыбнулся. Пип оставалась зелёной до самого сна и говорила, что это её новый стиль.'),
        ],
    },
    {
        title: L('A Feast for Everyone on the List', 'Пир для всех по списку'), icon: '🥧',
        text: [
            L('On Thanksgiving Grandma Sveta baked pumpkin pie, and Grandpa Valerik brought a box of 240 chocolate stars. "Share them equally among everybody at the table," said Grandma Sveta.',
                'На День благодарения бабушка Света испекла тыквенный пирог, а дедушка Валерик принёс коробку с 240 шоколадными звёздочками. «Раздели их поровну на всех за столом», - сказала бабушка Света.'),
            L('"Easy! 240 divided by 6 is 40 each," said Pip. Ameliia smiled: "First count the people on the list. Mom, Dad, Grandma Sveta, Grandpa Valerik, Martin, me, Lina and you, Pip. That is 8, not 6!"',
                '«Легко! 240 разделить на 6 - по 40 каждому», - сказала Пип. Амелия улыбнулась: «Сначала посчитай всех по списку. Мама, папа, бабушка Света, дедушка Валерик, Мартин, я, Лина и ты, Пип. Это 8, а не 6!»'),
            L('24 ÷ 8 = 3, so 240 ÷ 8 = 30 stars each. The check: 30 × 8 = 240. Grandma Olga and Grandpa Valeriy waved from Italy on the video call. "Save some for us for the summer!"',
                '24 ÷ 8 = 3, значит 240 ÷ 8 = 30 звёздочек каждому. Проверка: 30 × 8 = 240. Бабушка Оля и дедушка Валерий махали из Италии по видеосвязи: «Оставьте нам немножко до лета!»'),
            L('Martin ate his 30 stars in one minute and then asked very politely if a capybara really needs chocolate.',
                'Мартин съел свои 30 звёздочек за одну минуту, а потом очень вежливо спросил, правда ли капибарам нужен шоколад.'),
        ],
    },
    {
        title: L('The First Snow Spell', 'Заклинание первого снега'), icon: '❄️',
        text: [
            L('In December the first snow fell on Fort Lee. In wizard school Lina taught a new spell: "It makes snowflakes, but it works only if the math is right. Try 23 × 14."',
                'В декабре на Форт-Ли выпал первый снег. В волшебной школе Лина показала новое заклинание: «Оно делает снежинки, но работает, только если математика верная. Попробуй 23 × 14».'),
            L('Pip waved her wand first: "23 × 4 is 92!" Three sad snowflakes fell. "You forgot the 10 in 14," said Ameliia, and drew a box cut into four parts.',
                'Пип первая взмахнула палочкой: «23 × 4 - это 92!» Упали три грустные снежинки. «Ты забыла про 10 в числе 14», - сказала Амелия и нарисовала прямоугольник из четырёх частей.'),
            L('20 × 10 = 200, 20 × 4 = 80, 3 × 10 = 30, 3 × 4 = 12. Then she added the partial products: 200 + 80 + 30 + 12 = 322. Whoosh! Snow covered the whole yard.',
                '20 × 10 = 200, 20 × 4 = 80, 3 × 10 = 30, 3 × 4 = 12. Потом она сложила частичные произведения: 200 + 80 + 30 + 12 = 322. Вжух! Снег засыпал весь двор.'),
            L('Dad, Ameliia and Martin built a snowman, and Martin built a snow capybara next to it with a real orange on her head. Pip said it was the most beautiful snow sculpture in New Jersey.',
                'Папа, Амелия и Мартин слепили снеговика, а Мартин рядом слепил снежную капибару с настоящим апельсином на голове. Пип сказала, что это самая красивая снежная скульптура в Нью-Джерси.'),
        ],
    },
    {
        title: L('The House Cup', 'Кубок факультетов'), icon: '🏆',
        text: [
            L('At the winter feast the old headmistress stood up. "This term the red and gold house earned 420 points in 7 weeks. Who can tell me how many points each week, if every week was the same?"',
                'На зимнем пиру встала старая директриса. «В этой четверти красно-золотой факультет заработал 420 очков за 7 недель. Кто скажет, сколько очков за неделю, если каждая неделя была одинаковой?»'),
            L('Ameliia raised her hand: "42 ÷ 7 = 6, so 420 ÷ 7 = 60. The check: 60 × 7 = 420." And then something amazing happened: Pip raised her paw too. "And 800 ÷ 4 = 200!" she said. It was right!',
                'Амелия подняла руку: «42 ÷ 7 = 6, значит 420 ÷ 7 = 60. Проверка: 60 × 7 = 420». И тут случилось чудо: Пип тоже подняла лапку. «А 800 ÷ 4 = 200!» - сказала она. И это было верно!'),
            L('The hall cheered, the candles danced, and the red and gold house won the cup. Martin, who was watching on the iPad, shouted his very first math: "2 + 2 = 4!" Everybody cheered for him too.',
                'Зал зашумел, свечи заплясали, и красно-золотой факультет выиграл кубок. Мартин, который смотрел на iPad, выкрикнул свою самую первую математику: «2 + 2 = 4!» Ему тоже все хлопали.'),
            L('That night Mom tucked Ameliia in and read one more chapter of her magic book. "You are our little wizard," whispered Dad. Pip was already snoring, her orange glowing like a tiny lamp.',
                'Вечером мама укрыла Амелию одеялом и прочитала ещё одну главу её волшебной книги. «Ты наша маленькая волшебница», - прошептал папа. Пип уже сопела, а её апельсин светился, как крошечный фонарик.'),
        ],
    },
];
