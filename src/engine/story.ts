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
];
