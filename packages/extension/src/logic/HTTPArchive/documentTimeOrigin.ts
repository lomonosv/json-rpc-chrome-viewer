/**
 * Resolves the inspected document's `performance.timeOrigin` — epoch ms at
 * which its navigation started — or `null` when it cannot be read (a
 * restricted page, an orphaned panel).
 *
 * It is fixed for the life of a document, and every request that document
 * makes starts after it, which is what lets the clear-on-navigate cut the list
 * by time instead of guessing which `onNavigated` belongs to which page.
 */
export const getDocumentTimeOrigin = (): Promise<number | null> => new Promise((resolve) => {
  try {
    chrome.devtools.inspectedWindow.eval<number>('performance.timeOrigin', (result, exceptionInfo) => {
      resolve(!exceptionInfo && typeof result === 'number' ? result : null);
    });
  } catch {
    resolve(null);
  }
});
