import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '../lib/httpClient';
import { aiAgentService } from './aiAgentService';

describe('aiAgentService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(httpClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it('POSTs a question to /ask with the extended AI timeout and returns the answer', async () => {
    mock.onPost('/ask', { question: 'Quantos estados existem?' }).reply(200, {
      answer: 'O Brasil tem 27 unidades federativas.',
    });

    const result = await aiAgentService.ask('Quantos estados existem?');

    expect(result).toEqual({ answer: 'O Brasil tem 27 unidades federativas.' });
    expect(mock.history.post[0].url).toBe('/ask');
    expect(mock.history.post[0].data).toBe(
      JSON.stringify({ question: 'Quantos estados existem?' }),
    );
    expect(mock.history.post[0].timeout).toBe(60_000);
  });
});
