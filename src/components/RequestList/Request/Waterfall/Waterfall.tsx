import React from 'react';
import cn from 'classnames';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import styles from './waterfall.scss';

const minBarWidthPercent = 0.5;

interface IComponentProps {
  item: IRequest,
  timelineStart: number,
  timelineEnd: number,
}

const Waterfall = ({ item, timelineStart, timelineEnd }: IComponentProps) => {
  const timelineDuration = Math.max(timelineEnd - timelineStart, 1);
  const offsetMs = item.startTime - timelineStart;
  const offset = Math.min(Math.max((offsetMs / timelineDuration) * 100, 0), 100);
  const width = Math.max((item.time / timelineDuration) * 100, minBarWidthPercent);

  return (
    <div
      className={ styles.waterfall }
      title={
        item.isWebSocket
          ? `+${ Math.round(offsetMs) } ms`
          : `+${ Math.round(offsetMs) } ms · ${ Math.ceil(item.time) } ms`
      }
    >
      <div
        className={ cn(styles.bar, { [styles.tick]: item.isWebSocket }) }
        style={ {
          left: `${ offset }%`,
          ...(item.isWebSocket ? {} : { width: `${ width }%` })
        } }
      />
    </div>
  );
};

export default Waterfall;
