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
export { Image, type ImageOptions, type ImageTheme } from "./components/image";
export { Input } from "./components/input";
export { Loader } from "./components/loader";
export { type DefaultTextStyle, Markdown, type MarkdownTheme } from "./components/markdown";
export { type SelectItem, SelectList, type SelectListTheme } from "./components/select-list";
export { Spacer } from "./components/spacer";
export { Text } from "./components/text";
export { TruncatedText } from "./components/truncated-text";
// Terminal interface and implementations
export { ProcessTerminal, type Terminal } from "./terminal";
// Terminal image support
export {
	type CellDimensions,
	calculateImageRows,
	detectCapabilities,
	encodeITerm2,
	encodeKitty,
	getCapabilities,
	getCellDimensions,
	getGifDimensions,
	getImageDimensions,
	getJpegDimensions,
	getPngDimensions,
	getWebpDimensions,
	type ImageDimensions,
	type ImageProtocol,
	type ImageRenderOptions,
	imageFallback,
	renderImage,
	resetCapabilitiesCache,
	setCellDimensions,
	type TerminalCapabilities,
} from "./terminal-image";
export { type Component, Container, TUI } from "./tui";
// Utilities
export { truncateToWidth, visibleWidth } from "./utils";
