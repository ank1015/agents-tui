# Agents TUI

A minimal, high-performance Terminal User Interface framework designed for chat-based agent interfaces. Built for Node.js with a focus on differential rendering and clean component architecture.

## Why Build Your Own TUI?

This framework was created because existing solutions like Ink, Blessed, and OpenTUI didn't fit the needs of a streaming chat interface. Rather than fight against the terminal or write React-like TUI code, this package:

- ( Treats the terminal's scrollback buffer as a feature, not a bug
- <¯ Uses natural terminal scrolling and search functionality
- ¡ Only redraws what changed (differential rendering)
- >é Provides a simple component model with minimal overhead
- =æ Supports output streaming and real-time updates

## Quick Start

### Installation

```bash
npm install @ank1015/agents-tui
```

### Basic Usage

```typescript
import { TUI, Container, Text, Input, ProcessTerminal } from '@ank1015/agents-tui';

// Create a terminal and TUI
const terminal = new ProcessTerminal();
const tui = new TUI(terminal);

// Add components
tui.addChild(new Text("Welcome to my TUI!"));
const input = new Input("Enter something: ");
tui.addChild(input);

// Set focus and start
tui.setFocus(input);
tui.start();
```

## Architecture

### Core Concepts

**Components** are the building blocks. Every UI element is a component that implements this simple interface:

```typescript
interface Component {
  render(width: number): string[];           // Render to lines
  handleInput?(data: string): void;          // Handle keyboard input
  invalidate(): void;                        // Clear cached render
}
```

**Container** holds multiple components and renders them vertically:

```typescript
const container = new Container();
container.addChild(textComponent);
container.addChild(inputComponent);
```

**TUI** is the main orchestrator that:
- Manages the terminal connection
- Handles rendering with differential updates
- Routes keyboard input to focused component
- Tracks terminal dimensions

### Differential Rendering

The key to performance. Instead of redrawing everything every time:

1. **First render**: Output all content
2. **Normal update**: Find first changed line, move cursor there, update to end
3. **Width changed**: Full clear and re-render (soft wrapping changed)
4. **Scrolled up**: Full re-render (can't write to scrollback above viewport)

All writes are wrapped in synchronized output (`CSI ?2026h/l`) to eliminate flicker.

## Components

### Text

Display static or dynamic text with word wrapping and padding.

```typescript
import { Text } from '@ank1015/agents-tui';

const text = new Text("Hello world", paddingX = 1, paddingY = 1);
text.setText("Updated text");
tui.addChild(text);
```

**Features:**
- Word wrapping to terminal width
- ANSI color/style preservation
- Custom background function
- Padding control

---

### Input

Single-line text input with keyboard handling.

```typescript
import { Input } from '@ank1015/agents-tui';

const input = new Input("Enter text: ", theme);
input.onSubmit = (value) => {
  console.log("User entered:", value);
};
tui.setFocus(input);
```

**Features:**
- Character input and editing
- Cursor positioning
- Tab completion (with autocomplete provider)
- Enter to submit, Ctrl+C to cancel

---

### Editor

Multi-line text editor with syntax highlighting support.

```typescript
import { Editor } from '@ank1015/agents-tui';

const editor = new Editor(theme);
editor.onSubmit = (value) => {
  // User pressed Ctrl+Enter to submit
};
editor.setAutocompleteProvider(provider);
tui.setFocus(editor);
```

**Features:**
- Multi-line editing
- Autocomplete support
- Customizable theme
- Submit via Ctrl+Enter

---

### Loader

Animated spinner component for showing activity.

```typescript
import { Loader } from '@ank1015/agents-tui';

const loader = new Loader(
  tui,
  (s) => chalk.cyan(s),      // Spinner color function
  (s) => chalk.dim(s),       // Message color function
  "Loading..."
);

// Later, when done:
tui.removeChild(loader);
```

**Features:**
- 10-frame braille spinner animation
- Customizable colors via functions
- Auto-updates every 80ms

---

### Markdown

Renders markdown with syntax highlighting and colors.

```typescript
import { Markdown } from '@ank1015/agents-tui';

const md = new Markdown("# Hello\n\nThis is **bold** text", 1, 1, theme);
tui.addChild(md);
```

**Features:**
- Full markdown parsing with `marked`
- ANSI color codes for syntax highlighting
- Themeable (headers, bold, code, links, etc.)
- Preserves code block formatting

---

### SelectList

Interactive list for selecting items.

```typescript
import { SelectList, SelectItem } from '@ank1015/agents-tui';

const items: SelectItem[] = [
  { text: "Option 1", value: "opt1" },
  { text: "Option 2", value: "opt2" },
];

const list = new SelectList(items, theme);
list.onSelect = (item) => {
  console.log("Selected:", item);
};
tui.setFocus(list);
```

**Features:**
- Arrow key navigation
- Enter to select
- Customizable theme

---

### TruncatedText

Text that cuts off with ellipsis if it doesn't fit.

```typescript
import { TruncatedText } from '@ank1015/agents-tui';

const text = new TruncatedText("Very long text...", width = 20);
```

---

### Spacer

Empty space between components.

```typescript
import { Spacer } from '@ank1015/agents-tui';

tui.addChild(new Text("Top"));
tui.addChild(new Spacer(3)); // 3 empty lines
tui.addChild(new Text("Bottom"));
```

---

## Complete Example: Chat Interface

See `test/chat-simple.ts` for a working example:

```typescript
import chalk from "chalk";
import { CombinedAutocompleteProvider } from "../src/autocomplete.js";
import { Editor } from "../src/components/editor.js";
import { Loader } from "../src/components/loader.js";
import { Markdown } from "../src/components/markdown.js";
import { Text } from "../src/components/text.js";
import { ProcessTerminal } from "../src/terminal.js";
import { TUI } from "../src/tui.js";

// Create terminal and TUI
const terminal = new ProcessTerminal();
const tui = new TUI(terminal);

// Add welcome message
tui.addChild(new Text("Welcome to Simple Chat!"));

// Create editor with autocomplete
const editor = new Editor(defaultEditorTheme);
const autocompleteProvider = new CombinedAutocompleteProvider(
  [
    { name: "delete", description: "Delete the last message" },
    { name: "clear", description: "Clear all messages" },
  ],
  process.cwd(),
);
editor.setAutocompleteProvider(autocompleteProvider);
tui.addChild(editor);
tui.setFocus(editor);

// Handle submissions
editor.onSubmit = (value: string) => {
  const trimmed = value.trim();

  // Handle slash commands
  if (trimmed === "/delete") {
    const children = tui.children;
    if (children.length > 3) {
      children.splice(children.length - 2, 1);
    }
    tui.requestRender();
    return;
  }

  if (trimmed) {
    // Add user message
    tui.children.splice(
      tui.children.length - 1,
      0,
      new Markdown(value, 1, 1, defaultMarkdownTheme)
    );

    // Show loading spinner
    const loader = new Loader(
      tui,
      (s) => chalk.cyan(s),
      (s) => chalk.dim(s),
      "Thinking...",
    );
    tui.children.splice(tui.children.length - 1, 0, loader);
    tui.requestRender();

    // Simulate response
    setTimeout(() => {
      tui.removeChild(loader);
      const response = "That's interesting!";
      tui.children.splice(
        tui.children.length - 1,
        0,
        new Markdown(response, 1, 1, defaultMarkdownTheme)
      );
      tui.requestRender();
    }, 1000);
  }
};

// Start the TUI
tui.start();
```

## Testing

A virtual terminal implementation is provided for testing:

```typescript
import { VirtualTerminal } from './test/virtual-terminal';
import { TUI } from './src/tui';

const terminal = new VirtualTerminal(80, 24);
const tui = new TUI(terminal);

// Add components and test
tui.addChild(new Text("Test content"));
tui.requestRender();

// Get the rendered viewport
const viewport = await terminal.flushAndGetViewport();
```

**VirtualTerminal Methods:**
- `sendInput(data)`: Simulate keyboard input
- `resize(cols, rows)`: Change terminal dimensions
- `flushAndGetViewport()`: Get visible screen content
- `getScrollBuffer()`: Get entire scrollback
- `getCursorPosition()`: Get cursor x,y

## Terminal Interface

The framework abstracts the terminal behind a `Terminal` interface:

```typescript
interface Terminal {
  start(onInput, onResize): void;
  stop(): void;
  write(data: string): void;
  get columns(): number;
  get rows(): number;
  moveBy(lines: number): void;
  hideCursor(): void;
  showCursor(): void;
  clearLine(): void;
  clearFromCursor(): void;
  clearScreen(): void;
}
```

Two implementations provided:
- **ProcessTerminal**: Uses `process.stdin/stdout` for real terminals
- **VirtualTerminal**: Uses xterm.js for testing

## Utilities

### visibleWidth

Calculate the visible width of text with ANSI codes:

```typescript
import { visibleWidth } from '@ank1015/agents-tui';

const text = "\x1b[31mRed text\x1b[0m"; // Red + "Red text" + reset
console.log(visibleWidth(text)); // 8 (not including ANSI codes)
```

### truncateToWidth

Truncate text to fit a width while preserving ANSI codes:

```typescript
import { truncateToWidth } from '@ank1015/agents-tui';

const text = "\x1b[31mHello world\x1b[0m";
const truncated = truncateToWidth(text, 5); // "\x1b[31mHello\x1b[0m"
```

## Autocomplete

Provide autocomplete suggestions for input fields:

```typescript
import { CombinedAutocompleteProvider } from '@ank1015/agents-tui';

const provider = new CombinedAutocompleteProvider(
  [
    { name: "help", description: "Show help" },
    { name: "clear", description: "Clear screen" },
  ],
  process.cwd() // For file completion
);

editor.setAutocompleteProvider(provider);
```

**Features:**
- Slash command completion
- File/directory completion
- Customizable items

## Performance

- **Memory**: A few hundred kilobytes for large sessions (stores scrollback buffer)
- **CPU**: Minimal - components cache renders, only changed lines update
- **Rendering**: Sub-millisecond for typical updates (differential rendering)

## Flicker Behavior

Synchronized output (`CSI ?2026h/l`) eliminates flicker in capable terminals:

- **Good**: Ghostty, iTerm2, modern terminal emulators
- **Some flicker**: VS Code built-in terminal, xterm.js
- **Still better than**: Many other TUI frameworks

## Key Design Decisions

1. **Stream-based, not full-screen**: Preserves terminal scrollback and native scrolling
2. **Minimal component API**: Just `render()` and optional `handleInput()`
3. **Explicit layout**: No complex layout engine, just vertical stacking
4. **Caching strategy**: Components cache rendered output, TUI does differential rendering
5. **ANSI escape codes**: Full support for colors and styling

## File Structure

```
src/
   tui.ts              # Main TUI class with differential rendering
   terminal.ts         # Terminal interface & ProcessTerminal
   autocomplete.ts     # Autocomplete provider system
   utils.ts            # Text wrapping, width calculation
   components/
       text.ts         # Static/dynamic text
       input.ts        # Single-line input
       editor.ts       # Multi-line editor
       markdown.ts     # Markdown renderer
       loader.ts       # Spinner animation
       select-list.ts  # Item picker
       spacer.ts       # Empty space
       truncated-text.ts # Ellipsis text
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Format & type check
npm run check

# Run tests
npm run test

# Run examples
npx ts-node test/chat-simple.ts
npx ts-node test/key-tester.ts
```

## License

MIT
