// Shared by the FAQ section and its FAQPage structured data, so the two cannot drift.
export interface IFaqItem {
  question: string,
  answer: string,
}

export const faq: IFaqItem[] = [
  {
    question: 'What is JSON-RPC Chrome Viewer?',
    answer: 'A free, open-source Chrome DevTools extension for JSON-RPC. It adds a panel that lists every '
      + 'JSON-RPC 2.0 call by its method name, with the request params paired to the response result or error.'
  },
  {
    question: 'How do I debug JSON-RPC requests in Chrome?',
    answer: 'The Network tab shows every JSON-RPC call as the same POST /rpc, so you have to open each one to '
      + 'find the method. Install the extension, open DevTools and pick the JSON-RPC Chrome Viewer tab: calls '
      + 'appear by method as they happen, with search, timing and errors marked red.'
  },
  {
    question: 'Does it capture JSON-RPC over WebSocket?',
    answer: 'Yes. WebSocket frames land in the same list as HTTP calls, SockJS included, with the direction of '
      + 'each frame marked. Batch requests are split into one row per call.'
  },
  {
    question: 'Can I mock a JSON-RPC response?',
    answer: 'Yes. The response interceptor answers a method - matched exactly or by a glob pattern - with your '
      + 'own result or error, HTTP status and delay, without touching the network or your backend.'
  },
  {
    question: 'Does it work with Ethereum and other web3 JSON-RPC APIs?',
    answer: 'Yes. It works with any JSON-RPC 2.0 API: Ethereum methods such as eth_call and eth_getBalance, '
      + 'other blockchain nodes, wallets, and your own services.'
  },
  {
    question: 'Can I see JSON-RPC calls made by my server?',
    answer: 'Yes, with the optional @json-rpc-chrome-viewer/server-logger package. Calls your server makes while '
      + 'rendering a page (SSR, BFF) are reported to the panel, grouped under the page load that made them. '
      + 'It is one line in a Next.js app and runs only in development.'
  },
  {
    question: 'Is it free, and is my data private?',
    answer: 'It is free and open source under the MIT licence. Captured traffic stays in the DevTools panel and '
      + 'is never sent anywhere.'
  }
];
