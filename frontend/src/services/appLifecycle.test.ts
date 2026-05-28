import { consumeLandingReturnFlag, exitAppToLanding } from './appLifecycle';

describe('appLifecycle', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: jest.fn(),
        reload: jest.fn()
      }
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  it('exitAppToLanding sets return flag and navigates home', () => {
    exitAppToLanding();
    expect(sessionStorage.getItem('suecao-return-landing')).toBe('1');
    expect(window.location.assign).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('consumeLandingReturnFlag clears flag once', () => {
    sessionStorage.setItem('suecao-return-landing', '1');
    expect(consumeLandingReturnFlag()).toBe(true);
    expect(consumeLandingReturnFlag()).toBe(false);
    expect(sessionStorage.getItem('suecao-return-landing')).toBeNull();
  });
});
