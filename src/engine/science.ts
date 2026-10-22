import {
    type Answer, type FillLine, type L10n, type Leg, type Problem, type Rng, type SkillId, type Unit,
    L, choice, dist, fmt, hours, int, minutes, pick, ruPlural, speedShort, speedUnit,
} from './core';
import { AMELIIA, FLORIDA, HOUSEHOLD, type Person } from './words';

type Vehicle = { id: string; en: string; ru: string; ruBy: string; icon: string; mi: [number, number]; km: [number, number] };

// realistic average speeds per unit [min, max]; NJ Transit and Amtrak trains here stay below 100 mph / 160 km/h
export const VEHICLES: Vehicle[] = [
    { id: 'walk', en: 'walking', ru: 'пешком', ruBy: 'пешком', icon: '🚶', mi: [2, 4], km: [3, 6] },
    { id: 'bike', en: 'bike', ru: 'велосипед', ruBy: 'на велосипеде', icon: '🚲', mi: [6, 15], km: [10, 24] },
    { id: 'bus', en: 'bus', ru: 'автобус', ruBy: 'на автобусе', icon: '🚌', mi: [20, 45], km: [30, 70] },
    { id: 'car', en: 'car', ru: 'машина', ruBy: 'на машине', icon: '🚗', mi: [30, 65], km: [48, 105] },
    { id: 'train', en: 'train', ru: 'поезд', ruBy: 'на поезде', icon: '🚆', mi: [50, 80], km: [80, 130] },
    // Italian high-speed trains really average 120-250 km/h
    { id: 'fast', en: 'fast train', ru: 'скоростной поезд', ruBy: 'на скоростном поезде', icon: '🚄', mi: [75, 155], km: [120, 250] },
];
const V = (id: string) => VEHICLES.find(v => v.id === id) ?? VEHICLES[3];
const inRange = (v: Vehicle, unit: Unit, s: number) => s >= v[unit][0] && s <= v[unit][1];

type Place = { en: string; ru: string; ruGen: string };
const P = (en: string, ru: string, ruGen: string): Place => ({ en, ru, ruGen });

// Approximate real road distances from Fort Lee, rounded to friendly numbers (km kept separately so both divide nicely)
type Route = { to: Place; mi: number; km: number; modes: string[] };
export const ROUTES: Route[] = [
    { to: P('Englewood', 'Энглвуд', 'Энглвуда'), mi: 3, km: 5, modes: ['walk'] },
    { to: P('Hackensack', 'Хакенсак', 'Хакенсака'), mi: 8, km: 12, modes: ['bike'] },
    { to: P('Paramus', 'Парамус', 'Парамуса'), mi: 10, km: 15, modes: ['bike'] },
    { to: P('Hoboken', 'Хобокен', 'Хобокена'), mi: 10, km: 16, modes: ['bike'] },
    { to: P('Newark Airport', 'аэропорт Ньюарк', 'аэропорта Ньюарк'), mi: 25, km: 40, modes: ['bus'] },
    { to: P('Morristown', 'Морристаун', 'Морристауна'), mi: 30, km: 48, modes: ['car', 'bus'] },
    { to: P('New Brunswick', 'Нью-Брансуик', 'Нью-Брансуика'), mi: 40, km: 64, modes: ['car', 'bus'] },
    { to: P('Princeton', 'Принстон', 'Принстона'), mi: 60, km: 96, modes: ['car', 'bus'] },
    { to: P('Trenton', 'Трентон', 'Трентона'), mi: 70, km: 112, modes: ['car', 'train'] },
    { to: P('Philadelphia', 'Филадельфия', 'Филадельфии'), mi: 100, km: 160, modes: ['car', 'train'] },
    { to: P('Atlantic City', 'Атлантик-Сити', 'Атлантик-Сити'), mi: 130, km: 210, modes: ['car'] },
    { to: P('Cape May', 'Кейп-Мэй', 'Кейп-Мэй'), mi: 160, km: 260, modes: ['car'] },
    { to: P('Boston', 'Бостон', 'Бостона'), mi: 210, km: 340, modes: ['car', 'train'] },
    { to: P('Washington, DC', 'Вашингтон', 'Вашингтона'), mi: 240, km: 390, modes: ['car', 'train'] },
];
const FORT_LEE = P('home in Fort Lee', 'дом в Форт-Ли', 'дома в Форт-Ли');

// Real chains of towns with approximate distances between neighbours, used for trips with several parts
type Chain = { stops: Place[]; mi: number[]; km: number[] };
export const CHAINS: Chain[] = [
    {
        stops: [P('Fort Lee', 'Форт-Ли', 'Форт-Ли'), P('Newark Airport', 'аэропорт Ньюарк', 'аэропорта Ньюарк'), P('New Brunswick', 'Нью-Брансуик', 'Нью-Брансуика'),
            P('Princeton', 'Принстон', 'Принстона'), P('Trenton', 'Трентон', 'Трентона'), P('Philadelphia', 'Филадельфия', 'Филадельфии'),
            P('Atlantic City', 'Атлантик-Сити', 'Атлантик-Сити'), P('Cape May', 'Кейп-Мэй', 'Кейп-Мэй')],
        mi: [25, 25, 15, 12, 30, 60, 45],
        km: [40, 40, 24, 20, 48, 96, 72],
    },
    {
        stops: [P('Rome', 'Рим', 'Рима'), P('Florence', 'Флоренция', 'Флоренции'), P('Venice', 'Венеция', 'Венеции'), P('Milan', 'Милан', 'Милана')],
        mi: [170, 160, 150],
        km: [280, 260, 240],
    },
];

const unitOf = (rng: Rng): Unit => (rng() < 0.65 ? 'mi' : 'km');

// every (vehicle, hours) that gives a whole, realistic speed for this distance
const options = (d: number, unit: Unit, modes: string[]) => {
    const out: { v: Vehicle; t: number; s: number }[] = [];
    for (const m of modes) for (let t = 1; t <= 6; t++) if (d % t === 0 && inRange(V(m), unit, d / t)) out.push({ v: V(m), t, s: d / t });
    return out;
};

const travels = (who: Person, v: Vehicle): L10n => v.id === 'walk'
    ? L(`${who.en} walks`, `${who.ru} идёт пешком`)
    : v.id === 'bike' ? L(`${who.en} rides a bike`, `${who.ru} едет на велосипеде`)
        : L(`${who.en} goes by ${v.en}`, `${who.ru} едет ${v.ruBy}`);

const formula = L('Average speed = distance ÷ time.', 'Средняя скорость = расстояние ÷ время.');
const milesOrKm = (unit: Unit) => (unit === 'mi' ? L('miles', 'милях') : L('kilometers', 'километрах'));

// ---------- the family trip to Florida: a long drive or a short flight over the same distance ----------

const makeFlorida = (rng: Rng): Problem => {
    // approximate real driving distances from Fort Lee; nonstop flights from Newark take 2-3 hours
    const trip = pick(rng, [
        { city: FLORIDA[0], d: 1080, tCar: 18, tPlane: [2, 3] },
        { city: FLORIDA[2], d: 1140, tCar: 19, tPlane: [2, 3] },
        { city: FLORIDA[1], d: 1260, tCar: 21, tPlane: [3] },
    ]);
    const city = trip.city, d = trip.d, tCar = trip.tCar, car = d / tCar;
    const tPlane = pick(rng, trip.tPlane), plane = d / tPlane;
    const ask = pick(rng, ['plane', 'car', 'times'] as const);
    const value = ask === 'plane' ? plane : ask === 'car' ? car : tCar - tPlane;
    const q = ask === 'plane' ? L('What is the average speed of the plane in miles per hour?', 'Какая средняя скорость самолёта в милях в час?')
        : ask === 'car' ? L('What is the average speed of the car in miles per hour?', 'Какая средняя скорость машины в милях в час?')
            : L('How many hours faster is the flight?', 'На сколько часов быстрее перелёт?');
    return {
        id: `speed-basic:fl:${d}:${tCar}:${tPlane}:${ask}`, skill: 'speed-basic', topic: 'science',
        prompt: L(
            `${AMELIIA.en}'s family is going to ${city.en}, Florida! It is about ${dist(d, 'mi').en} from Fort Lee. Driving takes ${hours(tCar).en}, flying takes ${hours(tPlane).en}. ${q.en}`,
            `Семья ${AMELIIA.ruGen} едет во Флориду, в ${city.ru}! Это примерно ${dist(d, 'mi').ru} от Форт-Ли. На машине ехать ${hours(tCar).ru}, на самолёте лететь ${hours(tPlane).ru}. ${q.ru}`),
        answer: { kind: 'number', value },
        steps: ask === 'times'
            ? [L(`${tCar} − ${tPlane} = ${tCar - tPlane}, so the flight is ${hours(tCar - tPlane).en} faster.`, `${tCar} − ${tPlane} = ${tCar - tPlane}, значит перелёт быстрее на ${hours(tCar - tPlane).ru}.`)]
            : [formula,
                L(`Car: ${fmt(d, 'en')} ÷ ${tCar} = ${car} mph.`, `Машина: ${fmt(d, 'ru')} ÷ ${tCar} = ${car} миль/ч.`),
                L(`Plane: ${fmt(d, 'en')} ÷ ${tPlane} = ${plane} mph.`, `Самолёт: ${fmt(d, 'ru')} ÷ ${tPlane} = ${plane} миль/ч.`),
                L('Same distance, much less time: the plane is much faster.', 'Расстояние то же, а времени гораздо меньше: самолёт намного быстрее.')],
        hint: ask === 'times' ? L('Subtract the hours.', 'Вычти часы.') : L('Divide the distance by the hours.', 'Раздели расстояние на часы.'),
        visual: { kind: 'trip', unit: 'mi', legs: [{ from: 'Fort Lee', to: city.en, distance: d, time: tCar, speed: car, vehicle: '🚗' }, { from: 'Fort Lee', to: city.en, distance: d, time: tPlane, speed: plane, vehicle: '✈️' }] },
        data: { distance: d, tCar, tPlane, car, plane, ask, value },
    };
};

// ---------- the same road by car and by train (the owner's example) ----------

const makeCarTrain = (rng: Rng): Problem | null => {
    const unit = unitOf(rng);
    const pairs: { r: Route; car: { t: number; s: number }; train: { t: number; s: number } }[] = [];
    for (const r of ROUTES.filter(x => x.modes.includes('car') && x.modes.includes('train'))) {
        const d = r[unit];
        const cars = options(d, unit, ['car']), trains = options(d, unit, ['train']);
        for (const c of cars) for (const tr of trains) if (tr.t < c.t) pairs.push({ r, car: c, train: tr });
    }
    if (!pairs.length) return null;
    const { r, car, train } = pick(rng, pairs);
    const d = r[unit];
    const ask = pick(rng, ['car', 'train', 'diff'] as const);
    const question = ask === 'car' ? L('What is the average speed of the car?', 'Какая средняя скорость машины?')
        : ask === 'train' ? L('What is the average speed of the train?', 'Какая средняя скорость поезда?')
            : L(`How much faster is the train than the car (in ${speedUnit(unit).en})?`, `На сколько поезд быстрее машины (в ${milesOrKm(unit).ru} в час)?`);
    const value = ask === 'car' ? car.s : ask === 'train' ? train.s : train.s - car.s;
    const steps: L10n[] = [
        formula,
        L(`Car: ${fmt(d, 'en')} ÷ ${car.t} = ${fmt(car.s, 'en')}, so ${speedShort(car.s, unit).en}.`, `Машина: ${fmt(d, 'ru')} ÷ ${car.t} = ${fmt(car.s, 'ru')}, то есть ${speedShort(car.s, unit).ru}.`),
        L(`Train: ${fmt(d, 'en')} ÷ ${train.t} = ${fmt(train.s, 'en')}, so ${speedShort(train.s, unit).en}.`, `Поезд: ${fmt(d, 'ru')} ÷ ${train.t} = ${fmt(train.s, 'ru')}, то есть ${speedShort(train.s, unit).ru}.`),
    ];
    if (ask === 'diff') steps.push(L(`${fmt(train.s, 'en')} − ${fmt(car.s, 'en')} = ${fmt(train.s - car.s, 'en')}.`, `${fmt(train.s, 'ru')} − ${fmt(car.s, 'ru')} = ${fmt(train.s - car.s, 'ru')}.`));
    steps.push(L('Same distance, less time means a faster speed.', 'Расстояние одно и то же: меньше времени - значит, скорость больше.'));
    steps.push(L(`Was the speed constant? No: the car and the train speed up, slow down and stop. ${speedShort(car.s, unit).en} and ${speedShort(train.s, unit).en} are AVERAGE speeds.`,
        `Скорость была постоянной? Нет: машина и поезд разгоняются, тормозят и останавливаются. ${speedShort(car.s, unit).ru} и ${speedShort(train.s, unit).ru} - это СРЕДНИЕ скорости.`));
    return {
        id: `speed-basic:ct:${r.to.en}:${car.t}:${train.t}:${ask}:${unit}`, skill: 'speed-basic', topic: 'science',
        prompt: L(
            `From Fort Lee to ${r.to.en} is about ${dist(d, unit).en}. By car the trip takes ${hours(car.t).en}, by train ${hours(train.t).en}. ${question.en}`,
            `От Форт-Ли до ${r.to.ruGen} примерно ${dist(d, unit).ru}. На машине дорога занимает ${hours(car.t).ru}, на поезде - ${hours(train.t).ru}. ${question.ru}`),
        answer: { kind: 'number', value },
        steps,
        hint: L(`Divide the distance by the time for each one: ${fmt(d, 'en')} ÷ ${car.t} and ${fmt(d, 'en')} ÷ ${train.t}.`, `Раздели расстояние на время для каждого: ${fmt(d, 'ru')} ÷ ${car.t} и ${fmt(d, 'ru')} ÷ ${train.t}.`),
        visual: { kind: 'trip', unit, legs: [{ from: 'Fort Lee', to: r.to.en, distance: d, time: car.t, speed: car.s, vehicle: '🚗' }, { from: 'Fort Lee', to: r.to.en, distance: d, time: train.t, speed: train.s, vehicle: '🚆' }] },
        data: { distance: d, tCar: car.t, tTrain: train.t, car: car.s, train: train.s, ask, value },
    };
};

const makeBasic = (rng: Rng): Problem => {
    if (rng() < 0.2) return makeFlorida(rng);
    if (rng() < 0.45) { const p = makeCarTrain(rng); if (p) return p; }
    const unit = unitOf(rng);
    const all = ROUTES.flatMap(r => options(r[unit], unit, r.modes).map(o => ({ r, ...o })));
    const { r, v, t, s } = pick(rng, all);
    const d = r[unit];
    const who = pick(rng, HOUSEHOLD);
    const back = rng() < 0.3;
    const [a, b] = back ? [r.to, FORT_LEE] : [FORT_LEE, r.to];
    return {
        id: `speed-basic:one:${r.to.en}:${v.id}:${t}:${back ? 'b' : 'f'}:${unit}`, skill: 'speed-basic', topic: 'science',
        prompt: L(
            `${travels(who, v).en} from ${a.en} to ${b.en}. That is about ${dist(d, unit).en}, and it takes ${hours(t).en}. What is the average speed in ${speedUnit(unit).en}?`,
            `${travels(who, v).ru} от ${a.ruGen} до ${b.ruGen}. Это примерно ${dist(d, unit).ru}, дорога занимает ${hours(t).ru}. Какая средняя скорость в ${milesOrKm(unit).ru} в час?`),
        answer: { kind: 'number', value: s },
        steps: [formula,
            L(`${fmt(d, 'en')} ÷ ${t} = ${fmt(s, 'en')}, so the average speed is ${speedShort(s, unit).en}.`, `${fmt(d, 'ru')} ÷ ${t} = ${fmt(s, 'ru')}, значит средняя скорость ${speedShort(s, unit).ru}.`),
            L(`Check: ${fmt(s, 'en')} × ${t} = ${fmt(d, 'en')} ✓`, `Проверка: ${fmt(s, 'ru')} × ${t} = ${fmt(d, 'ru')} ✓`)],
        hint: t === 1
            ? L('The whole trip takes exactly one hour. How far is it?', 'Вся дорога занимает ровно один час. Какое расстояние?')
            : L(`How far in ONE hour? Split ${fmt(d, 'en')} into ${t} equal parts, one for each hour.`, `Сколько за ОДИН час? Раздели ${fmt(d, 'ru')} на ${t} равные части, по одной на каждый час.`),
        visual: { kind: 'trip', unit, legs: [{ from: a.en, to: b.en, distance: d, time: t, speed: s, vehicle: v.icon }] },
        data: { distance: d, time: t, speed: s, value: s },
    };
};

// ---------- distance = speed × time, time = distance ÷ speed ----------

const makeFind = (rng: Rng): Problem => {
    const unit = unitOf(rng);
    const all = ROUTES.flatMap(r => options(r[unit], unit, r.modes).filter(o => o.t >= 2).map(o => ({ r, ...o })));
    const { r, v, t, s } = pick(rng, all);
    const d = r[unit];
    const who = pick(rng, HOUSEHOLD);
    if (rng() < 0.5) {
        return {
            id: `speed-find:d:${r.to.en}:${v.id}:${t}:${unit}`, skill: 'speed-find', topic: 'science',
            prompt: L(`${travels(who, v).en} from Fort Lee to ${r.to.en} at an average speed of ${speedShort(s, unit).en}. The trip takes ${hours(t).en}. How many ${unit === 'mi' ? 'miles' : 'kilometers'} is it?`,
                `${travels(who, v).ru} из Форт-Ли до ${r.to.ruGen} со средней скоростью ${speedShort(s, unit).ru}. Дорога занимает ${hours(t).ru}. Сколько это ${unit === 'mi' ? 'миль' : 'километров'}?`),
            answer: { kind: 'number', value: d },
            steps: [L('Distance = speed × time.', 'Расстояние = скорость × время.'),
                L(`${fmt(s, 'en')} × ${t} = ${fmt(d, 'en')}, so ${dist(d, unit).en}.`, `${fmt(s, 'ru')} × ${t} = ${fmt(d, 'ru')}, то есть ${dist(d, unit).ru}.`)],
            hint: L(`Each hour adds another ${fmt(s, 'en')}. Add it ${t} times, or multiply.`, `Каждый час добавляет ещё ${fmt(s, 'ru')}. Прибавь это ${t} ${ruPlural(t, 'раз', 'раза', 'раз')} или умножь.`),
            data: { speed: s, time: t, distance: d, value: d },
        };
    }
    return {
        id: `speed-find:t:${r.to.en}:${v.id}:${t}:${unit}`, skill: 'speed-find', topic: 'science',
        prompt: L(`${travels(who, v).en} from Fort Lee to ${r.to.en}, about ${dist(d, unit).en}, at an average speed of ${speedShort(s, unit).en}. How many hours does the trip take?`,
            `${travels(who, v).ru} из Форт-Ли до ${r.to.ruGen}, это примерно ${dist(d, unit).ru}, со средней скоростью ${speedShort(s, unit).ru}. Сколько часов займёт дорога?`),
        answer: { kind: 'number', value: t },
        steps: [L('Time = distance ÷ speed.', 'Время = расстояние ÷ скорость.'),
            L(`${fmt(d, 'en')} ÷ ${fmt(s, 'en')} = ${t}, so ${hours(t).en}.`, `${fmt(d, 'ru')} ÷ ${fmt(s, 'ru')} = ${t}, то есть ${hours(t).ru}.`),
            L(`Check: ${fmt(s, 'en')} × ${t} = ${fmt(d, 'en')} ✓`, `Проверка: ${fmt(s, 'ru')} × ${t} = ${fmt(d, 'ru')} ✓`)],
        hint: L(`How many times does ${fmt(s, 'en')} fit into ${fmt(d, 'en')}?`, `Сколько раз ${fmt(s, 'ru')} помещается в ${fmt(d, 'ru')}?`),
        data: { speed: s, time: t, distance: d, value: t },
    };
};

// ---------- trips with several parts: A -> B -> C -> D ----------

type LegPick = { from: Place; to: Place; d: number; v: Vehicle; t: number; s: number };

const legLine = (l: LegPick, unit: Unit, i: number, given: 'dt' | 'st'): L10n => given === 'dt'
    ? L(`${i + 1}) ${l.from.en} → ${l.to.en}: ${dist(l.d, unit).en} by ${l.v.en} in ${hours(l.t).en}`,
        `${i + 1}) ${l.from.ru} → ${l.to.ru}: ${dist(l.d, unit).ru} ${l.v.ruBy} за ${hours(l.t).ru}`)
    : L(`${i + 1}) ${l.from.en} → ${l.to.en}: ${hours(l.t).en} by ${l.v.en} at ${speedShort(l.s, unit).en}`,
        `${i + 1}) ${l.from.ru} → ${l.to.ru}: ${hours(l.t).ru} ${l.v.ruBy} со скоростью ${speedShort(l.s, unit).ru}`);

const tripCandidates = (unit: Unit, parts: number) => {
    const all: LegPick[][] = [];
    for (const c of CHAINS) {
        const modes = c.stops[0].en === 'Rome' ? ['fast', 'car'] : ['bike', 'bus', 'car', 'train'];
        for (let start = 0; start + parts <= c.mi.length; start++) {
            // every leg: all realistic (vehicle, hours) choices; bikes only for short legs
            const choices = Array.from({ length: parts }, (_, k) => {
                const d = c[unit][start + k];
                return options(d, unit, modes).filter(o => !(o.v.id === 'train' && d < 40) && !(o.v.id === 'bike' && (d > (unit === 'mi' ? 15 : 24) || [c.stops[start + k].en, c.stops[start + k + 1].en].includes('Newark Airport')))).map(o => ({ from: c.stops[start + k], to: c.stops[start + k + 1], d, ...o }));
            });
            const walk = (k: number, acc: LegPick[]) => {
                if (k === parts) { all.push(acc); return; }
                for (const ch of choices[k]) walk(k + 1, [...acc, ch]);
            };
            walk(0, []);
        }
    }
    return all;
};

const toLegs = (legs: LegPick[]): Leg[] => legs.map(l => ({ from: l.from.en, to: l.to.en, distance: l.d, time: l.t, speed: l.s, vehicle: l.v.icon }));

const makeTrip = (rng: Rng): Problem => {
    const unit = unitOf(rng);
    const parts = int(rng, 2, 3);
    let ask = pick(rng, ['total', 'total', 'leg', 'trap', 'map', 'map'] as const);
    const sum = (legs: LegPick[], f: (l: LegPick) => number) => legs.reduce((s, l) => s + f(l), 0);
    // different times in the parts, otherwise averaging the speeds would accidentally give the right answer
    let pool = tripCandidates(unit, parts).filter(legs => sum(legs, l => l.d) % sum(legs, l => l.t) === 0 && new Set(legs.map(l => l.t)).size > 1);
    if (ask === 'trap') {
        const traps = pool.filter(legs => {
            const mean = sum(legs, l => l.s) / legs.length;
            return new Set(legs.map(l => l.s)).size > 1 && Number.isInteger(mean) && mean !== sum(legs, l => l.d) / sum(legs, l => l.t);
        });
        if (traps.length) pool = traps; else ask = 'total';
    }
    if (!pool.length) pool = tripCandidates(unit, 2).filter(legs => sum(legs, l => l.d) % sum(legs, l => l.t) === 0 && new Set(legs.map(l => l.t)).size > 1);
    const legs = pick(rng, pool);
    const D = sum(legs, l => l.d), T = sum(legs, l => l.t), avg = D / T;
    const given = rng() < 0.5 ? 'dt' : 'st';
    const n = legs.length;
    const intro = legs[0].from.en === 'Rome'
        ? L(`In Italy ${AMELIIA.en}'s family travels to see more of the country with Grandma Olga and Grandpa Valeriy. The trip has ${n} parts:`, `В Италии семья ${AMELIIA.ruGen} путешествует вместе с бабушкой Олей и дедушкой Валерием. В поездке ${n} ${ruPlural(n, 'часть', 'части', 'частей')}:`)
        : L(`${AMELIIA.en}'s family takes a trip with ${n} parts:`, `Путешествие семьи ${AMELIIA.ruGen} состоит из ${n} ${ruPlural(n, 'части', 'частей', 'частей')}:`);
    const findDistances: L10n[] = given === 'st'
        ? legs.map((l, i) => L(`Part ${i + 1}: ${fmt(l.s, 'en')} × ${l.t} = ${fmt(l.d, 'en')}.`, `Часть ${i + 1}: ${fmt(l.s, 'ru')} × ${l.t} = ${fmt(l.d, 'ru')}.`))
        : [];
    const totals: L10n[] = [
        L(`Total distance: ${legs.map(l => fmt(l.d, 'en')).join(' + ')} = ${fmt(D, 'en')}.`, `Всё расстояние: ${legs.map(l => fmt(l.d, 'ru')).join(' + ')} = ${fmt(D, 'ru')}.`),
        L(`Total time: ${legs.map(l => l.t).join(' + ')} = ${T}, so ${hours(T).en}.`, `Всё время: ${legs.map(l => l.t).join(' + ')} = ${T}, то есть ${hours(T).ru}.`),
        L(`Average speed: ${fmt(D, 'en')} ÷ ${T} = ${fmt(avg, 'en')}, so ${speedShort(avg, unit).en}.`, `Средняя скорость: ${fmt(D, 'ru')} ÷ ${T} = ${fmt(avg, 'ru')}, то есть ${speedShort(avg, unit).ru}.`),
    ];
    const key = legs.map(l => `${l.from.en}>${l.to.en}/${l.v.id}/${l.t}`).join('-');
    // the textbook map (Savvas p. 64-65): the speed of every part from point A to point D, then of the whole trip
    if (ask === 'map') {
        const pt = (i: number) => 'ABCD'[i];
        const lines: FillLine[] = [
            ...legs.map((l, i): FillLine => ({ label: L(`Point ${pt(i)} → point ${pt(i + 1)}`, `Точка ${pt(i)} → точка ${pt(i + 1)}`), parts: [`${fmt(l.d, 'en')} ÷ ${l.t} = `, { b: i }] })),
            { label: L('The whole trip: all the distance ÷ all the time', 'Вся поездка: всё расстояние ÷ всё время'),
                parts: [`(${legs.map(l => fmt(l.d, 'en')).join(' + ')}) ÷ (${legs.map(l => l.t).join(' + ')}) = `, { b: n }, ' ÷ ', { b: n + 1 }, ' = ', { b: n + 2 }] },
        ];
        const mean = sum(legs, l => l.s) / n;
        return {
            id: `speed-trip:map:${key}:${unit}`, skill: 'speed-trip', topic: 'science',
            prompt: L(`The map shows the route of ${AMELIIA.en}'s family from point A to point ${pt(n)}:\n${legs.map((l, i) => `Point ${pt(i)} (${l.from.en}) → point ${pt(i + 1)} (${l.to.en}): ${dist(l.d, unit).en} in ${hours(l.t).en}`).join('\n')}\nFind the average speed for each part of the trip, then for the whole trip from point A to point ${pt(n)}.`,
                `На карте маршрут семьи ${AMELIIA.ruGen} от точки A до точки ${pt(n)}:\n${legs.map((l, i) => `Точка ${pt(i)} (${l.from.ru}) → точка ${pt(i + 1)} (${l.to.ru}): ${dist(l.d, unit).ru} за ${hours(l.t).ru}`).join('\n')}\nНайди среднюю скорость каждой части поездки, а потом всей поездки от точки A до точки ${pt(n)}.`),
            answer: { kind: 'fill', layout: 'lines', values: [...legs.map(l => l.s), D, T, avg], lines },
            steps: [formula,
                ...legs.map((l, i) => L(`Point ${pt(i)} → point ${pt(i + 1)}: ${fmt(l.d, 'en')} ÷ ${l.t} = ${fmt(l.s, 'en')}, so ${speedShort(l.s, unit).en}.`, `Точка ${pt(i)} → точка ${pt(i + 1)}: ${fmt(l.d, 'ru')} ÷ ${l.t} = ${fmt(l.s, 'ru')}, то есть ${speedShort(l.s, unit).ru}.`)),
                ...totals,
                ...(mean !== avg ? [L(`Do not add the ${n} speeds and divide by ${n}: the parts take different times, so (${legs.map(l => l.s).join(' + ')}) ÷ ${n} is not the average speed of the trip.`,
                    `Не складывай ${n} скорости и не дели на ${n}: части длятся разное время, поэтому (${legs.map(l => l.s).join(' + ')}) ÷ ${n} - не средняя скорость поездки.`)] : [])],
            hint: L('Each part: its distance ÷ its time. The whole trip: add all the distances, add all the hours, then divide.', 'Каждая часть: её расстояние ÷ её время. Вся поездка: сложи все расстояния, сложи все часы, потом раздели.'),
            visual: { kind: 'trip', unit, legs: toLegs(legs) },
            data: { D, T, avg, mean, value: avg },
        };
    }
    if (ask === 'leg') {
        const k = int(rng, 0, n - 1);
        const l = legs[k];
        const lines = legs.map((x, i) => legLine(x, unit, i, 'dt'));
        return {
            id: `speed-trip:leg:${key}:${k}:${unit}`, skill: 'speed-trip', topic: 'science',
            prompt: L(`${intro.en}\n${lines.map(x => x.en).join('\n')}\nWhat was the average speed in part ${k + 1}?`,
                `${intro.ru}\n${lines.map(x => x.ru).join('\n')}\nКакая была средняя скорость в части ${k + 1}?`),
            answer: { kind: 'number', value: l.s },
            steps: [formula, L(`Part ${k + 1}: ${fmt(l.d, 'en')} ÷ ${l.t} = ${fmt(l.s, 'en')}, so ${speedShort(l.s, unit).en}.`, `Часть ${k + 1}: ${fmt(l.d, 'ru')} ÷ ${l.t} = ${fmt(l.s, 'ru')}, то есть ${speedShort(l.s, unit).ru}.`),
                L('Each part has its own average speed. Only use the numbers of that part.', 'У каждой части своя средняя скорость. Бери числа только этой части.')],
            hint: L(`Look only at part ${k + 1}: divide its distance by its time.`, `Смотри только на часть ${k + 1}: раздели её расстояние на её время.`),
            visual: { kind: 'trip', unit, legs: toLegs(legs) },
            data: { D, T, avg, leg: k, value: l.s },
        };
    }
    if (ask === 'trap') {
        const mean = sum(legs, l => l.s) / n;
        const lines = legs.map((x, i) => legLine(x, unit, i, 'st'));
        const fastest = Math.max(...legs.map(l => l.s));
        const answer: Answer = choice(rng, L(`No. The trip's average speed is ${speedShort(avg, unit).en}`, `Нет. Средняя скорость поездки ${speedShort(avg, unit).ru}`), [
            L(`Yes, it is ${speedShort(mean, unit).en}`, `Да, это ${speedShort(mean, unit).ru}`),
            L(`No. It is ${speedShort(fastest, unit).en}, the fastest part`, `Нет. Это ${speedShort(fastest, unit).ru}, самая быстрая часть`),
            L(`No. It is ${speedShort(D, unit).en}`, `Нет. Это ${speedShort(D, unit).ru}`),
        ]);
        return {
            id: `speed-trip:trap:${key}:${unit}`, skill: 'speed-trip', topic: 'science',
            prompt: L(`${intro.en}\n${lines.map(x => x.en).join('\n')}\nPip the capybara adds the speeds and divides by ${n}: (${legs.map(l => l.s).join(' + ')}) ÷ ${n} = ${fmt(mean, 'en')}. Is that the average speed of the whole trip?`,
                `${intro.ru}\n${lines.map(x => x.ru).join('\n')}\nКапибара Пип складывает скорости и делит на ${n}: (${legs.map(l => l.s).join(' + ')}) ÷ ${n} = ${fmt(mean, 'ru')}. Это средняя скорость всей поездки?`),
            answer,
            steps: [L('The parts take different amounts of time, so we cannot just average the speeds.', 'Части длятся разное время, поэтому скорости просто усреднять нельзя.'),
                ...legs.map((l, i) => L(`Part ${i + 1}: ${fmt(l.s, 'en')} × ${l.t} = ${fmt(l.d, 'en')}.`, `Часть ${i + 1}: ${fmt(l.s, 'ru')} × ${l.t} = ${fmt(l.d, 'ru')}.`)),
                ...totals],
            hint: L('Average speed of a trip = ALL the distance ÷ ALL the time.', 'Средняя скорость поездки = ВСЁ расстояние ÷ ВСЁ время.'),
            visual: { kind: 'trip', unit, legs: toLegs(legs) },
            data: { D, T, avg, mean },
        };
    }
    const lines = legs.map((x, i) => legLine(x, unit, i, given));
    return {
        id: `speed-trip:total:${key}:${given}:${unit}`, skill: 'speed-trip', topic: 'science',
        prompt: L(`${intro.en}\n${lines.map(x => x.en).join('\n')}\nWhat is the average speed for the whole trip?`, `${intro.ru}\n${lines.map(x => x.ru).join('\n')}\nКакая средняя скорость всей поездки?`),
        answer: { kind: 'number', value: avg },
        steps: [L('Average speed of a trip = ALL the distance ÷ ALL the time.', 'Средняя скорость поездки = ВСЁ расстояние ÷ ВСЁ время.'), ...findDistances, ...totals],
        hint: given === 'st'
            ? L('First find each distance: speed × time. Then add the distances and the hours.', 'Сначала найди каждое расстояние: скорость × время. Потом сложи расстояния и часы.')
            : L('Add all the distances, add all the hours, then divide.', 'Сложи все расстояния, сложи все часы, потом раздели.'),
        visual: { kind: 'trip', unit, legs: toLegs(legs) },
        data: { D, T, avg, value: avg },
    };
};

// ---------- hours and minutes, time intervals (4.M.A.1, 4.M.A.2) ----------

const clock = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

// jump to the next full hour, then whole hours, then the rest: 9:45 -> 10:00 -> 11:00 -> 11:15
export const clockJumps = (start: number, end: number): { from: number; to: number; min: number }[] => {
    const jumps: { from: number; to: number; min: number }[] = [];
    let t = start;
    if (t % 60 !== 0 && Math.ceil(t / 60) * 60 <= end) { const next = Math.ceil(t / 60) * 60; jumps.push({ from: t, to: next, min: next - t }); t = next; }
    while (t + 60 <= end) { jumps.push({ from: t, to: t + 60, min: 60 }); t += 60; }
    if (t < end) jumps.push({ from: t, to: end, min: end - t });
    return jumps;
};

const makeUnits = (rng: Rng): Problem => {
    const style = int(rng, 0, 3);
    if (style === 0) {
        const h = int(rng, 1, 4), m = 5 * int(rng, 1, 11), total = h * 60 + m;
        const ctx = pick(rng, [
            L(`The train ride to Grandma Olga and Grandpa Valeriy's town in Italy takes ${hours(h).en} and ${minutes(m).en}.`, `Поездка на поезде в город бабушки Оли и дедушки Валерия в Италии длится ${hours(h).ru} ${minutes(m).ru}.`),
            L(`The drive from Fort Lee to the beach takes ${hours(h).en} and ${minutes(m).en}.`, `Дорога из Форт-Ли до пляжа занимает ${hours(h).ru} ${minutes(m).ru}.`),
            L(`The gymnastics show lasts ${hours(h).en} and ${minutes(m).en}.`, `Выступление по гимнастике длится ${hours(h).ru} ${minutes(m).ru}.`),
        ]);
        return {
            id: `speed-units:hm:${h}:${m}:${ctx.en.length}`, skill: 'speed-units', topic: 'science',
            prompt: L(`${ctx.en} How many minutes is that?`, `${ctx.ru} Сколько это минут?`),
            answer: { kind: 'number', value: total },
            steps: [L('1 hour = 60 minutes.', '1 час = 60 минут.'),
                L(`${h} × 60 = ${h * 60} minutes, then ${h * 60} + ${m} = ${total} minutes.`, `${h} × 60 = ${h * 60} минут, потом ${h * 60} + ${m} = ${total} минут.`)],
            hint: L(`Turn the hours into minutes first: ${h} × 60.`, `Сначала переведи часы в минуты: ${h} × 60.`),
            data: { h, m, value: total },
        };
    }
    if (style === 1) {
        const unit = unitOf(rng);
        const s = unit === 'mi' ? pick(rng, [20, 30, 40]) : pick(rng, [30, 40, 50, 60]);
        return {
            id: `speed-units:half:${s}:${unit}`, skill: 'speed-units', topic: 'science',
            prompt: L(`A bus drives for 30 minutes at ${speedShort(s, unit).en}. How many ${unit === 'mi' ? 'miles' : 'kilometers'} does it go?`,
                `Автобус едет 30 минут со скоростью ${speedShort(s, unit).ru}. Сколько ${unit === 'mi' ? 'миль' : 'километров'} он проедет?`),
            answer: { kind: 'number', value: s / 2 },
            steps: [L('30 minutes is half of an hour.', '30 минут - это половина часа.'),
                L(`In half an hour it goes half as far as in one hour: ${s} ÷ 2 = ${s / 2}.`, `За полчаса он проедет половину того, что за час: ${s} ÷ 2 = ${s / 2}.`)],
            hint: L('How much of an hour is 30 minutes?', 'Какая часть часа - 30 минут?'),
            data: { speed: s, value: s / 2 },
        };
    }
    if (style === 2) {
        const unit = unitOf(rng);
        const [mins, factor] = pick(rng, [[30, 2], [15, 4], [20, 3]] as const);
        // the hourly speed is a realistic bike speed for a 9-year-old, the distance is that speed split into parts
        const speeds = Array.from({ length: 20 }, (_, i) => i + (unit === 'mi' ? 5 : 8)).filter(s => s % factor === 0 && s <= (unit === 'mi' ? 12 : 18));
        const speed = pick(rng, speeds);
        const d = speed / factor;
        return {
            id: `speed-units:per:${d}:${mins}:${unit}`, skill: 'speed-units', topic: 'science',
            prompt: L(`${AMELIIA.en} rides her bike at the same speed all the time and goes ${dist(d, unit).en} in ${mins} minutes. What is her speed in ${speedUnit(unit).en}?`,
                `${AMELIIA.ru} едет на велосипеде с одной и той же скоростью и проезжает ${dist(d, unit).ru} за ${mins} минут. Какая у неё скорость в ${milesOrKm(unit).ru} в час?`),
            answer: { kind: 'number', value: speed },
            steps: [L(`One hour has ${factor} parts of ${mins} minutes (${factor} × ${mins} = 60).`, `В одном часе ${factor} раза по ${mins} минут (${factor} × ${mins} = 60).`),
                L(`So in one hour: ${d} × ${factor} = ${speed}, the speed is ${speedShort(speed, unit).en}.`, `Значит за час: ${d} × ${factor} = ${speed}, скорость ${speedShort(speed, unit).ru}.`)],
            hint: L(`How many ${mins}-minute pieces fit into 60 minutes?`, `Сколько раз по ${mins} минут помещается в 60 минут?`),
            data: { d, mins, factor, value: speed },
        };
    }
    const startH = int(rng, 7, 11), startM = 5 * int(rng, 1, 11);
    const len = 5 * int(rng, 7, 24);
    const start = startH * 60 + startM, end = start + len;
    const jumps = clockJumps(start, end);
    return {
        id: `speed-units:clock:${start}:${len}`, skill: 'speed-units', topic: 'science',
        prompt: L(`Dad's train leaves Hoboken at ${clock(start)} and arrives at ${clock(end)}. How many minutes is the ride?`,
            `Папин поезд отправляется из Хобокена в ${clock(start)} и прибывает в ${clock(end)}. Сколько минут длится поездка?`),
        answer: { kind: 'number', value: len },
        steps: [L('Jump along the clock: first to the next full hour, then by whole hours, then the rest.', 'Прыгаем по часам: сначала до ближайшего целого часа, потом целыми часами, потом остаток.'),
            ...jumps.map(j => L(`${clock(j.from)} → ${clock(j.to)}: ${j.min} minutes`, `${clock(j.from)} → ${clock(j.to)}: ${j.min} ${ruPlural(j.min, 'минута', 'минуты', 'минут')}`)),
            L(`${jumps.map(j => j.min).join(' + ')} = ${len} minutes.`, `${jumps.map(j => j.min).join(' + ')} = ${len} ${ruPlural(len, 'минута', 'минуты', 'минут')}.`)],
        hint: L('Jump to the next full hour first, then add the rest.', 'Сначала допрыгни до ближайшего целого часа, потом прибавь остальное.'),
        data: { start, end, value: len },
    };
};

// ---------- ideas: speed, velocity, acceleration, energy (4-PS3-1, 4-PS3-3) ----------

type Idea = { q: L10n; right: L10n; wrong: L10n[]; why: L10n; hint?: L10n };

const ENERGY_HINT = L('Which one moves faster? The faster it moves, the more energy it has.', 'Кто движется быстрее? Чем быстрее движется предмет, тем больше у него энергии.');

const ideas = (rng: Rng): Idea[] => {
    const unit = unitOf(rng);
    const s = unit === 'mi' ? pick(rng, [40, 45, 50, 55, 60]) : pick(rng, [60, 70, 80, 90]);
    const who = pick(rng, HOUSEHOLD.slice(1));
    const dir = pick(rng, [['north', 'на север'], ['east', 'на восток'], ['south', 'на юг'], ['west', 'на запад']]);
    const route = pick(rng, ROUTES.filter(r => r.modes.includes('car') && r.mi >= 60));
    return [
        {
            q: L(`A train goes ${speedShort(s, unit).en} on a long straight track and never speeds up or slows down. Is its velocity constant?`,
                `Поезд едет ${speedShort(s, unit).ru} по длинному прямому пути, не разгоняется и не тормозит. Его velocity (скорость с направлением) постоянна?`),
            right: L('Yes: same speed and same direction', 'Да: та же скорость и то же направление'),
            wrong: [L('No, trains never have a constant velocity', 'Нет, у поездов velocity никогда не постоянна'), L('Only if it is going north', 'Только если он едет на север'), L('No, because it is moving', 'Нет, потому что он движется')],
            why: L('Velocity is speed plus direction. If both stay the same, the velocity is constant.', 'Velocity - это скорость плюс направление. Если не меняется ни то, ни другое, velocity постоянна.'),
        },
        {
            q: L(`${who.en} drives around a roundabout at a steady ${speedShort(unit === 'mi' ? 15 : 25, unit).en}. Is the car's velocity constant?`,
                `${who.ru} едет по круговому перекрёстку ровно ${speedShort(unit === 'mi' ? 15 : 25, unit).ru}. Velocity машины постоянна?`),
            right: L('No: the speed stays the same but the direction keeps changing', 'Нет: скорость та же, но направление всё время меняется'),
            wrong: [L('Yes: the speed does not change', 'Да: скорость же не меняется'), L('Yes: cars always have a constant velocity', 'Да: у машин velocity всегда постоянна'), L('No: the car is slowing down', 'Нет: машина тормозит')],
            why: L('Turning changes the direction, so the velocity changes even when the speedometer shows the same number.', 'Поворот меняет направление, поэтому velocity меняется, даже если спидометр показывает одно и то же число.'),
        },
        {
            q: L('Ameliia sits on the merry-go-round at the playground. It spins at the same speed all the time. Is she accelerating?', 'Амелия катается на карусели на детской площадке. Карусель всё время крутится с одной скоростью. Амелия ускоряется?'),
            right: L('Yes: her direction keeps changing', 'Да: её направление всё время меняется'),
            wrong: [L('No: the speed is the same', 'Нет: скорость же одна и та же'), L('No: she is sitting still', 'Нет: она же сидит'), L('Only when she gets off', 'Только когда слезает')],
            why: L('Going in a circle means the direction changes all the time. A change of direction is acceleration, even at the same speed.', 'Движение по кругу - это постоянная смена направления. Изменение направления - это ускорение, даже при той же скорости.'),
        },
        {
            q: L('Which one tells a velocity, not only a speed?', 'Что из этого - velocity, а не просто скорость?'),
            right: L(`${speedShort(s, unit).en} ${dir[0]}`, `${speedShort(s, unit).ru} ${dir[1]}`),
            wrong: [L(speedShort(s, unit).en, speedShort(s, unit).ru), L(`${dist(s, unit).en}`, `${dist(s, unit).ru}`), L(`${hours(2).en} ${dir[0]}`, `${hours(2).ru} ${dir[1]}`)],
            why: L('A velocity has a number, a unit like mph or km/h, AND a direction.', 'У velocity есть число, единица (миль/ч или км/ч) И направление.'),
        },
        {
            q: L('A bus waits at a red light, the light turns green, and the bus goes faster and faster. What is the bus doing?', 'Автобус стоит на красный, загорается зелёный, и автобус едет всё быстрее. Что делает автобус?'),
            right: L('Accelerating: its speed is changing', 'Ускоряется: его скорость меняется'),
            wrong: [L('Moving at a constant speed', 'Едет с постоянной скоростью'), L('Standing still', 'Стоит на месте'), L('Losing all its energy', 'Теряет всю энергию')],
            why: L('Acceleration means the velocity changes: speeding up, slowing down, or turning.', 'Ускорение (acceleration) - это изменение velocity: разгон, торможение или поворот.'),
        },
        {
            q: L(`${AMELIIA.en} rides her bike toward a stop sign and slows down. In science words, is she accelerating?`, `${AMELIIA.ru} подъезжает на велосипеде к знаку «стоп» и тормозит. По-научному, она ускоряется (acceleration)?`),
            right: L('Yes: slowing down is also a change in velocity', 'Да: торможение - это тоже изменение velocity'),
            wrong: [L('No: acceleration only means going faster', 'Нет: ускорение - это только разгон'), L('No: a bike cannot accelerate', 'Нет: велосипед не может ускоряться'), L('Yes, because she is going faster', 'Да, потому что она едет быстрее')],
            why: L('Scientists call any change of speed or direction acceleration. Slowing down counts too.', 'Учёные называют ускорением любое изменение скорости или направления. Торможение тоже считается.'),
        },
        {
            q: L('The same bowling ball is rolled two times: once fast, once slowly. When does it have more energy?', 'Один и тот же шар для боулинга катят два раза: один раз быстро, другой раз медленно. Когда у него больше энергии?'),
            right: L('When it rolls fast', 'Когда он катится быстро'),
            wrong: [L('When it rolls slowly', 'Когда он катится медленно'), L('It always has the same energy', 'Энергия всегда одинаковая'), L('Never, rolling balls have no energy', 'Никогда, у катящихся шаров нет энергии')],
            why: L('The same object has more energy when it moves faster. The fast ball hits the pins harder.', 'Один и тот же предмет, когда движется быстрее, имеет больше энергии. Быстрый шар сильнее бьёт по кеглям.'),
            hint: ENERGY_HINT,
        },
        {
            q: L('Two bumper cars, the same size, bump into a wall. Car A was fast, car B was slow. Which bump is louder and harder?', 'Две одинаковые машинки на автодроме врезаются в бортик. Машинка А ехала быстро, машинка Б - медленно. Чей удар громче и сильнее?'),
            right: L('Car A, because it had more energy', 'Машинки А, потому что у неё было больше энергии'),
            wrong: [L('Car B, because slow cars hit harder', 'Машинки Б, потому что медленные бьют сильнее'), L('Both are the same', 'Одинаково'), L('Neither makes a sound', 'Ни одна не издаёт звука')],
            hint: ENERGY_HINT,
            why: L('In a collision, the faster car has more energy to pass on, so the bump is louder and stronger.', 'При столкновении у более быстрой машинки больше энергии, которую она передаёт, поэтому удар громче и сильнее.'),
        },
        {
            q: L(`Dad drove from Fort Lee to ${route.to.en} with an average speed of ${speedShort(s, unit).en}. Did the car go exactly ${speedShort(s, unit).en} the whole time?`,
                `Папа ехал из Форт-Ли до ${route.to.ruGen} со средней скоростью ${speedShort(s, unit).ru}. Машина всё время ехала ровно ${speedShort(s, unit).ru}?`),
            right: L(`No: it started at 0, sped up, slowed down and stopped. ${speedShort(s, unit).en} is only the average`, `Нет: она стартовала с 0, разгонялась, тормозила, стояла. ${speedShort(s, unit).ru} - это только среднее`),
            wrong: [L('Yes, average speed means it never changed', 'Да, средняя скорость значит, что она не менялась'), L(`Yes, a car can only go ${speedShort(s, unit).en}`, `Да, машина может ехать только ${speedShort(s, unit).ru}`), L('No, it was always faster', 'Нет, она всегда ехала быстрее')],
            why: L('Average speed = total distance ÷ total time. It is the steady speed that would make the same trip in the same time.', 'Средняя скорость = всё расстояние ÷ всё время. Это такая ровная скорость, с которой поездка заняла бы столько же времени.'),
        },
        {
            q: L(`The plane to Italy flies straight east at a steady ${speedShort(unit === 'mi' ? 500 : 800, unit).en}. Is the plane accelerating?`,
                `Самолёт в Италию летит прямо на восток с постоянной скоростью ${speedShort(unit === 'mi' ? 500 : 800, unit).ru}. Самолёт ускоряется?`),
            right: L('No: the speed and the direction do not change', 'Нет: ни скорость, ни направление не меняются'),
            wrong: [L('Yes: planes are always accelerating because they are fast', 'Да: самолёты всегда ускоряются, они ведь быстрые'), L('Yes: flying east is acceleration', 'Да: полёт на восток - это ускорение'), L('No: planes have no velocity', 'Нет: у самолётов нет velocity')],
            why: L('Being fast is not acceleration. Acceleration is a CHANGE in speed or direction.', 'Быстро - ещё не значит ускоряется. Ускорение - это ИЗМЕНЕНИЕ скорости или направления.'),
        },
        // Part II of the Chapter 2 study guide: the definitions, word for word
        {
            q: L('What is speed?', 'Что такое скорость (speed)?'),
            right: L('The rate at which an object changes position', 'То, как быстро предмет меняет своё положение'),
            wrong: [L('Speed and direction together', 'Скорость и направление вместе'), L('Any change in speed or direction', 'Любое изменение скорости или направления'), L('Any push or pull', 'Любой толчок или тяга')],
            why: L('Speed is the rate at which an object changes position. Velocity adds the direction, acceleration is a change.', 'Скорость - это то, как быстро предмет меняет положение. Velocity добавляет направление, а ускорение - это изменение.'),
        },
        {
            q: L('Which words describe a direction, so they can be part of a velocity?', 'Какие слова описывают направление и поэтому могут быть частью velocity?'),
            right: L('North, south, east, west, left, right, up and down', 'Север, юг, восток, запад, влево, вправо, вверх и вниз'),
            wrong: [L('Fast, slow, faster and slower', 'Быстро, медленно, быстрее и медленнее'), L('Miles, kilometers and hours', 'Мили, километры и часы'), L('Push and pull', 'Толкать и тянуть')],
            why: L('Velocity combines both the speed and the direction. Direction words: north, south, east, west, or left, right, up and down.', 'Velocity объединяет скорость и направление. Слова направления: север, юг, восток, запад или влево, вправо, вверх и вниз.'),
        },
        {
            q: L(`${who.en} drove ${dist(2 * s, unit).en} in 2 hours. Which formula gives the average speed?`, `${who.ru} ${who.ruShe === 'Она' ? 'проехала' : 'проехал'} ${dist(2 * s, unit).ru} за 2 часа. По какой формуле найти среднюю скорость?`),
            right: L('Average speed = total distance ÷ total time', 'Средняя скорость = всё расстояние ÷ всё время'),
            wrong: [L('Average speed = total distance × total time', 'Средняя скорость = всё расстояние × всё время'), L('Average speed = total time ÷ total distance', 'Средняя скорость = всё время ÷ всё расстояние'), L('Average speed = total distance + total time', 'Средняя скорость = всё расстояние + всё время')],
            why: L(`Average speed = total distance ÷ total time: ${fmt(2 * s, 'en')} ÷ 2 = ${s}, so ${speedShort(s, unit).en}.`, `Средняя скорость = всё расстояние ÷ всё время: ${fmt(2 * s, 'ru')} ÷ 2 = ${s}, то есть ${speedShort(s, unit).ru}.`),
        },
    ];
};

export const IDEA_COUNT = 13;

const makeIdeas = (rng: Rng): Problem => {
    const all = ideas(rng);
    const k = int(rng, 0, all.length - 1);
    const it = all[k];
    return {
        id: `motion-ideas:${k}:${it.q.en}`, skill: 'motion-ideas', topic: 'science',
        prompt: it.q,
        answer: choice(rng, it.right, it.wrong),
        steps: [it.why],
        hint: it.hint ?? L('Speed = how fast. Velocity = how fast AND which way. Acceleration = a change in speed or direction.', 'Скорость - как быстро. Velocity - как быстро И куда. Ускорение - изменение скорости или направления.'),
        data: { idea: k },
    };
};

export const makeScience = (rng: Rng, skill: SkillId): Problem => {
    if (skill === 'speed-find') return makeFind(rng);
    if (skill === 'speed-trip') return makeTrip(rng);
    if (skill === 'speed-units') return makeUnits(rng);
    if (skill === 'motion-ideas') return makeIdeas(rng);
    return makeBasic(rng);
};
