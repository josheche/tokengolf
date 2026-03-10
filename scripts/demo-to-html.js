#!/usr/bin/env node
// Captures demo output and converts ANSI escape codes to HTML spans
// Usage: node scripts/demo-to-html.js [scorecard|active|stats|hud] [index]

import { execSync } from 'child_process';

const component = process.argv[2] || 'scorecard';
const index = process.argv[3] != null ? `-i ${process.argv[3]}` : '';

const raw = execSync(`node dist/cli.js demo ${component} ${index}`, {
  encoding: 'utf8',
  env: { ...process.env, FORCE_COLOR: '1' },
});

// ANSI color code → CSS class mapping
const ANSI_MAP = {
  '1': 'b',       // bold
  '2': 'dim',     // dim
  '3': 'i',       // italic
  '31': 'red',
  '32': 'green',
  '33': 'yellow',
  '34': 'blue',
  '35': 'magenta',
  '36': 'cyan',
  '37': 'white',
  '39': '',        // default fg
  '90': 'dim',    // bright black = dim
};

function ansiToHtml(str) {
  // Remove the demo header lines (first 2 lines) and separator/title lines
  const lines = str.split('\n');

  // Find where actual content starts (skip "TokenGolf — X Demo" + "N variants" + separator + title)
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TokenGolf —') || lines[i].includes('variant')) {
      startIdx = i + 1;
    }
  }

  // Also skip the leading separator + title line
  while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
  // Skip "──────" separator
  const stripped = lines[startIdx]?.replace(/\x1b\[[0-9;]*m/g, '').trim();
  if (stripped && stripped.match(/^─+$/)) startIdx++;
  // Skip title line
  if (lines[startIdx]) startIdx++;

  let content = lines.slice(startIdx).join('\n');

  // Remove trailing empty lines
  content = content.replace(/\n+$/, '');

  // Also remove Ink's cleanup sequences ([2K[1A patterns)
  content = content.replace(/(\x1b\[2K\x1b\[1A)+\x1b\[2K\x1b\[G/g, '');
  content = content.replace(/\x1b\[2K/g, '');
  content = content.replace(/\x1b\[1A/g, '');
  content = content.replace(/\x1b\[\d*G/g, '');

  // Remove trailing cleanup
  content = content.replace(/\n+$/, '');

  // Convert ANSI to HTML spans
  let html = '';
  let openTags = [];

  const parts = content.split(/(\x1b\[[0-9;]*m)/);

  for (const part of parts) {
    const match = part.match(/^\x1b\[([0-9;]*)m$/);
    if (match) {
      const codes = match[1].split(';');
      for (const code of codes) {
        if (code === '0' || code === '') {
          // Reset — close all open tags
          html += openTags.map(() => '</span>').join('');
          openTags = [];
        } else {
          const cls = ANSI_MAP[code];
          if (cls) {
            html += `<span class="t-${cls}">`;
            openTags.push(cls);
          }
        }
      }
    } else {
      // Escape HTML entities
      html += part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  // Close remaining tags
  html += openTags.map(() => '</span>').join('');

  return html;
}

const html = ansiToHtml(raw);
console.log(html);
