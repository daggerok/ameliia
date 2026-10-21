import { type Rng, pick } from './core';

// People of the stories: Ameliia, her family and friends. ruGen is the form after "у" (у Амелии)
export type Person = { en: string; ru: string; ruGen: string; enShe: string; ruShe: string };

const person = (en: string, ru: string, ruGen: string, she: boolean): Person =>
    ({ en, ru, ruGen, enShe: she ? 'She' : 'He', ruShe: she ? 'Она' : 'Он' });

export const AMELIIA = person('Ameliia', 'Амелия', 'Амелии', true);

export const FAMILY: Person[] = [
    AMELIIA,
    person('Mom', 'Мама', 'мамы', true),
    person('Dad', 'Папа', 'папы', false),
    person('Grandma Sveta', 'Бабушка Света', 'бабушки Светы', true),
    person('Grandpa Valerik', 'Дедушка Валерик', 'дедушки Валерика', false),
    person('Grandma Olga', 'Бабушка Оля', 'бабушки Оли', true),
    person('Grandpa Valeriy', 'Дедушка Валерий', 'дедушки Валерия', false),
];

export const FRIENDS: Person[] = [
    person('Emma', 'Эмма', 'Эммы', true),
    person('Sofia', 'София', 'Софии', true),
    person('Olivia', 'Оливия', 'Оливии', true),
    person('Mia', 'Мия', 'Мии', true),
    person('Noah', 'Ноа', 'Ноа', false),
    person('Leo', 'Лео', 'Лео', false),
];

// the people who live together in Fort Lee: trips in New Jersey start with them
export const HOUSEHOLD: Person[] = FAMILY.slice(0, 5);

// Ameliia and her family show up most often, friends now and then
export const kidName = (rng: Rng): Person => (rng() < 0.7 ? pick(rng, FAMILY) : pick(rng, FRIENDS));

// en: [one, many]; ru: [1, 2-4, 5+] forms after a number
export type Item = { en: [string, string]; ru: [string, string, string] };

export const ITEMS: Item[] = [
    { en: ['sticker', 'stickers'], ru: ['наклейка', 'наклейки', 'наклеек'] },
    { en: ['crayon', 'crayons'], ru: ['карандаш', 'карандаша', 'карандашей'] },
    { en: ['cookie', 'cookies'], ru: ['печенька', 'печеньки', 'печенек'] },
    { en: ['seashell', 'seashells'], ru: ['ракушка', 'ракушки', 'ракушек'] },
    { en: ['bead', 'beads'], ru: ['бусина', 'бусины', 'бусин'] },
    { en: ['strawberry', 'strawberries'], ru: ['клубничка', 'клубнички', 'клубничек'] },
    { en: ['candy', 'candies'], ru: ['конфета', 'конфеты', 'конфет'] },
    { en: ['pretzel', 'pretzels'], ru: ['крендель', 'кренделя', 'кренделей'] },
    { en: ['marble', 'marbles'], ru: ['шарик', 'шарика', 'шариков'] },
    { en: ['toy car', 'toy cars'], ru: ['машинка', 'машинки', 'машинок'] },
    { en: ['photo', 'photos'], ru: ['фотография', 'фотографии', 'фотографий'] },
    { en: ['postcard', 'postcards'], ru: ['открытка', 'открытки', 'открыток'] },
    { en: ['apple', 'apples'], ru: ['яблоко', 'яблока', 'яблок'] },
    { en: ['toy block', 'toy blocks'], ru: ['кубик', 'кубика', 'кубиков'] },
    { en: ['scoop of ice cream', 'scoops of ice cream'], ru: ['шарик мороженого', 'шарика мороженого', 'шариков мороженого'] },
    { en: ['chocolate bar', 'chocolate bars'], ru: ['шоколадка', 'шоколадки', 'шоколадок'] },
    { en: ['chocolate candy', 'chocolate candies'], ru: ['шоколадная конфета', 'шоколадные конфеты', 'шоколадных конфет'] },
    { en: ['gummy bear', 'gummy bears'], ru: ['мармеладный мишка', 'мармеладных мишки', 'мармеладных мишек'] },
    { en: ['book', 'books'], ru: ['книга', 'книги', 'книг'] },
];

// Things the family loves doing: playgrounds, cafes, books, the iPad, the Florida trip and Italy next year
export const FLORIDA = [
    { en: 'Orlando', ru: 'Орландо' }, { en: 'Miami', ru: 'Майами' }, { en: 'Tampa', ru: 'Тампа' }, { en: 'Key West', ru: 'Ки-Уэст' },
];

// ru: accusative after "в" with a number [1, 2-4, 5+] and the "in each" phrase
export type Container = { en: [string, string]; ru: [string, string, string]; ruEach: string };

export const CONTAINERS: Container[] = [
    { en: ['box', 'boxes'], ru: ['коробку', 'коробки', 'коробок'], ruEach: 'в каждой коробке' },
    { en: ['bag', 'bags'], ru: ['пакет', 'пакета', 'пакетов'], ruEach: 'в каждом пакете' },
    { en: ['jar', 'jars'], ru: ['банку', 'банки', 'банок'], ruEach: 'в каждой банке' },
    { en: ['basket', 'baskets'], ru: ['корзинку', 'корзинки', 'корзинок'], ruEach: 'в каждой корзинке' },
    { en: ['envelope', 'envelopes'], ru: ['конверт', 'конверта', 'конвертов'], ruEach: 'в каждом конверте' },
];

// The family lives in Fort Lee with Grandma Sveta and Grandpa Valerik; Grandma Olga and Grandpa Valeriy live in Italy
export const HOME = { en: 'home in Fort Lee', ru: 'дом в Форт-Ли', ruGen: 'дома в Форт-Ли' };

// New Jersey places for the trips (distances in the tasks are made up but kept realistic)
export const PLACES = [
    { en: 'Fort Lee', ru: 'Форт-Ли', ruGen: 'Форт-Ли' }, { en: 'Princeton', ru: 'Принстон', ruGen: 'Принстона' }, { en: 'Trenton', ru: 'Трентон', ruGen: 'Трентона' },
    { en: 'Newark Airport', ru: 'аэропорт Ньюарк', ruGen: 'аэропорта Ньюарк' }, { en: 'Hoboken', ru: 'Хобокен', ruGen: 'Хобокена' }, { en: 'Cape May', ru: 'Кейп-Мэй', ruGen: 'Кейп-Мэй' },
    { en: 'Atlantic City', ru: 'Атлантик-Сити', ruGen: 'Атлантик-Сити' }, { en: 'Hackensack', ru: 'Хакенсак', ruGen: 'Хакенсака' }, { en: 'Paramus', ru: 'Парамус', ruGen: 'Парамуса' },
    { en: 'Asbury Park', ru: 'Эсбери-Парк', ruGen: 'Эсбери-Парка' }, { en: 'Morristown', ru: 'Морристаун', ruGen: 'Морристауна' }, { en: 'Englewood', ru: 'Энглвуд', ruGen: 'Энглвуда' },
    { en: 'New Brunswick', ru: 'Нью-Брансуик', ruGen: 'Нью-Брансуика' }, { en: 'the Jersey Shore', ru: 'побережье Джерси', ruGen: 'побережья Джерси' },
];

export const ITALY = [
    { en: 'Rome', ru: 'Рим' }, { en: 'Florence', ru: 'Флоренция' }, { en: 'Venice', ru: 'Венеция' },
    { en: 'Milan', ru: 'Милан' }, { en: 'Naples', ru: 'Неаполь' }, { en: 'Pisa', ru: 'Пиза' },
];
