import { isCtrlC, isCtrlP, isEscape } from "../keys.js";
import type { Component } from "../tui.js";
import { padToWidth, visibleWidth } from "../utils.js";

/**
 * Theme for the Modal component
 */
export interface ModalTheme {
	/** Style for the modal border characters (only used if showBorder is true) */
	border: (text: string) => string;
	/** Background color/style for the modal content area */
	background: (text: string) => string;
	/** Style for the modal title text */
	title: (text: string) => string;
	/** Style for the close hint text (e.g., "esc") */
	closeHint: (text: string) => string;
	/** Style for the separator line below header */
	separator?: (text: string) => string;
}

/**
 * Options for the Modal component
 */
export interface ModalComponentOptions {
	/** Title displayed in the modal header */
	title?: string;
	/** Close hint displayed on the right side of header (e.g., "esc") */
	closeHint?: string;
	/** Whether to show the header with title and close hint. Defaults to true. */
	showHeader?: boolean;
	/** Whether to show the outer border. Defaults to false. */
	showBorder?: boolean;
	/** Horizontal padding (left and right). Defaults to 2. */
	paddingX?: number;
	/** Vertical padding (top and bottom). Defaults to 1. */
	paddingY?: number;
	/** Whether to show separator line below header. Defaults to true. */
	showSeparator?: boolean;
}

/**
 * Modal component - a centered overlay container with borders and header
 *
 * The Modal renders as a bordered box with:
 * - Optional header line with title and close hint
 * - Child components rendered in the content area
 * - Handles Escape key to trigger onClose callback
 *
 * Note: The Modal itself just renders content. The TUI class handles
 * the actual overlay compositing when showModal() is called.
 */
export class Modal implements Component {
	private children: Component[] = [];
	private focusedChildIndex: number = 0;
	private theme: ModalTheme;
	private options: ModalComponentOptions;

	/** Callback when modal should close (Escape pressed) */
	public onClose?: () => void;

	constructor(theme: ModalTheme, options: ModalComponentOptions = {}) {
		this.theme = theme;
		this.options = {
			showHeader: true,
			showBorder: false,
			paddingX: 2,
			paddingY: 1,
			showSeparator: true,
			...options,
		};
	}

	/**
	 * Add a child component to the modal content area
	 */
	addChild(child: Component): void {
		this.children.push(child);
	}

	/**
	 * Remove a child component
	 */
	removeChild(child: Component): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.children.splice(index, 1);
			if (this.focusedChildIndex >= this.children.length) {
				this.focusedChildIndex = Math.max(0, this.children.length - 1);
			}
		}
	}

	/**
	 * Clear all children
	 */
	clear(): void {
		this.children = [];
		this.focusedChildIndex = 0;
	}

	/**
	 * Set which child component receives keyboard input
	 */
	setFocusedChild(child: Component): void {
		const index = this.children.indexOf(child);
		if (index !== -1) {
			this.focusedChildIndex = index;
		}
	}

	/**
	 * Get the currently focused child component
	 */
	getFocusedChild(): Component | null {
		return this.children[this.focusedChildIndex] ?? null;
	}

	/**
	 * Update the modal title
	 */
	setTitle(title: string): void {
		this.options.title = title;
	}

	/**
	 * Update the close hint text
	 */
	setCloseHint(hint: string): void {
		this.options.closeHint = hint;
	}

	invalidate(): void {
		for (const child of this.children) {
			child.invalidate?.();
		}
	}

	render(width: number): string[] {
		const { showHeader, showBorder, paddingX = 2, paddingY = 1, showSeparator = true } = this.options;
		const result: string[] = [];

		// Calculate content width (accounting for borders and padding)
		const borderWidth = showBorder ? 2 : 0; // 1 char each side
		const horizontalPadding = paddingX * 2;
		const contentWidth = Math.max(1, width - borderWidth - horizontalPadding);

		// Helper to create a padded line with background
		const makeLine = (content: string): string => {
			const padding = " ".repeat(paddingX);
			const paddedContent = padding + padToWidth(content, contentWidth) + padding;
			if (showBorder) {
				return this.theme.border("│") + this.theme.background(paddedContent) + this.theme.border("│");
			}
			return this.theme.background(paddedContent);
		};

		// Helper to create an empty padded line
		const makeEmptyLine = (): string => {
			return makeLine("");
		};

		// Top border if shown
		if (showBorder) {
			const innerWidth = width - 2;
			result.push(this.theme.border("┌" + "─".repeat(innerWidth) + "┐"));
		}

		// Top padding
		for (let i = 0; i < paddingY; i++) {
			result.push(makeEmptyLine());
		}

		// Build header if shown
		if (showHeader) {
			const title = this.options.title ?? "";
			const hint = this.options.closeHint ?? "esc";
			const titleStyled = this.theme.title(title);
			const hintStyled = this.theme.closeHint(hint);

			// Calculate spacing between title and hint
			const titleWidth = visibleWidth(title);
			const hintWidth = visibleWidth(hint);
			const spacingNeeded = Math.max(1, contentWidth - titleWidth - hintWidth);
			const spacing = " ".repeat(spacingNeeded);

			const headerContent = titleStyled + spacing + hintStyled;
			result.push(makeLine(headerContent));

			// Separator line below header
			if (showSeparator) {
				const separatorChar = "─";
				const separatorLine = separatorChar.repeat(contentWidth);
				const separatorStyled = this.theme.separator
					? this.theme.separator(separatorLine)
					: this.theme.border(separatorLine);
				result.push(makeLine(separatorStyled));
			}
		}

		// Render children content
		for (const child of this.children) {
			const childLines = child.render(contentWidth);
			for (const line of childLines) {
				result.push(makeLine(line));
			}
		}

		// Bottom padding
		for (let i = 0; i < paddingY; i++) {
			result.push(makeEmptyLine());
		}

		// Bottom border if shown
		if (showBorder) {
			const innerWidth = width - 2;
			result.push(this.theme.border("└" + "─".repeat(innerWidth) + "┘"));
		}

		return result;
	}

	handleInput(data: string): void {
		// Escape or Ctrl+C closes modal
		if (isEscape(data) || isCtrlC(data) || isCtrlP(data)) {
			this.onClose?.();
			return;
		}

		// Forward input to focused child
		const focusedChild = this.children[this.focusedChildIndex];
		if (focusedChild?.handleInput) {
			focusedChild.handleInput(data);
		}
	}
}
