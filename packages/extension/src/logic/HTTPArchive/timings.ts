import { IRequestTimings } from '~/logic/HTTPArchive/IRequest';

export enum TimingTone {
  Idle = 'idle',
  Send = 'send',
  Wait = 'wait',
  Download = 'download',
}

export interface ITimingPhase {
  label: string,
  duration: number,
  offset: number,
  tone: TimingTone,
  isNested?: boolean,
}

export interface ITimingGroup {
  label: string,
  phases: ITimingPhase[],
}

const isMeasured = (value?: number): boolean => typeof value === 'number' && value >= 0;

const formatDuration = (ms: number): string => (
  ms >= 1000 ? `${ (ms / 1000).toFixed(2) } s` : `${ ms.toFixed(2) } ms`
);

export const formatTiming = formatDuration;

export const getTimingGroups = (
  timings: IRequestTimings
): { groups: ITimingGroup[], total: number } => {
  if (!timings) {
    return { groups: [], total: 0 };
  }

  const queueing = isMeasured(timings.queueing) ? timings.queueing : 0;
  const stalled = isMeasured(timings.blocked) ? Math.max(timings.blocked - queueing, 0) : -1;

  const sequence: { group: string, label: string, duration: number, tone: TimingTone }[] = [
    { group: 'Resource Scheduling', label: 'Queueing', duration: timings.queueing, tone: TimingTone.Idle },
    { group: 'Connection Start', label: 'Stalled', duration: stalled, tone: TimingTone.Idle },
    { group: 'Connection Start', label: 'DNS Lookup', duration: timings.dns, tone: TimingTone.Idle },
    { group: 'Connection Start', label: 'Initial connection', duration: timings.connect, tone: TimingTone.Idle },
    { group: 'Request/Response', label: 'Request sent', duration: timings.send, tone: TimingTone.Send },
    { group: 'Request/Response', label: 'Waiting for server response', duration: timings.wait, tone: TimingTone.Wait },
    { group: 'Request/Response', label: 'Content Download', duration: timings.receive, tone: TimingTone.Download }
  ];

  const phases: (ITimingPhase & { group: string })[] = [];
  let offset = 0;

  sequence.forEach(({ group, label, duration, tone }) => {
    if (!isMeasured(duration)) {
      return;
    }

    phases.push({ group, label, duration, offset, tone });
    offset += duration;
  });

  const connectPhase = phases.find(({ label }) => label === 'Initial connection');

  if (connectPhase && isMeasured(timings.ssl)) {
    const ssl = Math.min(timings.ssl, connectPhase.duration);

    phases.splice(phases.indexOf(connectPhase) + 1, 0, {
      group: 'Connection Start',
      label: 'SSL',
      duration: ssl,
      offset: connectPhase.offset + connectPhase.duration - ssl,
      tone: TimingTone.Idle,
      isNested: true
    });
  }

  const groups: ITimingGroup[] = [];

  phases.forEach(({ group, ...phase }) => {
    const existing = groups.find(({ label }) => label === group);

    if (existing) {
      existing.phases.push(phase);
      return;
    }

    groups.push({ label: group, phases: [phase] });
  });

  return { groups, total: offset };
};
