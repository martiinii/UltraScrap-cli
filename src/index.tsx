import { render } from "ink";
import App from "./ui/App.tsx";

const ENTER_ALTERNATE_SCREEN = "\u001b[?1049h";
const LEAVE_ALTERNATE_SCREEN = "\u001b[?1049l";
const CLEAR_SCREEN = "\u001b[2J"; // clear entire screen
const CURSOR_HOME = "\u001b[H"; // move cursor to 1;1

// Enter alternate screen so previous content is preserved and hidden,
// then clear and move cursor to the top-left to avoid inheriting the previous row.
process.stdout.write(ENTER_ALTERNATE_SCREEN + CLEAR_SCREEN + CURSOR_HOME);

const instance = render(<App />);

// Ensure we restore previous content when the app exits
instance.waitUntilExit().finally(() => {
  try {
    process.stdout.write(LEAVE_ALTERNATE_SCREEN);
  } catch {}
});
