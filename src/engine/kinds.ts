/// <reference lib="esnext" />
import { type L10n, type SkillId, L } from './core';
import { KINDS_4_2 } from './topic4';
import { KINDS_4_5 } from './topic4area';
import { KINDS_4_4 } from './topic4arr';
import { KINDS_4_3 } from './topic4est';

// Every kind of task a skill can ask (the `kind` of `kindOf` in game.ts), with a short name for the Progress screen,
// so the report shows which kinds she has solved, which she gets wrong and which were never asked at all.
// A skill with one kind of task has the single kind 'all'.
const NAMES: Partial<Record<SkillId, Record<string, L10n>>> = {
    'mult-tens': {
        plain: L('6 × 400: multiply by a multiple of 10, 100, 1,000', '6 × 400: умножение на круглые десятки, сотни, тысячи'),
        units: L('Basic fact and place value: 6 × 4 tens', 'Таблица и разряды: 6 × 4 десятка'),
        pattern: L('Finish the pattern 3 × 5, 3 × 50, 3 × 500 ...', 'Продолжи закономерность 3 × 5, 3 × 50, 3 × 500 ...'),
        zero: L('A fact that ends in zero: 5 × 4,000', 'Факт с нулём на конце: 5 × 4 000'),
    },
    'est-product': {
        tens: L('Estimate by rounding both to tens', 'Прикинь: округли оба числа до десятков'),
        big: L('Estimate: round the big number first', 'Прикинь: округли большое число'),
        reasonable: L('Is this answer reasonable?', 'Правдоподобен ли ответ?'),
    },
    'mult-mental': {
        assoc: L('Commutative and Associative Properties', 'Переместительное и сочетательное свойства'),
        comp: L('Compensation: 9 × 67 = 9 × 70 − 9 × 3', 'Поправка: 9 × 67 = 9 × 70 − 9 × 3'),
        story: L('Compensation in a story', 'Поправка в задаче'),
        how: L('How to find it with mental math', 'Как посчитать в уме'),
    },
    'mult-expr': {
        partials: L('Partial products (select all)', 'Частичные произведения (выбери все)'),
        expand: L('Expressions to find a product (select all)', 'Выражения для произведения (выбери все)'),
        same: L('Which expression has the same value', 'Какое выражение имеет то же значение'),
        back: L('Which equals (h × m) + (r × m)', 'Какое равно (с × m) + (о × m)'),
        product: L('Expressions with a given product (select all)', 'Выражения с данным значением (выбери все)'),
        equiv: L('Which are equivalent to m × a (select all)', 'Какие равны m × a (выбери все)'),
        pick: L('What is the product', 'Чему равно произведение'),
    },
    'mult-word': {
        bar: L('Equation from a bar diagram', 'Уравнение по схеме из полосок'),
        story: L('Story with a bar diagram', 'Задача со схемой из полосок'),
        rows: L('Garden rows: an equation', 'Грядки: уравнение'),
        area: L('Garden rows: an area model', 'Грядки: модель площади'),
        bags: L('Bags of two sizes', 'Пакеты двух размеров'),
        bakery: L('Bea\'s Bakery per hour', 'Пекарня Беа за час'),
        weeks: L('Coffee shop: the same for N weeks', 'Кофейня: столько же N недель'),
        iced: L('Coffee shop: times as many', 'Кофейня: во сколько раз больше'),
        tickets: L('Resort tickets for adults and children', 'Билеты для взрослых и детей'),
        reason: L('Is the total about right?', 'Правдоподобна ли сумма?'),
        gifts: L('Gifts: estimate, then the exact cost', 'Подарки: прикидка и точная сумма'),
    },
    forces: {
        motion: L('What motion is', 'Что такое движение'),
        reference: L('Reference point', 'Точка отсчёта'),
        force: L('What a force is', 'Что такое сила'),
        gravity: L('Gravity', 'Гравитация'),
        relative: L('Relative motion', 'Относительное движение'),
        kinds: L('Kinds of forces', 'Виды сил'),
        'size-direction': L('Size and direction of a force', 'Величина и направление силы'),
        effects: L('What forces can do', 'Что делают силы'),
        balanced: L('Balanced and unbalanced forces', 'Уравновешенные и неуравновешенные силы'),
        other: L('Other questions', 'Другие вопросы'),
    },
    'motion-ideas': {
        speed: L('Speed', 'Скорость'),
        velocity: L('Velocity', 'Скорость с направлением'),
        acceleration: L('Acceleration', 'Ускорение'),
        average: L('Average speed', 'Средняя скорость'),
        energy: L('Energy of motion', 'Энергия движения'),
    },
    'speed-trip': {
        map: L('The map: every part and the whole trip', 'Карта: каждая часть и вся поездка'),
        total: L('The whole trip', 'Вся поездка'),
        leg: L('One part of the trip', 'Одна часть поездки'),
        trap: L('Pip\'s trap: averaging the speeds', 'Ловушка Пипа: среднее из скоростей'),
    },
    'sci-words': {
        type: L('Type the word', 'Напиши слово'),
        bank: L('Pick from the word bank', 'Выбери из списка слов'),
    },
    'mult-2x10': {
        array: L('Array with place-value blocks', 'Массив из блоков разрядов'),
        area: L('Area model', 'Модель площади'),
        product: L('50 × 15: the product', '50 × 15: произведение'),
        story: L('A building of 30 floors', 'Дом в 30 этажей'),
        diff: L('Greg and Marta: how many more', 'Грег и Марта: на сколько больше'),
        two: L('The dentist\'s boxes: two products', 'Коробки стоматолога: два произведения'),
        compare: L('Which product is greater', 'Какое произведение больше'),
    },
    'est-2x2': {
        guided: L('23 × 12: 23 is close to 25, 12 is close to __', '23 × 12: 23 близко к 25, 12 близко к __'),
        round: L('Estimate each product by rounding', 'Прикинь произведение округлением'),
        ways: L('More than one way to estimate (select all)', 'Несколько способов прикидки (выбери все)'),
        story: L('Bathtub every day for 31 days', 'Ванна каждый день 31 день'),
        weeks: L('Gadgets a day, 7 days a week, 4 weeks', 'Гаджеты в день, 7 дней в неделю, 4 недели'),
        vocab: L('Vocabulary: compatible numbers', 'Словарь: удобные числа'),
        sense: L('Nathan: greater or less than the actual product', 'Натан: больше или меньше точного произведения'),
        think: L('Rounding or compatible numbers?', 'Округление или удобные числа?'),
        box: L('Tour guide: numbers from the box', 'Экскурсовод: числа из рамки'),
    },
    'mult-2x2': {
        array: L('12 × 24 as an array: four partial products', '12 × 24 массивом: четыре частичных произведения'),
        hours: L('Barb: hours each week for 14 weeks', 'Барб: часы в неделю за 14 недель'),
        reason: L('Teri: is the answer reasonable?', 'Тери: ответ разумный?'),
        sales: L('Nolan\'s store: total sales of two kinds of boxes', 'Магазин Нолана: выручка за два вида коробок'),
        missing: L('Insert the missing partial products', 'Впиши пропущенные частичные произведения'),
        factor: L('Insert the missing factor', 'Впиши пропущенный множитель'),
    },
    'dist-2x2': {
        area: L('Fill in a drawn area model (14 × 19, 21 × 51)', 'Заполни готовую модель площади (14 × 19, 21 × 51)'),
        dist: L('23 × 18 = (20 + 3) × (10 + 8): four products', '23 × 18 = (20 + 3) × (10 + 8): четыре произведения'),
        product: L('Draw an area model, find the product (10 × 18 ... 29 × 64)', 'Нарисуй модель площади, найди произведение (10 × 18 ... 29 × 64)'),
        story: L('Ms. Langley\'s class: problems for every student', 'Класс миссис Лэнгли: задачи каждому ученику'),
        add: L('Concert and rodeo: add 5-digit numbers', 'Концерт и родео: сложи пятизначные числа'),
        ferry: L('Ferry: about how much money', 'Паром: примерно сколько денег'),
        enough: L('Mr. Buckham: enough index cards?', 'Мистер Бакхэм: хватит ли карточек?'),
        partials: L('Select all the partial products of 17 × 28', 'Выбери все наборы частичных произведений 17 × 28'),
        ways: L('Select all the ways to break apart 45 × 18', 'Выбери все способы разбить 45 × 18'),
    },
};

export const KINDS_OF = (skill: SkillId): string[] => Object.keys(NAMES[skill] ?? { all: 0 });
export const kindName = (skill: SkillId, kind: string): L10n => NAMES[skill]?.[kind] ?? (kind === 'all' ? L('All tasks', 'Все задания') : L(kind, kind));
// keeps the registry and the generator in step: every kind of Lesson 4-2 must have a name
export const LESSON_4_2_KINDS: readonly string[] = KINDS_4_2;
export const LESSON_4_3_KINDS: readonly string[] = KINDS_4_3;
export const LESSON_4_4_KINDS: readonly string[] = KINDS_4_4;
export const LESSON_4_5_KINDS: readonly string[] = KINDS_4_5;
