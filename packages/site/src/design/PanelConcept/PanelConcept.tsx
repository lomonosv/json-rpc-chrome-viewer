'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Code from '~/components/ui/Code';
import Icon from '~/components/ui/Icon';
import { mockRows, serverGroup, timelineMs, type IMockRow } from './rows';
import styles from './panelMock.module.css';

const streamIntervalMs = 380;
const autoSelectIntervalMs = 3400;
const slowMs = 1000;

const formatTime = (row: IMockRow) => (row.kind === 'socket' ? '—' : `${ row.time } ms`);

function Waterfall({ row }: { row: IMockRow }) {
  const left = `${ (row.start / timelineMs) * 100 }%`;

  if (row.kind === 'socket') {
    return <span className={ styles.tick } style={ { left } } />;
  }

  const width = `${ Math.max((row.time / timelineMs) * 100, 1.5) }%`;

  if (!row.phases) {
    return <span className={ `${ styles.bar } ${ styles[row.kind] }` } style={ { left, width } } />;
  }

  const { phases } = row;

  return (
    <span className={ styles.bar } style={ { left, width } }>
      { (['idle', 'send', 'wait', 'download'] as const).map((phase) => (
        <span
          key={ phase }
          className={ `${ styles.segment } ${ styles[phase] }` }
          style={ { flexGrow: phases[phase] } }
        />
      )) }
    </span>
  );
}

function Badge({ row }: { row: IMockRow }) {
  if (row.kind === 'mock') {
    return <span className={ `${ styles.badge } ${ styles.badgeMock }` }>MOCK</span>;
  }

  if (row.kind === 'server') {
    return <span className={ `${ styles.badge } ${ styles.badgeServer }` }>SERVER</span>;
  }

  if (row.kind === 'socket') {
    return (
      <span className={ `${ styles.badge } ${ styles.badgeSocket }` }>{ row.status === '↑' ? '▲ WS' : '▼ WS' }</span>
    );
  }

  return null;
}

export default function PanelConcept() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { once: true, margin: '-60px' });
  const [shownCount, setShownCount] = useState(0);
  const [selectedId, setSelectedId] = useState('h1');
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);
  const [filter, setFilter] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!isInView || shownCount >= mockRows.length) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShownCount((count) => count + 1), streamIntervalMs);

    return () => window.clearTimeout(timer);
  }, [isInView, shownCount]);

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();

    return mockRows
      .slice(0, shownCount)
      .filter((row) => !needle || row.method.toLowerCase().includes(needle));
  }, [shownCount, filter]);

  const serverRows = rows.filter((row) => row.kind === 'server');
  const browserRows = rows.filter((row) => row.kind !== 'server');
  const navigable = [...(isGroupExpanded ? serverRows : []), ...browserRows];

  // A self-running tour until the visitor touches the panel; then it is theirs.
  useEffect(() => {
    if (hasInteracted || shownCount < mockRows.length) {
      return undefined;
    }

    const tour = mockRows.filter((row) => row.kind !== 'server');
    const timer = window.setInterval(() => {
      setSelectedId((id) => tour[(tour.findIndex((row) => row.id === id) + 1) % tour.length].id);
    }, autoSelectIntervalMs);

    return () => window.clearInterval(timer);
  }, [hasInteracted, shownCount]);

  const selected = mockRows.find((row) => row.id === selectedId) ?? mockRows[2];

  const select = (id: string) => {
    setHasInteracted(true);
    setSelectedId(id);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    const index = navigable.findIndex((row) => row.id === selectedId);
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = navigable[(index + step + navigable.length) % navigable.length];

    if (next) {
      select(next.id);
      rootRef.current?.querySelector<HTMLElement>(`[data-row="${ next.id }"]`)?.focus();
    }
  };

  const renderRow = (row: IMockRow) => {
    const isSlow = row.time >= slowMs && !row.error;

    return (
      <motion.button
        key={ row.id }
        type="button"
        data-row={ row.id }
        layout="position"
        initial={ { opacity: 0, x: -12 } }
        animate={ { opacity: 1, x: 0 } }
        exit={ { opacity: 0, height: 0 } }
        transition={ { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
        className={ [
          styles.row,
          row.kind === 'server' ? styles.serverRow : '',
          row.id === selectedId ? styles.selected : '',
          row.error ? styles.errorRow : ''
        ].join(' ') }
        onClick={ () => select(row.id) }
      >
        <span className={ styles.methodCell }>
          <span className={ styles.methodLine }>
            <Badge row={ row } />
            <span className={ styles.method }>{ row.method }</span>
          </span>
          { row.error
            ? <span className={ styles.errorLine }>{ row.error.code } { row.error.message }</span>
            : <span className={ styles.url }>{ row.url }</span> }
        </span>
        <span className={ `${ styles.cell } ${ styles.waterfallCell }` }><Waterfall row={ row } /></span>
        <span className={ `${ styles.cell } ${ styles.statusCell }` }>{ row.status }</span>
        <span className={ `${ styles.cell } ${ styles.sizeCell }` }>{ row.size }</span>
        <span className={ `${ styles.cell } ${ styles.timeCell } ${ isSlow ? styles.slow : '' }` }>
          { formatTime(row) }
        </span>
      </motion.button>
    );
  };

  return (
    <div
      ref={ rootRef }
      className={ styles.window }
      onKeyDown={ handleKeyDown }
      onPointerDown={ () => setHasInteracted(true) }
    >
      <div className={ styles.titleBar }>
        <span className={ styles.dots }><i /><i /><i /></span>
        <nav className={ styles.tabs } aria-hidden="true">
          <span>Elements</span>
          <span>Console</span>
          <span>Network</span>
          <span className={ styles.activeTab }>JSON-RPC Viewer</span>
        </nav>
      </div>

      <div className={ styles.toolbar }>
        <span className={ styles.recordDot } aria-hidden="true" />
        <label className={ styles.filter }>
          <span className={ styles.visuallyHidden }>Filter methods</span>
          <Icon name="search" size={ 13 } />
          <input
            value={ filter }
            onChange={ (event) => setFilter(event.target.value) }
            placeholder="Filter — try “eth”"
            spellCheck={ false }
          />
        </label>
        <span className={ styles.chip }>Method ▾</span>
        <span className={ styles.chip }>Aa</span>
        <span className={ `${ styles.chip } ${ styles.hideNarrow }` }>☑ Preserve log</span>
        <span className={ `${ styles.chip } ${ styles.hideNarrow }` }>☑ Websocket</span>
      </div>

      <div className={ styles.body }>
        <div className={ styles.list }>
          <div className={ styles.header }>
            <span className={ styles.methodCell }>Method</span>
            <span className={ `${ styles.cell } ${ styles.waterfallCell }` }>Waterfall ▴</span>
            <span className={ `${ styles.cell } ${ styles.statusCell }` }>Status</span>
            <span className={ `${ styles.cell } ${ styles.sizeCell }` }>Size</span>
            <span className={ `${ styles.cell } ${ styles.timeCell }` }>Time</span>
          </div>

          <div className={ styles.rows }>
            <AnimatePresence initial={ false }>
              { serverRows.length > 0 && (
                <motion.button
                  key="group"
                  type="button"
                  layout="position"
                  initial={ { opacity: 0 } }
                  animate={ { opacity: 1 } }
                  className={ styles.groupRow }
                  onClick={ () => {
                    setHasInteracted(true);
                    setIsGroupExpanded((value) => !value);
                  } }
                  aria-expanded={ isGroupExpanded }
                >
                  <span className={ `${ styles.chevron } ${ isGroupExpanded ? styles.chevronOpen : '' }` } />
                  SERVER · { serverGroup.carrier } · { serverRows.length } calls
                </motion.button>
              ) }
              { isGroupExpanded && serverRows.map(renderRow) }
              { browserRows.map(renderRow) }
            </AnimatePresence>
            { rows.length === 0 && shownCount > 0 && (
              <div className={ styles.empty }>No methods match “{ filter }”.</div>
            ) }
          </div>

          <div className={ styles.footer }>
            { navigable.length } calls · { navigable.filter((row) => row.error).length } error ·
            { ' ' }{ navigable.filter((row) => row.time >= slowMs).length } slow
          </div>
        </div>

        <div className={ styles.detail }>
          <AnimatePresence mode="wait">
            <motion.div
              key={ selected.id }
              className={ styles.detailInner }
              initial={ { opacity: 0, y: 6 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: -6 } }
              transition={ { duration: 0.22 } }
            >
              <div className={ styles.paneHeader }>
                <span>Request</span>
                <span className={ styles.paneMeta }>{ selected.method }</span>
              </div>
              <Code className={ styles.json } language="json" source={ JSON.stringify(selected.request, null, 2) } />
              <div className={ styles.paneHeader }>
                <span>Response</span>
                { selected.error && <span className={ styles.paneError }>error { selected.error.code }</span> }
                { selected.kind === 'mock' && <span className={ styles.paneMock }>answered by rule</span> }
              </div>
              <Code
                className={ styles.json }
                language="json"
                source={ selected.response === null
                  ? '// server push — no response'
                  : JSON.stringify(selected.response, null, 2) }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
