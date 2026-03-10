// Demo: StatsView variants (Ink)
import React from 'react';
import { Box, Text } from 'ink';
import { demoRender } from './demo-render.js';
import { StatsView } from '../components/StatsView.js';
import { STATS_FIXTURES } from './demo-fixtures.js';

function DemoStatsView({ fixture }) {
  return (
    <Box flexDirection="column">
      <Box paddingX={1}>
        <Text color="gray" dimColor>
          {'─'.repeat(50)}
        </Text>
      </Box>
      <Box paddingX={1}>
        <Text color="gray" dimColor italic>
          {fixture.title}
        </Text>
      </Box>
      <StatsView stats={fixture.stats} />
    </Box>
  );
}

export function runStatsDemo(index) {
  const fixtures = index != null ? [STATS_FIXTURES[index]] : STATS_FIXTURES;
  if (!fixtures[0]) {
    console.log(
      `Invalid index. ${STATS_FIXTURES.length} variants available (0-${STATS_FIXTURES.length - 1}).`
    );
    process.exit(1);
  }

  console.log('');
  console.log('\x1b[1m\x1b[36m⛳ TokenGolf — StatsView Demo\x1b[0m');
  console.log(`\x1b[2m${fixtures.length} variant${fixtures.length > 1 ? 's' : ''}\x1b[0m`);

  return new Promise((resolve) => {
    let i = 0;
    function renderNext() {
      if (i >= fixtures.length) {
        resolve();
        return;
      }
      const fixture = fixtures[i];
      const inst = demoRender(React.createElement(DemoStatsView, { fixture }));
      setTimeout(() => {
        inst.unmount();
        i++;
        renderNext();
      }, 100);
    }
    renderNext();
  });
}
