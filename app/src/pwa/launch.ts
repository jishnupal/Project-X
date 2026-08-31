import { applyIosViewportFix } from "./viewport";

export async function runLaunchSequence(): Promise<void> {
  applyIosViewportFix();
}
