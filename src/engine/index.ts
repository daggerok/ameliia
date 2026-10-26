/// <reference lib="esnext" />
import { type Problem, type Rng, type SkillId, TOPIC_OF } from './core';
import { makeDivision } from './division';
import { makeEstimation } from './estimation';
import { makeForces } from './forces';
import { makeScience } from './science';
import { makeScienceWords } from './scienceWords';
import { makeStrategy } from './strategies';
import { makeTopic3 } from './topic3';
import { makeTopic4 } from './topic4';
import { makeWordProblem } from './wordproblems';

// kind: a kind of task inside the skill (a style like "partials" or "map"); skills with one kind ignore it
export const makeProblem = (skill: SkillId, rng: Rng, kind?: string): Problem => {
    const topic = TOPIC_OF[skill];
    if (topic === 'division') return makeDivision(rng, skill);
    if (skill === 'forces') return makeForces(rng, kind);
    if (skill === 'sci-words') return makeScienceWords(rng, kind);
    if (topic === 'science') return makeScience(rng, skill, kind);
    if (skill === 'mult-tens' || skill === 'mult-mental' || skill === 'mult-expr' || skill === 'mult-word') return makeTopic3(rng, skill, kind);
    if (skill === 'mult-2x10') return makeTopic4(rng, kind);
    if (skill.startsWith('mult-')) return makeStrategy(rng, skill);
    if (skill === 'compare' || skill === 'word-steps') return makeWordProblem(rng, skill);
    return makeEstimation(rng, skill, kind);
};

// Never show the same task twice in a row of recent tasks: try new numbers until the id is fresh
export const makeFreshProblem = (skill: SkillId, rng: Rng, seen: Set<string>, kind?: string): Problem => {
    let p = makeProblem(skill, rng, kind);
    for (let i = 0; i < 60 && seen.has(p.id); i++) p = makeProblem(skill, rng, kind);
    return p;
};
