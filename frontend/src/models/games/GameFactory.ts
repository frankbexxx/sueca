import { GameAdapter } from './GameAdapter';
import { GameVariant } from '../../types/game';
import { SuecaGame } from './SuecaGame';
import { SpadesGame } from './SpadesGame';
import { HeartsGame } from './HeartsGame';
import { KingGame } from './KingGame';

export class GameFactory {
  private static adapters: Map<GameVariant, GameAdapter> = new Map([
    ['sueca', new SuecaGame()],
    ['spades', new SpadesGame()],
    ['hearts', new HeartsGame()],
    ['king', new KingGame()]
  ]);

  static getAdapter(variant: GameVariant): GameAdapter {
    const adapter = this.adapters.get(variant);
    if (!adapter) {
      throw new Error(`Unknown game variant: ${variant}`);
    }
    return adapter;
  }

  static registerAdapter(variant: GameVariant, adapter: GameAdapter): void {
    this.adapters.set(variant, adapter);
  }

  static getSupportedVariants(): GameVariant[] {
    return Array.from(this.adapters.keys());
  }
}
