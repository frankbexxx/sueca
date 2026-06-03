import { CardDecisionLogEvent, LogSessionMeta } from '../types/logEvents';
import { LogStore } from './logStore.localStorage';
import { appendLogEvent, setLogStoreForTests } from './logStore';

describe('logStore appendLogEvent', () => {
  afterEach(() => {
    setLogStoreForTests(null);
  });

  it('writes through injected store', async () => {
    const events: CardDecisionLogEvent[] = [];
    const mockStore: LogStore = {
      appendEvent: async (event) => {
        events.push(event);
      },
    };
    setLogStoreForTests(mockStore);

    const event = {
      eventId: 'e1',
    } as CardDecisionLogEvent;
    const meta = {
      sessionId: 's1',
    } as LogSessionMeta;

    await appendLogEvent(event, meta);
    expect(events).toHaveLength(1);
    expect(events[0].eventId).toBe('e1');
  });
});
