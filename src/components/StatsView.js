import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { getTier, getModelClass, getBudgetPct, getParBudget, formatCost } from '../lib/score.js';
import { getEffectiveParRates, getEffectiveParFloors } from '../lib/config.js';
import { ACCENT_BORDER, ACCENT_PADDING } from '../lib/ui.js';

export function StatsView({ stats }) {
  const { exit } = useApp();

  useInput((input) => {
    if (input === 'q') exit();
  });

  if (stats.total === 0) {
    return (
      <Box paddingX={1} paddingY={1} flexDirection="column" gap={1}>
        <Text bold color="yellow">
          ⛳ TokenGolf Stats
        </Text>
        <Text color="gray">No completed runs yet.</Text>
        <Text color="gray">Open Claude Code — sessions are tracked automatically.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1} gap={1}>
      <Box gap={2}>
        <Text bold color="yellow">
          ⛳ TokenGolf
        </Text>
        <Text color="gray">Career Stats</Text>
      </Box>

      {/* Top line */}
      <Box
        borderStyle={ACCENT_BORDER}
        borderColor="gray"
        borderRight={false}
        borderTop={false}
        borderBottom={false}
        paddingLeft={ACCENT_PADDING}
        paddingY={1}
        gap={4}
      >
        <Box flexDirection="column">
          <Text color="gray" dimColor>
            RUNS
          </Text>
          <Text bold color="white">
            {stats.total}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray" dimColor>
            WINS
          </Text>
          <Text bold color="green">
            {stats.wins}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray" dimColor>
            DEATHS
          </Text>
          <Text bold color="red">
            {stats.deaths}
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray" dimColor>
            WIN RATE
          </Text>
          <Text bold color={stats.winRate >= 70 ? 'green' : stats.winRate >= 40 ? 'yellow' : 'red'}>
            {stats.winRate}%
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color="gray" dimColor>
            AVG SPEND
          </Text>
          <Text bold color="cyan">
            {formatCost(stats.avgSpend)}
          </Text>
        </Box>
      </Box>

      {/* Personal best */}
      {stats.bestRun &&
        (() => {
          const bestTier = getTier(stats.bestRun.spent, stats.bestRun.model);
          const bestMc = getModelClass(stats.bestRun.model);
          return (
            <Box flexDirection="column" gap={0}>
              <Text color="yellow">🏆 Personal Best</Text>
              <Box
                borderStyle={{
                  topLeft: ' ',
                  top: ' ',
                  topRight: ' ',
                  left: '██',
                  right: ' ',
                  bottomLeft: ' ',
                  bottom: ' ',
                  bottomRight: ' ',
                }}
                borderColor="yellow"
                borderRight={false}
                borderTop={false}
                borderBottom={false}
                paddingLeft={ACCENT_PADDING}
                paddingY={1}
                flexDirection="column"
              >
                <Text color="white">{stats.bestRun.promptCount || 0} prompts</Text>
                <Box gap={3} marginTop={1}>
                  <Text color="green">{formatCost(stats.bestRun.spent)}</Text>
                  <Text>{bestMc.emoji}</Text>
                  <Text color={bestTier.color}>
                    {bestTier.emoji} {bestTier.label}
                  </Text>
                </Box>
              </Box>
            </Box>
          );
        })()}

      {/* Recent runs */}
      <Box flexDirection="column" gap={0}>
        <Text color="gray" dimColor>
          Recent runs:
        </Text>
        {stats.recentRuns.slice(0, 8).map((run, i) => {
          const won = run.status === 'won';
          const tier = getTier(run.spent, run.model);
          const mc = getModelClass(run.model);
          const par = getParBudget(
            run.model,
            run.promptCount,
            getEffectiveParRates(),
            getEffectiveParFloors()
          );
          const pct = getBudgetPct(run.spent, par);
          return (
            <Box key={i} gap={2}>
              <Text color={won ? 'green' : 'red'}>{won ? '✓' : '✗'}</Text>
              <Text color="white">{`${run.promptCount || 0}p`.padEnd(4)}</Text>
              <Text color={won ? 'green' : 'red'}>{formatCost(run.spent)}</Text>
              <Text color="gray">/{formatCost(par)}</Text>
              <Text>{mc.emoji}</Text>
              <Text color={tier.color}>{tier.emoji}</Text>
              <Text color="gray" dimColor>
                {pct}%
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Achievements */}
      {stats.achievements.length > 0 && (
        <Box flexDirection="column" gap={0}>
          <Text color="gray" dimColor>
            Recent achievements:
          </Text>
          <Box flexWrap="wrap" columnGap={2}>
            {stats.achievements.slice(0, 12).map((a, i) => (
              <Text key={i}>
                {a.emoji}{' '}
                <Text color="gray" dimColor>
                  {a.label}
                </Text>
              </Text>
            ))}
          </Box>
        </Box>
      )}

      <Text color="gray" dimColor>
        q to exit
      </Text>
    </Box>
  );
}
