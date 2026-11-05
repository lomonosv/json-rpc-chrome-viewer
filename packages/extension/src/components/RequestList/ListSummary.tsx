import React, { useMemo } from 'react';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { formatDuration, formatSize, getListSummary } from '~/logic/HTTPArchive/summary';
import styles from './requestList.scss';

interface IComponentProps {
  requests: IRequest[],
  timelineSpan: number,
}

const ListSummary = ({ requests, timelineSpan }: IComponentProps) => {
  const { count, errors, slow, size } = useMemo(() => getListSummary(requests), [requests]);

  return (
    <div className={ styles.listSummary }>
      <span>{ count } { count === 1 ? 'request' : 'requests' }</span>
      { !!errors && (
        <span className={ styles.summaryErrors }>{ errors } { errors === 1 ? 'error' : 'errors' }</span>
      ) }
      { !!slow && (
        <span className={ styles.summarySlow } title="Calls that took 1 s or longer">{ slow } slow</span>
      ) }
      <span title="Response bodies, as reported by the network">{ formatSize(size) }</span>
      { count > 1 && (
        <span
          className={ styles.summarySpan }
          title="From the first request's start to the last one's end"
        >
          { formatDuration(timelineSpan) } span
        </span>
      ) }
    </div>
  );
};

export default ListSummary;
