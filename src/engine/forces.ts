import { type L10n, type Problem, type Rng, L, choice, int, pick } from './core';
import { FRIENDS, type Person } from './words';

// Science Chapter 2 "What Affects Motion?", Part I of the study guide for the Friday test:
// motion, reference point, force (push or pull), gravity, relative motion, the four kinds of motion,
// size and direction of a force, what a force does, balanced and unbalanced forces (3-PS2-1, 4-PS3-3)

type Idea = { key: string; q: L10n; right: L10n; wrong: L10n[]; why: L10n; hint: L10n };

const KIDS: Person[] = [
    { en: 'Ameliia', ru: 'Амелия', ruGen: 'Амелии', enShe: 'She', ruShe: 'Она' },
    { en: 'Martin', ru: 'Мартин', ruGen: 'Мартина', enShe: 'He', ruShe: 'Он' },
    ...FRIENDS,
];

const PALS = [
    { en: 'Emma', ru: 'Эмма', ruDat: 'Эмме' }, { en: 'Sofia', ru: 'София', ruDat: 'Софии' }, { en: 'Mia', ru: 'Мия', ruDat: 'Мии' },
    { en: 'Noah', ru: 'Ноа', ruDat: 'Ноа' }, { en: 'Leo', ru: 'Лео', ruDat: 'Лео' }, { en: 'Martin', ru: 'Мартин', ruDat: 'Мартину' },
];

const DEF_HINT = L('Remember the study guide words: motion, reference point, force, gravity, relative motion.', 'Вспомни слова из памятки: движение, точка отсчёта, сила, гравитация, относительное движение.');
const FORCE_HINT = L('A force is a push or a pull. Bigger force, bigger change. Equal forces in opposite directions cancel out.', 'Сила - это толчок или тяга. Больше сила - больше изменение. Равные силы в разные стороны уравновешивают друг друга.');

// [what happens, push or pull]
const PUSH_PULL: [L10n, boolean][] = [
    [L('kicks a soccer ball', 'бьёт ногой по мячу'), true], [L('pulls a wagon with toys', 'тянет тележку с игрушками'), false],
    [L('opens a drawer', 'выдвигает ящик стола'), false], [L('presses the elevator button', 'нажимает кнопку лифта'), true],
    [L('throws a ball to a friend', 'бросает мяч другу'), true], [L('pulls the rope in a tug of war', 'тянет канат в перетягивании'), false],
    [L('pushes a shopping cart', 'толкает тележку в магазине'), true], [L('pulls a weed out of the garden', 'выдёргивает сорняк в огороде'), false],
    [L('closes the door by leaning on it', 'закрывает дверь, налегая на неё'), true], [L('pulls a backpack zipper', 'тянет за молнию рюкзака'), false],
];

// [the moving thing, its kind of motion]: 0 straight line, 1 curved path, 2 back and forth (vibration), 3 rotation
const KINDS: L10n[] = [L('A straight line', 'По прямой'), L('A curved path', 'По кривой линии'), L('Back and forth, a vibration', 'Туда-сюда, вибрация'), L('A rotation, it spins around', 'Вращение, крутится вокруг себя')];
const MOVERS: [L10n, number][] = [
    [L('A bowling ball rolls straight down the lane.', 'Шар для боулинга катится прямо по дорожке.'), 0],
    [L('An elevator goes straight up to the 10th floor.', 'Лифт едет прямо вверх на 10 этаж.'), 0],
    [L('A basketball flies up and drops into the hoop.', 'Баскетбольный мяч летит вверх и падает в корзину.'), 1],
    [L('A kid on a slide that curves around and around.', 'Ребёнок едет с изогнутой горки.'), 1],
    [L('A guitar string after you pluck it.', 'Струна гитары после того, как её дёрнули.'), 2],
    [L('A phone buzzing on the table.', 'Телефон жужжит на столе.'), 2],
    [L('A spinning top on the floor.', 'Юла крутится на полу.'), 3],
    [L('The blades of a ceiling fan.', 'Лопасти потолочного вентилятора.'), 3],
    [L('The wheels of Dad\'s car.', 'Колёса папиной машины.'), 3],
    [L('A train rolls along a straight track.', 'Поезд едет по прямым рельсам.'), 0],
    [L('A sled slides straight down a hill.', 'Санки съезжают прямо вниз с горки.'), 0],
    [L('A soccer ball kicked high up to a friend far away.', 'Футбольный мяч, высоко подброшенный ударом к другу вдалеке.'), 1],
    [L('A paper airplane gliding around in a big arc.', 'Бумажный самолётик, летящий по большой дуге.'), 1],
    [L('A drum skin right after you hit it.', 'Кожа барабана сразу после удара.'), 2],
    [L('A rubber band you pluck like a string.', 'Резинка, которую дёрнули, как струну.'), 2],
    [L('A merry-go-round at the playground.', 'Карусель на детской площадке.'), 3],
    [L('The Earth turning around once every day.', 'Земля, которая поворачивается вокруг себя раз в сутки.'), 3],
];

// a thing that moves past a still place: Russian needs the verb and the place after "мимо"
type Pass = { en: string; ru: string; verb: string; placeEn: string; placeRu: string; placeRuGen: string };
const PASSES: Pass[] = [
    { en: 'a school bus', ru: 'школьный автобус', verb: 'проезжает', placeEn: 'the school', placeRu: 'школа', placeRuGen: 'школы' },
    { en: 'a train', ru: 'поезд', verb: 'проезжает', placeEn: 'the station', placeRu: 'станция', placeRuGen: 'станции' },
    { en: 'a bike rider', ru: 'велосипедист', verb: 'проезжает', placeEn: 'a big tree', placeRu: 'большое дерево', placeRuGen: 'большого дерева' },
    { en: 'a boat', ru: 'лодка', verb: 'проплывает', placeEn: 'the dock', placeRu: 'причал', placeRuGen: 'причала' },
];
// ru: who it is; dat: "по нему"; acc: "на него"
type Thing = { en: string; ru: string; dat: string; acc: string };
const SLIDERS: Thing[] = [
    { en: 'soccer ball', ru: 'футбольный мяч', dat: 'по нему', acc: 'на него' },
    { en: 'hockey puck', ru: 'хоккейная шайба', dat: 'по ней', acc: 'на неё' },
    { en: 'toy car', ru: 'машинка', dat: 'по ней', acc: 'на неё' },
];
const cap = (x: string) => x[0].toUpperCase() + x.slice(1);

const ideas = (rng: Rng): Idea[] => {
    const kid = pick(rng, KIDS);
    // a friend to push against, never the same person; ruDat: "к Эмме"
    const pal = pick(rng, PALS.filter(x => x.en !== kid.en));
    const [act, push] = pick(rng, PUSH_PULL);
    const [mover, kind] = pick(rng, MOVERS);
    const dropped = pick(rng, [L('an apple', 'яблоко'), L('a pencil', 'карандаш'), L('a ball', 'мяч'), L('a leaf', 'лист')]);
    const pass = pick(rng, PASSES);
    // [where she sits, where the person outside stands]
    const ride = pick(rng, [[L('on a train', 'в поезде'), L('on the platform', 'на платформе')], [L('on a bus', 'в автобусе'), L('at the bus stop', 'на остановке')], [L('in a car', 'в машине'), L('on the sidewalk', 'на тротуаре')]]);
    const thing = pick(rng, SLIDERS);
    const dir = pick(rng, [L('left', 'влево'), L('right', 'вправо'), L('east', 'на восток'), L('north', 'на север')]);
    return [
        { key: 'motion', q: L('In science, what is motion?', 'Что такое движение в науке?'),
            right: L('A change in position of an object', 'Изменение положения предмета'),
            wrong: [L('Any push or pull', 'Любой толчок или тяга'), L('How heavy an object is', 'Насколько тяжёлый предмет'), L('A place used to see if something moves', 'Место, по которому видно, движется ли что-то')],
            why: L('Motion is a change in position of an object.', 'Движение - это изменение положения предмета.'), hint: DEF_HINT },
        { key: 'force', q: L('What is a force?', 'Что такое сила?'),
            right: L('Any push or pull', 'Любой толчок или тяга'),
            wrong: [L('A change in position', 'Изменение положения'), L('How fast something goes', 'Как быстро что-то движется'), L('Only the pull of the Earth', 'Только притяжение Земли')],
            why: L('A force is any push or pull. Gravity is one kind of force, but not the only one.', 'Сила - это любой толчок или тяга. Гравитация - один из видов силы, но не единственный.'), hint: DEF_HINT },
        { key: `ref-${pass.en}`, q: L(`${kid.en} watches ${pass.en} move past ${pass.placeEn}. What is the best reference point to tell that it is moving?`, `${kid.ru} смотрит, как ${pass.ru} ${pass.verb} мимо ${pass.placeRuGen}. Что лучше всего взять точкой отсчёта, чтобы понять, что это движение?`),
            right: L(`${cap(pass.placeEn)}, because it stays in one place`, `${cap(pass.placeRu)}, потому что стоит на месте`),
            wrong: [L('A cloud, because it is high up', 'Облако, потому что оно высоко'), L('Another moving car', 'Другую едущую машину'), L('Nothing, you cannot tell', 'Ничего, понять нельзя')],
            why: L('A reference point is a place or object used to tell if something is moving. Pick something that stays still.', 'Точка отсчёта - это место или предмет, по которому понятно, движется ли что-то. Выбирай то, что стоит на месте.'), hint: DEF_HINT },
        { key: `pp-${act.en}`, q: L(`${kid.en} ${act.en}. Is that a push or a pull?`, `${kid.ru} ${act.ru}. Это толчок или тяга?`),
            right: push ? L('A push: the object moves away', 'Толчок: предмет отодвигается') : L('A pull: the object moves closer', 'Тяга: предмет приближается'),
            wrong: [push ? L('A pull: the object moves closer', 'Тяга: предмет приближается') : L('A push: the object moves away', 'Толчок: предмет отодвигается'), L('Not a force at all', 'Это вообще не сила'), L('Gravity', 'Гравитация')],
            why: L('A push moves something away from you, a pull moves it toward you. Both are forces.', 'Толчок двигает предмет от тебя, тяга - к тебе. И то, и другое - силы.'), hint: FORCE_HINT },
        { key: `grav-${dropped.en}`, q: L(`${kid.en} lets go of ${dropped.en} and it falls to the ground. Which force pulls it down?`, `${kid.ru} отпускает ${dropped.ru} - и ${dropped.ru} падает на землю. Какая сила тянет вниз?`),
            right: L('Gravity', 'Гравитация'),
            wrong: [L('A push from the air', 'Толчок воздуха'), L('Relative motion', 'Относительное движение'), L('No force, things just fall', 'Никакая, предметы просто падают')],
            why: L('Gravity is the force that pulls all objects toward each other. The Earth pulls everything down toward it.', 'Гравитация - это сила, которая притягивает все предметы друг к другу. Земля тянет всё вниз, к себе.'), hint: DEF_HINT },
        { key: `rel-${ride[0].en}`, q: L(`${kid.en} sits ${ride[0].en} next to Mom. To ${kid.en}, Mom looks still. To a person standing ${ride[1].en}, both are moving. What is this called?`, `${kid.ru} сидит ${ride[0].ru} рядом с мамой. Для ${kid.ruGen} мама неподвижна. А для человека ${ride[1].ru} движутся оба: и ${kid.ru}, и мама. Как это называется?`),
            right: L('Relative motion', 'Относительное движение'),
            wrong: [L('Balanced forces', 'Уравновешенные силы'), L('Gravity', 'Гравитация'), L('Vibration', 'Вибрация')],
            why: L('Relative motion is the change of one object\'s position compared with another object\'s position. It depends on what you compare with.', 'Относительное движение - это изменение положения одного предмета по сравнению с другим. Оно зависит от того, с чем сравниваешь.'), hint: DEF_HINT },
        { key: `kind-${kind}-${mover.en}`, q: L(`${mover.en} How does it move?`, `${mover.ru} Как он движется?`),
            right: KINDS[kind], wrong: KINDS.filter((_, i) => i !== kind),
            why: L('Objects move in a straight line, in a curved path, back and forth as a vibration, or as a rotation.', 'Предметы движутся по прямой, по кривой, туда-сюда (вибрация) или вращаются.'),
            hint: L('Picture it: does it go straight, along a curve, shake back and forth, or spin around?', 'Представь: едет прямо, по дуге, дрожит туда-сюда или крутится?') },
        { key: `size-dir-${kid.en}-${dir.en}`, q: L(`${kid.en} gives a toy box a gentle push to the ${dir.en}. Which two things describe this force?`, `${kid.ru} слегка толкает коробку с игрушками ${dir.ru}. Какие две вещи описывают эту силу?`),
            right: L(`How strong it is (its size) and which way it goes (its direction: ${dir.en})`, `Насколько она сильная (величина) и куда направлена (направление: ${dir.ru})`),
            wrong: [L('Its color and its name', 'Цвет и название'), L('Only how fast the box is', 'Только скорость коробки'), L('Only the size of the box', 'Только размер коробки')],
            why: L('All forces have size and direction: a gentle push is a small force, and it points the way the box is pushed.', 'У всех сил есть величина и направление: лёгкий толчок - это маленькая сила, и она направлена туда, куда толкают коробку.'), hint: FORCE_HINT },
        { key: `walk-${kid.en}`, q: L(`${kid.en} walks from the door to the window. In science words, what happened?`, `${kid.ru} идёт от двери к окну. Как это назвать по-научному?`),
            right: L('Motion: a change in position', 'Движение: изменение положения'),
            wrong: [L('Gravity: a pull toward the Earth', 'Гравитация: притяжение к Земле'), L('Balanced forces', 'Уравновешенные силы'), L('A vibration', 'Вибрация')],
            why: L('Motion is a change in position of an object. The door and the window are reference points that stay still.', 'Движение - это изменение положения предмета. Дверь и окно - точки отсчёта, они стоят на месте.'), hint: DEF_HINT },
        { key: 'size-dir', q: L('Every force has two things. Which two?', 'У каждой силы есть две вещи. Какие?'),
            right: L('A size and a direction', 'Величина и направление'),
            wrong: [L('A color and a size', 'Цвет и величина'), L('A speed and a name', 'Скорость и название'), L('Only a direction', 'Только направление')],
            why: L('All forces have size (how strong) and direction (which way).', 'У всех сил есть величина (насколько сильно) и направление (куда).'), hint: FORCE_HINT },
        { key: `start-${thing.en}`, q: L(`A ${thing.en} is standing still. ${kid.en} hits it toward the east. Which way does it start to move?`, `${cap(thing.ru)} стоит на месте. ${kid.ru} бьёт ${thing.dat} в сторону востока. Куда предмет начнёт двигаться?`),
            right: L('East, in the direction of the force', 'На восток, в направлении силы'),
            wrong: [L('West, the opposite way', 'На запад, в обратную сторону'), L('It does not move', 'Никуда, он не сдвинется'), L('Straight up', 'Прямо вверх')],
            why: L('A force can make an object that is standing still start to move in the direction of the force.', 'Сила может сдвинуть неподвижный предмет, и он начнёт двигаться в направлении силы.'), hint: FORCE_HINT },
        { key: 'can-do', q: L('A ball is already rolling. What can a force do to it?', 'Мяч уже катится. Что с ним может сделать сила?'),
            right: L('Make it go faster, slow down, stop or change direction', 'Ускорить, замедлить, остановить или изменить направление'),
            wrong: [L('Only make it go faster', 'Только ускорить'), L('Nothing, a moving ball cannot be changed', 'Ничего, катящийся мяч изменить нельзя'), L('Only stop it', 'Только остановить')],
            why: L('A force can make a moving object move faster, slow down, stop, or change direction.', 'Сила может заставить движущийся предмет ехать быстрее, медленнее, остановиться или повернуть.'), hint: FORCE_HINT },
        { key: `amount-${kid.en}`, q: L(`${kid.en} kicks the same soccer ball twice: once softly, once hard. Which kick changes the ball's speed more?`, `${kid.ru} два раза бьёт по одному и тому же мячу: один раз слабо, другой - сильно. Какой удар сильнее меняет скорость мяча?`),
            right: L('The hard kick: a bigger force makes a bigger change', 'Сильный удар: большая сила даёт большее изменение'),
            wrong: [L('The soft kick', 'Слабый удар'), L('Both change it the same', 'Оба одинаково'), L('Neither, kicks are not forces', 'Ни один, удар - это не сила')],
            why: L('The amount of force acting on an object affects how the object changes speed, direction or both.', 'От величины силы зависит, насколько предмет изменит скорость, направление или и то, и другое.'), hint: FORCE_HINT },
        { key: 'tug-equal', q: L('Two teams pull a rope in a tug of war. Both pull with the same force in opposite directions. What happens to the rope?', 'Две команды тянут канат в разные стороны с одинаковой силой. Что происходит с канатом?'),
            right: L('It stays still: the forces are balanced', 'Стоит на месте: силы уравновешены'),
            wrong: [L('It moves toward the left team', 'Движется к левой команде'), L('It moves faster and faster', 'Движется всё быстрее'), L('It falls down because of gravity', 'Падает из-за гравитации')],
            why: L('Two forces equal in size but in opposite directions are balanced forces. A still object stays still.', 'Две равные силы в противоположных направлениях - это уравновешенные силы. Неподвижный предмет остаётся неподвижным.'), hint: FORCE_HINT },
        { key: 'tug-unequal', q: L('In a tug of war the red team pulls harder than the blue team. What happens?', 'В перетягивании каната красная команда тянет сильнее синей. Что происходит?'),
            right: L('The rope moves toward the red team: the forces are unbalanced', 'Канат движется к красной команде: силы не уравновешены'),
            wrong: [L('The rope stays still', 'Канат стоит на месте'), L('The rope moves toward the blue team', 'Канат движется к синей команде'), L('The forces are balanced', 'Силы уравновешены')],
            why: L('When forces are not equal, the object moves in the direction of the bigger force.', 'Если силы не равны, предмет движется в сторону большей силы.'), hint: FORCE_HINT },
        { key: `moving-balanced-${thing.en}`, q: L(`A ${thing.en} slides on smooth ice, and the forces on it are balanced. What does it do?`, `${cap(thing.ru)} скользит по гладкому льду, и силы, которые действуют ${thing.acc}, уравновешены. Что происходит?`),
            right: L('It keeps moving at the same speed in the same direction', 'Продолжает двигаться с той же скоростью в том же направлении'),
            wrong: [L('It stops right away', 'Сразу останавливается'), L('It speeds up', 'Разгоняется'), L('It turns around', 'Разворачивается')],
            why: L('With balanced forces a moving object continues to move at the same speed and in the same direction.', 'При уравновешенных силах движущийся предмет продолжает двигаться с той же скоростью и в том же направлении.'), hint: FORCE_HINT },
        { key: `push-box-${kid.en}-${pal.en}`, q: L(`${kid.en} and ${pal.en} push a big box from opposite sides, both just as hard. What happens to the box?`, `${kid.ru} и ${pal.ru} толкают большую коробку с двух сторон, одинаково сильно. Что происходит с коробкой?`),
            right: L('It does not move: the forces are balanced', 'Не двигается: силы уравновешены'),
            wrong: [L(`It moves toward ${pal.en}`, `Движется к ${pal.ruDat}`), L('It flies up', 'Взлетает вверх'), L('It speeds up', 'Разгоняется')],
            why: L('Equal pushes in opposite directions are balanced forces: a still box stays still.', 'Равные толчки в противоположные стороны - уравновешенные силы: неподвижная коробка остаётся на месте.'), hint: FORCE_HINT },
        { key: 'book', q: L('A book lies on a table. Gravity pulls it down and the table pushes it up just as hard. What are these forces?', 'Книга лежит на столе. Гравитация тянет её вниз, а стол так же сильно толкает вверх. Какие это силы?'),
            right: L('Balanced forces, so the book stays still', 'Уравновешенные силы, поэтому книга лежит на месте'),
            wrong: [L('Unbalanced forces, so the book moves', 'Неуравновешенные силы, поэтому книга движется'), L('There are no forces on a book', 'На книгу не действуют силы'), L('Relative motion', 'Относительное движение')],
            why: L('Equal forces in opposite directions are balanced: the book does not move.', 'Равные силы в противоположных направлениях уравновешены: книга не двигается.'), hint: FORCE_HINT },
        { key: 'parked', q: L(`Dad's car is parked in front of the house all day. Compared with the house, is the car in motion?`, `Папина машина весь день стоит перед домом. По сравнению с домом машина движется?`),
            right: L('No: its position does not change compared with the house', 'Нет: её положение относительно дома не меняется'),
            wrong: [L('Yes: cars are always in motion', 'Да: машины всегда движутся'), L('Yes: gravity pulls it', 'Да: её тянет гравитация'), L('Only when it is windy', 'Только когда дует ветер')],
            why: L('Motion is a change in position. The house is the reference point, and the car stays in the same place next to it.', 'Движение - это изменение положения. Дом - точка отсчёта, а машина остаётся на том же месте рядом с ним.'), hint: DEF_HINT },
    ];
};

// the study guide line each idea belongs to: forces:tug-equal:... -> balanced
const KIND_OF_KEY: [RegExp, string][] = [
    [/^(motion|parked|walk-)/, 'motion'], [/^ref-/, 'reference'], [/^(force|pp-)/, 'force'], [/^grav-/, 'gravity'], [/^rel-/, 'relative'],
    [/^kind-/, 'kinds'], [/^size-dir/, 'size-direction'], [/^(start-|can-do|amount-)/, 'effects'], [/^(tug-|moving-balanced|book|push-box-)/, 'balanced'],
];
export const forceKind = (id: string) => KIND_OF_KEY.find(([re]) => re.test(id.replace(/^forces:/, '')))?.[1] ?? 'other';

export const makeForces = (rng: Rng, want?: string): Problem => {
    const all = ideas(rng);
    const fits = all.map((x, i) => (forceKind(x.key) === want ? i : -1)).filter(i => i >= 0);
    const k = fits.length ? pick(rng, fits) : int(rng, 0, all.length - 1), it = all[k];
    return {
        id: `forces:${it.key}:${it.q.en}`, skill: 'forces', topic: 'science',
        prompt: it.q,
        answer: choice(rng, it.right, it.wrong),
        steps: [it.why],
        hint: it.hint,
        data: { idea: k },
    };
};
