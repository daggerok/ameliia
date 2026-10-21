import { type L10n, type Rng, L, pick } from './core';

// What Lina (the guide) and Pip (the capybara) say. Warm, short, never scary.

export const LOVE: L10n[] = [
    L('Mom and Dad love you so much, Ameliia! ❤️', 'Мама и папа очень-очень тебя любят, Амелия! ❤️'),
    L('Mom and Dad are proud of you for trying. They love you!', 'Мама и папа гордятся тем, что ты стараешься. Они тебя любят!'),
    L('Grandma Sveta and Grandpa Valerik are cheering for you at home!', 'Бабушка Света и дедушка Валерик болеют за тебя дома!'),
    L('Grandma Olga and Grandpa Valeriy in Italy send you a big hug!', 'Бабушка Оля и дедушка Валерий из Италии крепко тебя обнимают!'),
    L('Martin thinks his big sister is the smartest. And he is right!', 'Мартин думает, что его старшая сестра самая умная. И он прав!'),
    L('You are kind, smart and brave. Mom and Dad love you!', 'Ты добрая, умная и смелая. Мама и папа тебя любят!'),
];

export const WHY_MATH: L10n[] = [
    L('Math helps grown-ups earn money, save money and spend it wisely. Every task you solve now makes your future easier.',
        'Математика помогает взрослым зарабатывать деньги, копить и тратить их с умом. Каждая решённая задача делает твоё будущее проще.'),
    L('Many great jobs use math every day: doctors, artists, pilots, builders, scientists. Learning it now opens all those doors.',
        'Во многих интересных профессиях математика нужна каждый день: врачам, художникам, пилотам, строителям, учёным. Учишь её сейчас - открываешь все эти двери.'),
    L('With division you can share fairly, plan a trip and know how much things cost. That is a superpower for life!',
        'С делением можно делить честно, планировать поездки и понимать, сколько что стоит. Это суперсила на всю жизнь!'),
    L('When we go to Florida or Italy, speed and time tell us how long the trip takes. Math is the map behind every adventure.',
        'Когда мы поедем во Флориду или в Италию, скорость и время подскажут, сколько ехать. Математика - это карта любого путешествия.'),
    L('Music is math too: beats, measures and rhythm on the piano and flute are all counting and dividing.',
        'Музыка - это тоже математика: доли, такты и ритм на пианино и флейте - это счёт и деление.'),
    L('Artists use math to mix paint, measure a canvas and draw in proportion. Math makes your paintings even better!',
        'Художники используют математику, чтобы смешивать краски, мерить холст и рисовать в пропорциях. Математика делает картины ещё лучше!'),
    L('Math is a muscle, like gymnastics: it gets stronger every time you practice, even when it feels hard.',
        'Математика - как мышца в гимнастике: становится сильнее с каждой тренировкой, даже когда трудно.'),
];

export const PRAISE: L10n[] = [
    L('Yes! You did it!', 'Да! У тебя получилось!'),
    L('Brilliant thinking!', 'Блестяще!'),
    L('Wow, that was quick and correct!', 'Ух ты, быстро и правильно!'),
    L('You are a math star! ⭐', 'Ты звезда математики! ⭐'),
    L('Perfect! Pip is doing a happy dance!', 'Идеально! Пип танцует от радости!'),
    L('Correct! Your brain is getting stronger!', 'Верно! Твой мозг становится сильнее!'),
    L('Super! One more color for your painting!', 'Супер! Ещё один цвет для твоей картины!'),
    L('Great job! That was a tricky one.', 'Отлично! Задачка была с подвохом.'),
];

export const ENCOURAGE: L10n[] = [
    L('Oops! Mistakes are how brains grow. Let\'s learn this together.', 'Ой! Ошибки - это то, от чего мозг растёт. Давай разберёмся вместе.'),
    L('Not yet! Every math star made this mistake once. Let\'s read the secret.', 'Пока не получилось! Каждая звезда математики когда-то так ошибалась. Давай узнаем секрет.'),
    L('That\'s OK! Let\'s look at it step by step, I will help you.', 'Ничего страшного! Давай посмотрим по шагам, я помогу.'),
    L('Almost! A quick look at the theory and you will nail it.', 'Почти! Немного теории, и всё получится.'),
];

export const KIND: L10n[] = [
    L('You are such a kind person, Ameliia. Kind and smart is the best mix!', 'Ты такая добрая, Амелия. Доброта и ум - лучшее сочетание!'),
    L('Thank you for working so hard. You make everyone around you happy!', 'Спасибо, что так стараешься. Ты радуешь всех вокруг!'),
];

export const say = (rng: Rng, list: L10n[]) => pick(rng, list);
