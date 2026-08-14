import { TemperatureEngine } from './temperatureEngine';

export function runTemperatureEngineTests() {
  const logText = `
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 1 Read Data Value: 250
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 2 Read Data Value: 280
`;
  const parsed = TemperatureEngine.parseLog(logText);
  if (parsed.length !== 2) {
    throw new Error(`Expected 2 records, got ${parsed.length}`);
  }
  if (parsed[0].val !== 25) {
    throw new Error(`Expected first record value to be 25, got ${parsed[0].val}`);
  }
  if (parsed[1].val !== 28) {
    throw new Error(`Expected second record value to be 28, got ${parsed[1].val}`);
  }
  return true;
}
