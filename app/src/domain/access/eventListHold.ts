const KEY = "biyeflow.holdEvents";

/** Logout keeps the host on the event list until they open one. */
export function holdEventList() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export function eventListHeld() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function clearEventListHold() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
