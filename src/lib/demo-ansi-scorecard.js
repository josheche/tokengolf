// Demo: ANSI scorecard variants (the compact version shown on /exit)
import { renderScorecard } from './ansi-scorecard.js';
import { SCORECARD_FIXTURES } from './demo-fixtures.js';

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const C = '\x1b[36m';
const RESET = '\x1b[0m';

export function runAnsiScoreCardDemo(index) {
  const fixtures = index != null ? [SCORECARD_FIXTURES[index]] : SCORECARD_FIXTURES;
  if (!fixtures[0]) {
    console.log(
      `Invalid index. ${SCORECARD_FIXTURES.length} scorecards available (0-${SCORECARD_FIXTURES.length - 1}).`
    );
    process.exit(1);
  }

  console.log('');
  console.log(`${BOLD}${C}⛳ TokenGolf — ANSI ScoreCard Demo${RESET}`);
  console.log(`${DIM}Compact scorecard shown automatically on /exit${RESET}`);
  console.log(`${DIM}${fixtures.length} variant${fixtures.length > 1 ? 's' : ''}${RESET}`);

  for (const fixture of fixtures) {
    console.log(` ${DIM}${'─'.repeat(50)}${RESET}`);
    console.log(` ${DIM}${fixture.title}${RESET}`);
    console.log(renderScorecard(fixture.run));
  }
}
