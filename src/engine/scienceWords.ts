/// <reference lib="esnext" />
import { type L10n, type Problem, type Rng, L, choice, int, pick } from './core';

// Science Chapter 2 study guide: fill in the missing word, the way the test asks "What is gravity?".
// The word is always written in English (the test is in English); the Russian screen adds a translation.
// Definitions are word for word from the study guide (parts I and II), plus sentences from her life with the same words.

export type Blank = { key: string; en: string; ru: string; word: string; accept?: string[]; part: 1 | 2 };
const B = (key: string, part: 1 | 2, word: string, en: string, ru: string, accept: string[] = []): Blank => ({ key, part, word, en, ru, accept });

export const BLANKS: Blank[] = [
    // the study guide, word for word
    B('def-motion', 1, 'motion', '___: a change in position of an object.', '___ (движение): изменение положения предмета.'),
    B('def-position', 1, 'position', 'Motion is a change in ___ of an object.', 'Движение - это изменение ___ (положения) предмета.'),
    B('def-reference', 1, 'reference point', 'A ___ is a place or object used to determine if an object is in motion.', '___ (точка отсчёта) - место или предмет, по которому понятно, движется ли предмет.', ['reference points']),
    B('def-force', 1, 'force', 'A ___ is any push or pull.', '___ (сила) - это любой толчок или тяга.', ['forces']),
    B('def-push', 1, 'push', 'A force is any ___ or pull.', 'Сила - это любой ___ (толчок) или тяга.'),
    B('def-pull', 1, 'pull', 'A force is any push or ___.', 'Сила - это любой толчок или ___ (тяга).'),
    B('def-gravity', 1, 'gravity', '___ is the force that pulls all objects towards each other.', '___ (гравитация) - сила, которая притягивает все предметы друг к другу.'),
    B('def-relative', 1, 'relative motion', '___ is the change of one object\'s position compared with another object\'s position.', '___ (относительное движение) - изменение положения одного предмета по сравнению с другим.'),
    B('def-vibration', 1, 'vibration', 'Objects can move in a straight line, in a curved path, back and forth as a ___, or as a rotation.', 'Предметы движутся по прямой, по кривой, туда-сюда как ___ (вибрация) или вращаются.', ['vibrations']),
    B('def-rotation', 1, 'rotation', 'Objects can move in a straight line, in a curved path, back and forth as a vibration, or as a ___.', 'Предметы движутся по прямой, по кривой, туда-сюда как вибрация или как ___ (вращение).', ['rotations']),
    B('def-size-direction', 1, 'direction', 'All forces have size and ___.', 'У всех сил есть величина и ___ (направление).'),
    B('def-balanced', 1, 'balanced', 'When two forces acting on an object are equal in size but act in opposite directions, we say that they are ___ forces.', 'Когда две силы равны по величине, но направлены в противоположные стороны, это ___ (уравновешенные) силы.', ['balanced forces']),
    B('def-speed', 2, 'speed', '___: the rate at which an object changes position.', '___ (скорость): то, как быстро предмет меняет положение.'),
    B('def-velocity', 2, 'velocity', '___ combines both the speed and direction an object is moving.', '___ (velocity) объединяет скорость и направление движения.'),
    B('def-acceleration', 2, 'acceleration', '___: any change in the speed or direction of an object\'s motion.', '___ (ускорение): любое изменение скорости или направления движения.'),
    // her life, the same words
    B('ex-gravity', 1, 'gravity', 'Ameliia lets go of a pencil and it falls to the floor. The force that pulls it down is ___.', 'Амелия отпускает карандаш, и он падает на пол. Сила, которая тянет его вниз, - это ___ (гравитация).'),
    B('ex-vibration', 1, 'vibration', 'A plucked guitar string moves quickly back and forth. That kind of motion is a ___.', 'Дёрнутая струна гитары быстро движется туда-сюда. Такое движение - это ___ (вибрация).', ['vibrations']),
    B('ex-rotation', 1, 'rotation', 'A merry-go-round spins around and around. Spinning around is a ___.', 'Карусель крутится и крутится. Вращение вокруг себя - это ___ (вращение).', ['rotations']),
    B('ex-push', 1, 'push', 'Martin kicks a ball away from him. A kick is a ___.', 'Мартин бьёт по мячу, и мяч летит от него. Удар - это ___ (толчок).'),
    B('ex-pull', 1, 'pull', 'Ameliia opens a drawer toward herself. That is a ___.', 'Амелия выдвигает ящик к себе. Это ___ (тяга).'),
    B('ex-balanced', 1, 'balanced', 'In a tug of war both teams pull just as hard and the rope stays still. The forces are ___.', 'В перетягивании каната обе команды тянут одинаково, и канат стоит на месте. Силы ___ (уравновешены).', ['balanced forces']),
    B('ex-reference', 1, 'reference point', 'The big tree stays still, so it shows that the bus is moving. The tree is a ___.', 'Большое дерево стоит на месте, и по нему видно, что автобус едет. Дерево - это ___ (точка отсчёта).', ['reference points']),
    B('ex-relative', 1, 'relative motion', 'On a train Mom looks still to Ameliia, but she is moving for a person on the platform. That is ___.', 'В поезде мама для Амелии неподвижна, а для человека на платформе движется. Это ___ (относительное движение).'),
    B('ex-motion', 1, 'motion', 'Ameliia walked from the door to the window. Her position changed, so she was in ___.', 'Амелия прошла от двери к окну. Её положение изменилось, значит, это было ___ (движение).'),
    B('ex-direction', 1, 'direction', 'Ameliia pushes a box to the left. "To the left" tells the ___ of the force.', 'Амелия толкает коробку влево. «Влево» - это ___ (направление) силы.'),
    B('ex-speed', 2, 'speed', 'Mom drives 30 miles per hour. "30 miles per hour" tells her ___.', 'Мама едет 30 миль в час. «30 миль в час» - это её ___ (скорость).'),
    B('ex-velocity', 2, 'velocity', 'A plane flies 500 miles per hour to the east. It has a direction, so this is a ___.', 'Самолёт летит 500 миль в час на восток. Есть направление, значит, это ___ (velocity).'),
    B('ex-acceleration', 2, 'acceleration', 'A bus leaves the bus stop and goes faster and faster. A change in speed is ___.', 'Автобус отъезжает от остановки и едет всё быстрее. Изменение скорости - это ___ (ускорение).'),
    B('ex-time', 2, 'time', 'Average speed = total distance ÷ total ___.', 'Средняя скорость = всё расстояние ÷ всё ___ (время).'),
    B('ex-distance', 2, 'distance', 'Average speed = total ___ ÷ total time.', 'Средняя скорость = всё ___ (расстояние) ÷ всё время.'),
];

const fill = (s: string, w: string) => s.replace('___', w);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
// the sentence with the word, capitalized when the word starts it
const filled = (b: Blank) => (b.en.startsWith('___') ? fill(b.en, cap(b.word)) : fill(b.en, b.word));

// first letter and length: a nudge, not the answer
const hintOf = (b: Blank): L10n => {
    const words = b.word.split(' ');
    return words.length > 1
        ? L(`Two words: ${words.map(w => `${w[0]}... (${w.length} letters)`).join(', ')}.`, `Два слова: ${words.map(w => `${w[0]}... (${w.length} букв)`).join(', ')}.`)
        : L(`The word starts with "${b.word[0]}" and has ${b.word.length} letters.`, `Слово начинается на «${b.word[0]}», в нём ${b.word.length} букв.`);
};

export const makeScienceWords = (rng: Rng, want?: string): Problem => {
    const b = BLANKS[int(rng, 0, BLANKS.length - 1)];
    // mostly typed, like on the test; sometimes a word bank to start with
    const style = want === 'type' || want === 'bank' ? want : pick(rng, ['type', 'type', 'type', 'bank'] as const);
    const others = Array.from(new Set(BLANKS.map(x => x.word).filter(w => w !== b.word)));
    const bank = [b.word, ...[0, 1, 2].map(() => others.splice(int(rng, 0, others.length - 1), 1)[0])];
    const where = b.part === 1 ? L('Study guide, part I', 'Памятка, часть I') : L('Study guide, part II', 'Памятка, часть II');
    const steps = [
        L(filled(b), filled(b)),
        L(`The missing word: ${b.word}.`, `Пропущенное слово: ${b.word}. ${fill(b.ru, b.word)}`),
        L(`${where.en}: learn the sentence together with the word, the test asks it the same way.`, `${where.ru}: учи предложение вместе со словом, на тесте спрашивают так же.`),
    ];
    const base = { skill: 'sci-words' as const, topic: 'science' as const, steps, hint: hintOf(b), data: { style, part: b.part, key: b.key } };
    if (style === 'bank') {
        return {
            ...base, id: `sci-words:bank:${b.key}`,
            prompt: L(`Choose the missing word: ${b.en}`, `Выбери пропущенное английское слово: ${b.en}\n(${b.ru})`),
            answer: choice(rng, L(b.word, b.word), bank.slice(1).map(w => L(w, w))),
        };
    }
    return {
        ...base, id: `sci-words:type:${b.key}`,
        prompt: L(`Fill in the missing word: ${b.en}`, `Впиши пропущенное английское слово: ${b.en}\n(${b.ru})`),
        answer: { kind: 'word', word: b.word, accept: b.accept ?? [] },
    };
};

// what a science word means, from the study guide: for "that is a science word too, but it means ..."
export const meaningOf = (word: string): L10n | null => {
    const b = BLANKS.find(x => x.key.startsWith('def-') && x.word === word) ?? BLANKS.find(x => x.word === word);
    return b ? L(filled(b), fill(b.ru, b.word)) : null;
};

// the definitions for the theory page, in study guide order
// (each sentence once: "a force is any push or pull" is also the sentence of push and pull)
const THEORY_KEYS = ['def-motion', 'def-reference', 'def-force', 'def-gravity', 'def-relative', 'def-rotation', 'def-size-direction', 'def-balanced', 'def-speed', 'def-velocity', 'def-acceleration'];
export const DEFINITIONS = THEORY_KEYS.map(k => BLANKS.find(b => b.key === k)!).map(b => L(filled(b), fill(b.ru, b.word)));
