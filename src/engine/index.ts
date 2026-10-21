import { type Problem, type Rng, type SkillId, TOPIC_OF } from './core';
import { makeDivision } from './division';
import { makeEstimation } from './estimation';
import { makeScience } from './science';
import { makeStrategy } from './strategies';

export const makeProblem = (skill: SkillId, rng: Rng): Problem => {
    const topic = TOPIC_OF[skill];
    if (topic === 'division') return makeDivision(rng, skill);
    if (topic === 'science') return makeScience(rng, skill);
    if (skill.startsWith('mult-')) return makeStrategy(rng, skill);
    return makeEstimation(rng, skill);
};

// Never show the same task twice in a row of recent tasks: try new numbers until the id is fresh
export const makeFreshProblem = (skill: SkillId, rng: Rng, seen: Set<string>): Problem => {
    let p = makeProblem(skill, rng);
    for (let i = 0; i < 60 && seen.has(p.id); i++) p = makeProblem(skill, rng);
    return p;
};
