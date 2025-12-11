// Core TUI interfaces and classes

// Autocomplete support
export {
	type AutocompleteItem,
	type AutocompleteProvider,
	CombinedAutocompleteProvider,
	type SlashCommand,
} from "./autocomplete";
// Components
export { Editor, type EditorTheme } from "./components/editor";
export { Input } from "./components/input";
export { Loader } from "./components/loader";
export { type DefaultTextStyle, Markdown, type MarkdownTheme } from "./components/markdown";
export { type SelectItem, SelectList, type SelectListTheme } from "./components/select-list";
export { Spacer } from "./components/spacer";
export { Text } from "./components/text";
export { TruncatedText } from "./components/truncated-text";
// Terminal interface and implementations
export { ProcessTerminal, type Terminal } from "./terminal";
export { type Component, Container, TUI } from "./tui";
// Utilities
export { truncateToWidth, visibleWidth } from "./utils";
