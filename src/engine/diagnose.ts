import { type Given, type L10n, type Problem, L, fillMarks, fmt } from './core';
import { roundTo } from './estimation';

// What most likely went wrong, from her answer and the right one, like a teacher who looks at the work:
// a lost or extra zero, a carry, a fact in one place, a misread factor, swapped digits, a zero missing inside the quotient,
// rounding to the wrong place or the wrong way, a remainder too big, missed or extra options. Only clear patterns are named;
// anything else gets null, and the review simply compares her answer with the right way.

const PLACES: [string, string][] = [['ones', 'единиц'], ['tens', 'десятков'], ['hundreds', 'сотен'], ['thousands', 'тысяч'], ['ten thousands', 'десятков тысяч'], ['hundred thousands', 'сотен тысяч']];

// the factor pairs of a task whose answer is an exact product
const factorPairs = (p: Problem): [number, number][] => {
    const d = p.data, n = (k: string) => Number(d[k]);
    if (p.skill === 'mult-tens') return [[n('m'), n('b')]];
    if (p.skill === 'multiply') return [[n('a'), n('b')]];
    if (p.skill === 'est-product' && 'ra' in d && !('rb' in d)) return [[n('b'), n('ra')]];
    if (p.skill === 'mult-mental' && 'x' in d) return [[n('x'), n('y')]];
    if ('m' in d && 'a' in d && (p.skill.startsWith('mult-') || p.skill === 'multiply')) return [[n('m'), n('a')]];
    return [];
};

export const diagnoseNumber = (p: Problem, want: number, got: number): L10n | null => {
    if (got === want || !Number.isFinite(got)) return null;
    // multiplied by another one-digit number: 937 × 9 instead of 937 × 7
    for (const [x, y] of factorPairs(p)) {
        const [small, big] = x < y ? [x, y] : [y, x];
        if (small >= 2 && small <= 9 && want === small * big && got % big === 0) {
            const q = got / big;
            if (q >= 2 && q <= 9 && q !== small) {
                return L(`It looks like you multiplied by ${q}, not by ${small}: ${fmt(big, 'en')} × ${q} is ${fmt(got, 'en')}. Read the problem again before you start.`,
                    `Похоже, ты умножила на ${q}, а не на ${small}: ${fmt(big, 'ru')} × ${q} - это ${fmt(got, 'ru')}. Перечитай условие, прежде чем начать.`);
            }
        }
    }
    for (const [x, y] of factorPairs(p)) {
        const [small, big] = x < y ? [x, y] : [y, x];
        if (small < 2 || small > 9 || want !== small * big) continue;
        // a zero inside the big factor got lost: 5 × 193 instead of 5 × 1,903 (the zeros at the end are another mistake)
        const tail = (String(big).match(/0+$/) ?? [''])[0], core = String(big).slice(0, String(big).length - tail.length);
        const short = /\d0\d/.test(core) ? Number(core.replace(/(\d)0(\d)/, '$1$2') + tail) : 0;
        if (short && got === small * short) {
            return L(`The 0 in ${fmt(big, 'en')} got lost: you found ${small} × ${fmt(short, 'en')}. Keep every digit of the number, even the 0.`,
                `Потерялся 0 в числе ${fmt(big, 'ru')}: получилось ${small} × ${fmt(short, 'ru')}. Сохраняй каждую цифру числа, даже 0.`);
        }
    }
    // a basic fact in one part: 8 × 70 = 640 because 8 × 8 = 64 was used instead of 8 × 7 = 56
    for (const [x, y] of factorPairs(p)) {
        const small = Math.min(x, y);
        if (small < 2 || small > 9) continue;
        const zeros = (String(want).match(/0+$/) ?? [''])[0].length, z = 10 ** zeros;
        if (got % z !== 0) continue;
        const wf = want / z, gf = got / z;
        if (wf % small === 0 && wf / small >= 1 && wf / small <= 9 && gf !== wf && gf <= 9 * small && gf >= 1 && Math.abs(gf - wf) < 2 * small + 1) {
            const other = gf % small === 0 ? gf / small : 0;
            return L(`Check the fact: ${small} × ${wf / small} = ${wf}, not ${gf}${other ? ` (${gf} is ${small} × ${other})` : ''}.`,
                `Проверь пример из таблицы: ${small} × ${wf / small} = ${wf}, а не ${gf}${other ? ` (${gf} - это ${small} × ${other})` : ''}.`);
        }
    }
    // rounding: the wrong place, or the wrong way
    if (p.skill === 'round' && 'n' in p.data && 'place' in p.data) {
        const n = Number(p.data.n), place = Number(p.data.place);
        for (const other of [10, 100, 1000, 10000]) {
            if (other !== place && got === roundTo(n, other) && got !== want) {
                return L(`You rounded to the nearest ${PLACES[Math.log10(other)][0].replace(/s$/, '')}, but the task asks for the nearest ${PLACES[Math.log10(place)][0].replace(/s$/, '')}.`,
                    `Ты округлила до ${PLACES[Math.log10(other)][1]}, а в задании нужно до ${PLACES[Math.log10(place)][1]}.`);
            }
        }
        const down = Math.floor(n / place) * place;
        if (got === down && want === down + place) return L('The digit to the right is 5 or more, so this number rounds UP.', 'Цифра справа - 5 или больше, значит округляем ВВЕРХ.');
        if (got === down + place && want === down) return L('The digit to the right is less than 5, so this number rounds DOWN.', 'Цифра справа меньше 5, значит округляем ВНИЗ.');
    }
    // zeros
    if (want !== 0 && got * 10 === want) return L(`A zero got lost: ${fmt(got, 'en')} instead of ${fmt(want, 'en')}. Say the place out loud: tens give tens, hundreds give hundreds.`,
        `Потерялся ноль: ${fmt(got, 'ru')} вместо ${fmt(want, 'ru')}. Проговори разряд вслух: десятки дают десятки, сотни дают сотни.`);
    if (want !== 0 && got * 100 === want) return L(`Two zeros got lost: ${fmt(got, 'en')} instead of ${fmt(want, 'en')}. Count the zeros of the factors.`,
        `Потерялись два нуля: ${fmt(got, 'ru')} вместо ${fmt(want, 'ru')}. Посчитай нули у множителей.`);
    if (want !== 0 && got === want * 10) return L(`One zero too many: ${fmt(got, 'en')} instead of ${fmt(want, 'en')}. Count the zeros again.`,
        `Лишний ноль: ${fmt(got, 'ru')} вместо ${fmt(want, 'ru')}. Посчитай нули ещё раз.`);
    const w = String(want), g = String(got);
    // a zero inside the number is missing: 26 instead of 206
    if (/\d0\d/.test(w) && w.replace(/(\d)0(\d)/, '$1$2') === g) return L(`A zero in the middle is missing: ${fmt(got, 'en')} instead of ${fmt(want, 'en')}. Every place needs a digit, even when it is 0.`,
        `Пропал ноль в середине: ${fmt(got, 'ru')} вместо ${fmt(want, 'ru')}. В каждом разряде нужна цифра, даже если это 0.`);
    if (w.length !== g.length) return null;
    const diff = [...w].map((c, i) => (c === g[i] ? -1 : w.length - 1 - i)).filter(i => i >= 0);
    // the right digits in the wrong order: 9,155 instead of 9,515
    if (diff.length === 2 && diff[0] === diff[1] + 1 && [...w].sort().join('') === [...g].sort().join('')) {
        return L('All the digits are right, but two of them are in the wrong order. Write the digits one place at a time.', 'Все цифры верные, но две стоят не на своих местах. Записывай цифры по одному разряду.');
    }
    if (diff.length !== 1) return null;
    const place = diff[0], wd = Number(w[w.length - 1 - place]), gd = Number(g[g.length - 1 - place]);
    if (Math.abs(wd - gd) === 1 && place > 0) {
        return L(`Only the ${PLACES[place][0]} digit is off by 1: ${gd} instead of ${wd}. That is usually a carry: check that you added the carried number once.`,
            `Ошибка только в разряде ${PLACES[place][1]}, на 1: ${gd} вместо ${wd}. Обычно это перенос: проверь, что перенесённое число прибавлено один раз.`);
    }
    return L(`Only the ${PLACES[place][0]} digit is wrong: ${gd} instead of ${wd}. Check the fact or the step in that place.`,
        `Ошибка только в разряде ${PLACES[Math.min(place, PLACES.length - 1)][1]}: ${gd} вместо ${wd}. Проверь пример из таблицы или шаг в этом разряде.`);
};

// a plain number option like "9,515" or "350 tortillas"
const numberIn = (o: L10n) => { const m = o.en.match(/^\$?(\d[\d,]*)(\s+[a-z ]+)?$/); return m ? Number(m[1].replace(/,/g, '')) : null; };

export const diagnose = (p: Problem, given: Given): L10n | null => {
    const a = p.answer;
    if (a.kind === 'number') return given.value === undefined ? null : diagnoseNumber(p, a.value, given.value);
    if (a.kind === 'remainder') {
        const d = Number(p.data.divisor), n = Number(p.data.dividend), q = given.q ?? NaN, r = given.r ?? NaN;
        if (r >= d) return L(`The remainder ${r} is not smaller than the divisor ${d}: ${d} fits at least one more time.`, `Остаток ${r} не меньше делителя ${d}: ${d} поместится ещё хотя бы раз.`);
        if (q !== a.q) return diagnoseNumber(p, a.q, q) ?? (Math.abs(q - a.q) === 1
            ? L(`The quotient is 1 off. Check: quotient × divisor + remainder must be ${fmt(n, 'en')}.`, `Частное отличается на 1. Проверь: частное × делитель + остаток должно быть ${fmt(n, 'ru')}.`) : null);
        return r !== a.r ? L(`The quotient is right, the remainder is not. Subtract once more: ${fmt(n, 'en')} − quotient × ${d}.`, `Частное верное, а остаток нет. Вычти ещё раз: ${fmt(n, 'ru')} − частное × ${d}.`) : null;
    }
    if (a.kind === 'multi') {
        const picked = new Set(given.choices ?? []);
        const missed = a.correct.filter(i => !picked.has(i)).map(i => a.options[i]);
        const extra = [...picked].filter(i => !a.correct.includes(i)).map(i => a.options[i]);
        const list = (xs: L10n[], lang: 'en' | 'ru') => xs.map(x => x[lang]).join('; ');
        const parts: L10n[] = [];
        if (missed.length) parts.push(L(`You did not pick: ${list(missed, 'en')}.`, `Ты не выбрала: ${list(missed, 'ru')}.`));
        if (extra.length) parts.push(L(`This is not right: ${list(extra, 'en')}.`, `Это не подходит: ${list(extra, 'ru')}.`));
        if (!parts.length) return null;
        parts.push(L('Find the value of every option, there can be more than one right answer.', 'Посчитай каждый вариант: верных может быть больше одного.'));
        return L(parts.map(x => x.en).join(' '), parts.map(x => x.ru).join(' '));
    }
    if (a.kind === 'choice') {
        if (given.choice === undefined || given.choice === a.correct) return null;
        const got = numberIn(a.options[given.choice]), want = numberIn(a.options[a.correct]);
        return got !== null && want !== null ? diagnoseNumber(p, want, got) : null;
    }
    // a worksheet: name the wrong boxes that show a clear pattern
    const blanks = given.blanks ?? [];
    const marks = fillMarks(a, blanks);
    const found: L10n[] = [];
    marks.forEach((ok, i) => {
        if (ok || found.length >= 2 || blanks[i] === undefined) return;
        const d = diagnoseNumber(p, a.values[i], blanks[i]);
        if (d) found.push(L(`Where ${fmt(a.values[i], 'en')} goes you wrote ${fmt(blanks[i], 'en')}. ${d.en}`, `Где должно быть ${fmt(a.values[i], 'ru')}, ты написала ${fmt(blanks[i], 'ru')}. ${d.ru}`));
    });
    return found.length ? L(found.map(x => x.en).join(' '), found.map(x => x.ru).join(' ')) : null;
};
