// Demo: ActiveRun variants (Ink)
import React from 'react';
import { Box, Text } from 'ink';
import { demoRender } from './demo-render.js';
import { ActiveRun } from '../components/ActiveRun.js';
import { ACTIVERUN_FIXTURES } from './demo-fixtures.js';

function DemoActiveRun({ fixture }) {
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
      <ActiveRun run={fixture.run} />
    </Box>
  );
}

export function runActiveDemo(index) {
  const fixtures = index != null ? [ACTIVERUN_FIXTURES[index]] : ACTIVERUN_FIXTURES;
  if (!fixtures[0]) {
    console.log(
      `Invalid index. ${ACTIVERUN_FIXTURES.length} variants available (0-${ACTIVERUN_FIXTURES.length - 1}).`
    );
    process.exit(1);
  }

  console.log('');
  console.log('\x1b[1m\x1b[36m⛳ TokenGolf — ActiveRun Demo\x1b[0m');
  console.log(`\x1b[2m${fixtures.length} variant${fixtures.length > 1 ? 's' : ''}\x1b[0m`);

  return new Promise((resolve) => {
    let i = 0;
    function renderNext() {
      if (i >= fixtures.length) {
        resolve();
        return;
      }
      const fixture = fixtures[i];
      const inst = demoRender(React.createElement(DemoActiveRun, { fixture }));
      setTimeout(() => {
        inst.unmount();
        i++;
        renderNext();
      }, 100);
    }
    renderNext();
  });
}
