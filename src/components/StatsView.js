import React from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { getTier, getModelClass, getBudgetPct, formatCost } from '../lib/score.js';

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
        <Text color="gray">
          Start one: <Text color="cyan">tokengolf start</Text>
        </Text>
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
      <Box borderStyle="single" borderColor="gray" paddingX={1} paddingY={1} gap={4}>
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
          const bestTier = getTier(stats.bestRun.spent);
          const bestMc = getModelClass(stats.bestRun.model);
          return (
            <Box flexDirection="column" gap={0}>
              <Text color="yellow">🏆 Personal Best</Text>
              <Box
                borderStyle="round"
                borderColor="yellow"
                paddingX={1}
                paddingY={1}
                flexDirection="column"
              >
                <Text color="white">{stats.bestRun.quest}</Text>
                <Box gap={3} marginTop={1}>
                  <Text color="green">{formatCost(stats.bestRun.spent)}</Text>
                  <Text color="gray">of ${stats.bestRun.budget?.toFixed(2)}</Text>
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
          const tier = getTier(run.spent);
          const mc = getModelClass(run.model);
          const pct = getBudgetPct(run.spent, run.budget);
          return (
            <Box key={i} gap={2}>
              <Text color={won ? 'green' : 'red'}>{won ? '✓' : '✗'}</Text>
              <Text color="white">{(run.quest || '').slice(0, 34).padEnd(34)}</Text>
              <Text color={won ? 'green' : 'red'}>{formatCost(run.spent)}</Text>
              <Text color="gray">/{formatCost(run.budget)}</Text>
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
          <Box flexWrap="wrap" gap={1}>
            {stats.achievements.slice(0, 12).map((a, i) => (
              <Box key={i} borderStyle="single" borderColor="gray" paddingX={1}>
                <Text>
                  {a.emoji}{' '}
                  <Text color="gray" dimColor>
                    {a.label}
                  </Text>
                </Text>
              </Box>
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
