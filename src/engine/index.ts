import { type Problem, type Rng, type SkillId, TOPIC_OF } from './core';
import { makeDivision } from './division';
import { makeEstimation } from './estimation';
import { makeForces } from './forces';
import { makeScience } from './science';
import { makeStrategy } from './strategies';
import { makeTopic3 } from './topic3';
import { makeWordProblem } from './wordproblems';

export const makeProblem = (skill: SkillId, rng: Rng): Problem => {
    const topic = TOPIC_OF[skill];
    if (topic === 'division') return makeDivision(rng, skill);
    if (skill === 'forces') return makeForces(rng);
    if (topic === 'science') return makeScience(rng, skill);
    if (skill === 'mult-tens' || skill === 'mult-mental' || skill === 'mult-expr' || skill === 'mult-word') return makeTopic3(rng, skill);
    if (skill.startsWith('mult-')) return makeStrategy(rng, skill);
    if (skill === 'compare' || skill === 'word-steps') return makeWordProblem(rng, skill);
    return makeEstimation(rng, skill);
};

// Never show the same task twice in a row of recent tasks: try new numbers until the id is fresh
export const makeFreshProblem = (skill: SkillId, rng: Rng, seen: Set<string>): Problem => {
    let p = makeProblem(skill, rng);
    for (let i = 0; i < 60 && seen.has(p.id); i++) p = makeProblem(skill, rng);
    return p;
};
