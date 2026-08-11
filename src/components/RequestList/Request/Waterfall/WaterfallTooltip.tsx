import React, { useLayoutEffect, useRef, useState } from 'react';
import cn from 'classnames';
import Portal from '~/components/common/Portal';
import { ITimingGroup, formatTiming } from '~/logic/HTTPArchive/timings';
import styles from './waterfallTooltip.scss';

const viewportPadding = 8;
const anchorGap = 4;

interface IComponentProps {
  anchor: DOMRect,
  startedAt: number,
  groups: ITimingGroup[],
  total: number,
  highlightedPhase: string,
  onPhaseHover: (label: string) => void,
  onKeepOpen: () => void,
  onRequestClose: () => void,
}

const WaterfallTooltip = ({
  anchor,
  startedAt,
  groups,
  total,
  highlightedPhase,
  onPhaseHover,
  onKeepOpen,
  onRequestClose
}: IComponentProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number, top: number }>(null);

  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;

    if (!tooltip) {
      return;
    }

    const { width, height } = tooltip.getBoundingClientRect();
    const fitsBelow = anchor.bottom + anchorGap + height + viewportPadding <= window.innerHeight;

    setPosition({
      left: Math.min(
        Math.max(anchor.left, viewportPadding),
        Math.max(window.innerWidth - width - viewportPadding, viewportPadding)
      ),
      top: fitsBelow
        ? anchor.bottom + anchorGap
        : Math.max(anchor.top - height - anchorGap, viewportPadding)
    });
  }, [anchor, groups]);

  return (
    <Portal>
      <div
        ref={ tooltipRef }
        className={ styles.tooltip }
        onMouseEnter={ onKeepOpen }
        onMouseLeave={ onRequestClose }
        onMouseDown={ onRequestClose }
        style={ {
          left: position ? position.left : 0,
          top: position ? position.top : 0,
          visibility: position ? 'visible' : 'hidden'
        } }
      >
        <div className={ styles.startedAt }>
          { `Started at +${ formatTiming(startedAt) }` }
        </div>
        { groups.map((group) => (
          <div key={ group.label } className={ styles.group }>
            <div className={ styles.groupHeader }>
              <span>{ group.label }</span>
              <span>DURATION</span>
            </div>
            { group.phases.map((phase) => (
              <div
                key={ phase.label }
                className={ cn(styles.phase, {
                  [styles.isHighlighted]: highlightedPhase === phase.label,
                  [styles.isDimmed]: !!highlightedPhase && highlightedPhase !== phase.label
                }) }
                onMouseEnter={ () => onPhaseHover(phase.label) }
                onMouseLeave={ () => onPhaseHover(null) }
              >
                <span className={ cn(styles.phaseLabel, { [styles.isNested]: phase.isNested }) }>
                  { phase.label }
                </span>
                <span className={ styles.phaseChart }>
                  <span
                    className={ cn(styles.phaseBar, styles[phase.tone]) }
                    style={ {
                      left: `${ total ? (phase.offset / total) * 100 : 0 }%`,
                      width: `${ total ? (phase.duration / total) * 100 : 0 }%`
                    } }
                  />
                </span>
                <span className={ styles.phaseDuration }>{ formatTiming(phase.duration) }</span>
              </div>
            )) }
          </div>
        )) }
        <div className={ styles.total }>
          <span>Total</span>
          <span>{ formatTiming(total) }</span>
        </div>
      </div>
    </Portal>
  );
};

export default WaterfallTooltip;
