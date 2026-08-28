import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { getTimingGroups } from '~/logic/HTTPArchive/timings';
import WaterfallTooltip from './WaterfallTooltip';
import styles from './waterfall.scss';

const minBarWidthPercent = 0.5;

const closeDelayMs = 120;

interface IComponentProps {
  item: IRequest,
  timelineStart: number,
  timelineEnd: number,
  now: number,
}

const Waterfall = ({ item, timelineStart, timelineEnd, now }: IComponentProps) => {
  const [anchor, setAnchor] = useState<DOMRect>(null);
  const [highlightedPhase, setHighlightedPhase] = useState<string>(null);
  const closeTimer = useRef<number>(0);

  const timelineDuration = Math.max(timelineEnd - timelineStart, 1);
  const offsetMs = item.startTime - timelineStart;
  const offset = Math.min(Math.max((offsetMs / timelineDuration) * 100, 0), 100);
  const elapsedMs = item.isPending ? now - item.startTime : item.time;
  const width = item.isPending
    ? Math.max(((now - item.startTime) / timelineDuration) * 100, minBarWidthPercent)
    : Math.max((item.time / timelineDuration) * 100, minBarWidthPercent);

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
      { ...(hasTimings ? {} : {
        title: (() => {
          if (item.isPending) {
            return `+${ Math.round(offsetMs) } ms · pending for ${ Math.round(elapsedMs) } ms`;
          }

          return item.isWebSocket
            ? `+${ Math.round(offsetMs) } ms`
            : `+${ Math.round(offsetMs) } ms · ${ Math.ceil(item.time) } ms`;
        })()
      }) }
    >
      <div
        className={ cn(styles.bar, {
          [styles.tick]: item.isWebSocket,
          [styles.isSegmented]: isSegmented,
          [styles.isPending]: item.isPending
        }) }
        style={ {
          left: `${ offset }%`,
          ...(item.isWebSocket ? {} : { width: `${ width }%` })
        } }
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
