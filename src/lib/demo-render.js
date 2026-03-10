// Shared render helper for demo mode — provides a fake stdin so useInput doesn't crash
import { Readable } from 'stream';
import { render } from 'ink';

function makeFakeStdin() {
  const s = new Readable({ read() {} });
  s.setRawMode = () => s;
  s.ref = () => s;
  s.unref = () => s;
  s.isTTY = true;
  return s;
}

export function demoRender(element) {
  return render(element, { stdin: makeFakeStdin() });
}
