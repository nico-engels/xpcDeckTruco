export abstract class BaseRepository {
  public abstract initializeDbEngine(): Promise<void>;
};