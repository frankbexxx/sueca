export class DevLabScenarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DevLabScenarioError';
  }
}
