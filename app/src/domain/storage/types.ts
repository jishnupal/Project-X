import type { WeddingState } from "../types";

export interface WeddingRepository {
  load(): WeddingState;
  save(state: WeddingState): void;
  exportBackup(): Blob;
  importBackup(file: File): Promise<WeddingState>;
}
