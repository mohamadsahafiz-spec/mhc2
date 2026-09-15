export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
}

export const CANONICAL_TIMEZONES: TimezoneOption[] = [
  // Primary Semiconductor / Precision Laser Hubs
  {
    value: 'Asia/Kuala_Lumpur (UTC+08:00)',
    label: 'Asia/Kuala_Lumpur (UTC+08:00) — Malaysia / Singapore Hub',
    region: 'Southeast Asia'
  },
  {
    value: 'Asia/Singapore (UTC+08:00)',
    label: 'Asia/Singapore (UTC+08:00) — Singapore Operations',
    region: 'Southeast Asia'
  },
  {
    value: 'Asia/Taipei (UTC+08:00)',
    label: 'Asia/Taipei (UTC+08:00) — Taiwan Foundry / Hsinchu',
    region: 'East Asia'
  },
  {
    value: 'Asia/Seoul (UTC+09:00)',
    label: 'Asia/Seoul (UTC+09:00) — South Korea / EO HQ',
    region: 'East Asia'
  },
  {
    value: 'Asia/Tokyo (UTC+09:00)',
    label: 'Asia/Tokyo (UTC+09:00) — Japan Precision Optics',
    region: 'East Asia'
  },
  {
    value: 'Asia/Shanghai (UTC+08:00)',
    label: 'Asia/Shanghai (UTC+08:00) — China Manufacturing',
    region: 'East Asia'
  },
  {
    value: 'Asia/Manila (UTC+08:00)',
    label: 'Asia/Manila (UTC+08:00) — Philippines Assembly',
    region: 'Southeast Asia'
  },
  {
    value: 'Asia/Bangkok (UTC+07:00)',
    label: 'Asia/Bangkok (UTC+07:00) — Thailand / Indochina',
    region: 'Southeast Asia'
  },
  {
    value: 'Asia/Ho_Chi_Minh (UTC+07:00)',
    label: 'Asia/Ho_Chi_Minh (UTC+07:00) — Vietnam Facilities',
    region: 'Southeast Asia'
  },
  {
    value: 'Asia/Jakarta (UTC+07:00)',
    label: 'Asia/Jakarta (UTC+07:00) — Indonesia Western',
    region: 'Southeast Asia'
  },
  {
    value: 'Europe/Berlin (UTC+01:00)',
    label: 'Europe/Berlin (UTC+01:00 / UTC+02:00) — Central Europe',
    region: 'Europe'
  },
  {
    value: 'Europe/London (UTC+00:00)',
    label: 'Europe/London (UTC+00:00 / UTC+01:00) — UK Operations',
    region: 'Europe'
  },
  {
    value: 'America/New_York (UTC-05:00)',
    label: 'America/New_York (UTC-05:00 / UTC-04:00) — US Eastern',
    region: 'Americas'
  },
  {
    value: 'America/Chicago (UTC-06:00)',
    label: 'America/Chicago (UTC-06:00 / UTC-05:00) — US Central',
    region: 'Americas'
  },
  {
    value: 'America/Los_Angeles (UTC-08:00)',
    label: 'America/Los_Angeles (UTC-08:00 / UTC-07:00) — US Pacific / Silicon Valley',
    region: 'Americas'
  },
  {
    value: 'UTC (UTC+00:00)',
    label: 'UTC (UTC+00:00) — Coordinated Universal Time',
    region: 'Global Standard'
  }
];
