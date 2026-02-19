/// <reference lib="webworker" />

type CsvRow = {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: string;
  timestamp: string;
};

type MessageIn = {
  header: string;
  lines: string[];
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event: MessageEvent<MessageIn>) => {
  const { header, lines } = event.data;
  try {
    const headers = header.split(',').map((h) => h.trim());
    const senderIdx = headers.indexOf('sender_id');
    const receiverIdx = headers.indexOf('receiver_id');
    const idIdx = headers.indexOf('transaction_id');
    const amountIdx = headers.indexOf('amount');
    const timeIdx = headers.indexOf('timestamp');

    if (senderIdx === -1 || receiverIdx === -1) {
      ctx.postMessage({ rows: [] as CsvRow[] });
      return;
    }

    const rows: CsvRow[] = lines
      .filter(Boolean)
      .map((line) => {
        const cells = line.split(',').map((c) => c.trim());
        return {
          transaction_id: cells[idIdx] ?? '',
          sender_id: cells[senderIdx] ?? '',
          receiver_id: cells[receiverIdx] ?? '',
          amount: cells[amountIdx] ?? '',
          timestamp: cells[timeIdx] ?? '',
        };
      });

    ctx.postMessage({ rows });
  } catch (error) {
    ctx.postMessage({ error: error instanceof Error ? error.message : 'Parse failed', rows: [] });
  }
};

export {};
