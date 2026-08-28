import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { getConfig } from '~/logic/common/helpers';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import styles from './feedbackPrompt.scss';

const actions = [
  {
    id: 'rate',
    label: 'Rate it',
    url: 'https://chromewebstore.google.com/detail/json-rpc-chrome-viewer/bfkookcjhlalpmeedppachhdkhmflbah'
  },
  {
    id: 'star',
    label: 'Star on GitHub',
    url: 'https://github.com/lomonosv/json-rpc-chrome-viewer'
  }
];

const requestsThreshold = 25;
const minimumUsageDays = 3;
const dayMs = 24 * 60 * 60 * 1000;

const appearanceDelayMs = 4000;

const closeAfterBothMs = 1600;

const FeedbackPrompt = () => {
  const { requests } = useRequestContext();
  const [isVisible, setIsVisible] = useState(false);
  const [doneActionIds, setDoneActionIds] = useState<string[]>([]);
  const isCheckedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    getConfig('feedback_firstUsedAt', Date.now());

    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (isCheckedRef.current) {
      return;
    }

    Promise.all([
      getConfig('feedback_forcePrompt', false),
      getConfig('feedback_promptShown', false),
      getConfig('feedback_firstUsedAt', Date.now())
    ]).then(([isForced, isShown, firstUsedAt]) => {
      if (isForced) {
        isCheckedRef.current = true;
        setIsVisible(true);

        return;
      }

      if (isShown || requests.length < requestsThreshold) {
        return;
      }

      if (Date.now() - Number(firstUsedAt) < minimumUsageDays * dayMs) {
        isCheckedRef.current = true;

        return;
      }

      isCheckedRef.current = true;

      timeoutRef.current = setTimeout(() => {
        chrome.storage.local.set({ feedback_promptShown: true });
        setIsVisible(true);
      }, appearanceDelayMs);
    });
  }, [requests.length]);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    if (doneActionIds.length < actions.length) {
      return undefined;
    }

    const timeout = setTimeout(() => setIsVisible(false), closeAfterBothMs);

    return () => clearTimeout(timeout);
  }, [doneActionIds.length]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAction = (id: string, url: string) => () => {
    chrome.tabs.create({ url });
    setDoneActionIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className={ styles.prompt }
      role="status"
    >
      <Button
        className={ styles.closeButton }
        title="Dismiss"
        onClick={ handleClose }
      >
        <Icon type={ IconType.Close } />
      </Button>
      <p className={ styles.title }>Finding this useful?</p>
      <p className={ styles.text }>
        It is a side project - a rating is what helps other developers find it.
      </p>
      <div className={ styles.actions }>
        { actions.map(({ id, label, url }) => {
          const isDone = doneActionIds.includes(id);

          return (
            <Button
              key={ id }
              className={ cn(styles.action, { [styles.isDone]: isDone }) }
              onClick={ isDone ? undefined : handleAction(id, url) }
            >
              { /* Always rendered, only revealed once done, so marking an
                   action does not resize the button under the pointer. */ }
              <span className={ styles.check }>✓</span>
              { label }
            </Button>
          );
        }) }
      </div>
      <p className={ styles.footnote }>
        { doneActionIds.length ? 'Thank you.' : 'You will not be asked again.' }
      </p>
    </aside>
  );
};

export default FeedbackPrompt;
