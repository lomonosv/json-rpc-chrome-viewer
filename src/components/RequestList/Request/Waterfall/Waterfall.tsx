import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { getTimingGroups } from '~/logic/HTTPArchive/timings';
import { ITimeline, getRequestEnd } from '../../timeline';
import WaterfallTooltip from './WaterfallTooltip';
import styles from './waterfall.scss';

const closeDelayMs = 120;

interface IComponentProps {
  item: IRequest,
  timeline: ITimeline,
  now: number,
}

const getGeometry = (item: IRequest, { start, span }: ITimeline, now: number) => {
  const left = Math.min(Math.max(((item.startTime - start) / span) * 100, 0), 100);
  const duration = getRequestEnd(item, now) - item.startTime;

  return { left, width: Math.min((duration / span) * 100, 100 - left) };
};

const getTitle = (item: IRequest, offsetMs: number, now: number) => {
  if (item.isPending) {
    return `+${ Math.round(offsetMs) } ms · in flight for ${ Math.round(now - item.startTime) } ms`;
  }

  return item.isWebSocket
    ? `+${ Math.round(offsetMs) } ms`
    : `+${ Math.round(offsetMs) } ms · ${ Math.ceil(item.time) } ms`;
};

const Waterfall = ({ item, timeline, now }: IComponentProps) => {
  const [anchor, setAnchor] = useState<DOMRect>(null);
  const [highlightedPhase, setHighlightedPhase] = useState<string>(null);
  const closeTimer = useRef<number>(0);

  const offsetMs = item.startTime - timeline.start;
  const { left, width } = getGeometry(item, timeline, now);

  const { groups, total } = useMemo(() => getTimingGroups(item.timings), [item.timings]);

  const hasTimings = groups.length > 0;

  const segments = useMemo(
    () => groups.flatMap(({ phases }) => phases).filter(({ isNested }) => !isNested),
    [groups]
  );

  const isSegmented = hasTimings && total > 0;

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const cancelClose = () => {
    window.clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);

    closeTimer.current = window.setTimeout(() => {
      setAnchor(null);
      setHighlightedPhase(null);
    }, closeDelayMs);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasTimings) {
      cancelClose();
      setAnchor(e.currentTarget.getBoundingClientRect());
    }
  };

  return (
    <div
      className={ styles.waterfall }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ scheduleClose }
      { ...(hasTimings ? {} : { title: getTitle(item, offsetMs, now) }) }
    >
      <div
        className={ cn(styles.bar, {
          [styles.tick]: item.isWebSocket,
          [styles.isSegmented]: isSegmented,
          [styles.isPending]: item.isPending
        }) }
        style={ item.isWebSocket
          // Shifted back by its own offset, so the newest frame is not clipped.
          ? { left: `${ left }%`, translate: `-${ left }% 0` }
          : { left: `${ left }%`, width: `${ width }%` } }
      >
        { isSegmented && segments.map((phase) => (
          <span
            key={ phase.label }
            className={ cn(styles.segment, styles[phase.tone], {
              [styles.isHighlighted]: highlightedPhase === phase.label,
              [styles.isDimmed]: !!highlightedPhase && highlightedPhase !== phase.label
            }) }
            style={ {
              left: `${ (phase.offset / total) * 100 }%`,
              width: `${ (phase.duration / total) * 100 }%`
            } }
          />
        )) }
      </div>
      { !!anchor && (
        <WaterfallTooltip
          anchor={ anchor }
          startedAt={ Math.max(offsetMs, 0) }
          groups={ groups }
          total={ total }
          highlightedPhase={ highlightedPhase }
          onPhaseHover={ setHighlightedPhase }
          onKeepOpen={ cancelClose }
          onRequestClose={ scheduleClose }
        />
      ) }
    </div>
  );
};

export default Waterfall;
