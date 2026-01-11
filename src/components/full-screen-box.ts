import type { Component } from "../tui.js";
import { applyBackgroundToLine, visibleWidth } from "../utils.js";

/**
 * FullScreenBox component - a container that fills the terminal height
 *
 * - Width: always terminal width
 * - Height: max(content lines, terminal rows)
 *
 * If content has fewer lines than terminal height, the box fills the terminal.
 * If content has more lines, the box expands to fit all content (scrollable).
 */
export class FullScreenBox implements Component {
	children: Component[] = [];
	private getTerminalHeight: () => number;
	private paddingX: number;
	private paddingY: number;
	private bgFn?: (text: string) => string;

	// Cache for rendered output
	private cachedWidth?: number;
	private cachedHeight?: number;
	private cachedChildLines?: string;
	private cachedBgSample?: string;
	private cachedLines?: string[];

	constructor(
		getTerminalHeight: () => number,
		paddingX = 0,
		paddingY = 0,
		bgFn?: (text: string) => string
	) {
		this.getTerminalHeight = getTerminalHeight;
		this.paddingX = paddingX;
		this.paddingY = paddingY;
		this.bgFn = bgFn;
	}

	addChild(component: Component): void {
		this.children.push(component);
		this.invalidateCache();
	}

	removeChild(component: Component): void {
		const index = this.children.indexOf(component);
		if (index !== -1) {
			this.children.splice(index, 1);
			this.invalidateCache();
		}
	}

	clear(): void {
		this.children = [];
		this.invalidateCache();
	}

	setBgFn(bgFn?: (text: string) => string): void {
		this.bgFn = bgFn;
		this.invalidateCache();
	}

	private invalidateCache(): void {
		this.cachedWidth = undefined;
		this.cachedHeight = undefined;
		this.cachedChildLines = undefined;
		this.cachedBgSample = undefined;
		this.cachedLines = undefined;
	}

	invalidate(): void {
		this.invalidateCache();
		for (const child of this.children) {
			child.invalidate?.();
		}
	}

	render(width: number): string[] {
		const terminalHeight = this.getTerminalHeight();
		const contentWidth = Math.max(1, width - this.paddingX * 2);
		const leftPad = " ".repeat(this.paddingX);

		// Render all children
		const childLines: string[] = [];
		for (const child of this.children) {
			const lines = child.render(contentWidth);
			for (const line of lines) {
				childLines.push(leftPad + line);
			}
		}

		// Calculate total content height including padding
		const contentHeight = childLines.length + this.paddingY * 2;

		// Target height: max of content height and terminal height
		const targetHeight = Math.max(contentHeight, terminalHeight);

		// Check if bgFn output changed by sampling
		const bgSample = this.bgFn ? this.bgFn("test") : undefined;

		// Check cache validity
		const childLinesKey = childLines.join("\n");
		if (
			this.cachedLines &&
			this.cachedWidth === width &&
			this.cachedHeight === terminalHeight &&
			this.cachedChildLines === childLinesKey &&
			this.cachedBgSample === bgSample
		) {
			return this.cachedLines;
		}

		// Build result with background
		const result: string[] = [];

		// Top padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(this.applyBg("", width));
		}

		// Content
		for (const line of childLines) {
			result.push(this.applyBg(line, width));
		}

		// Bottom padding
		for (let i = 0; i < this.paddingY; i++) {
			result.push(this.applyBg("", width));
		}

		// Fill remaining space to reach target height
		const remainingLines = targetHeight - result.length;
		for (let i = 0; i < remainingLines; i++) {
			result.push(this.applyBg("", width));
		}

		// Safety check: always ensure at least terminalHeight lines
		// This handles edge cases where content is close to terminal height
		while (result.length < terminalHeight) {
			result.push(this.applyBg("", width));
		}

		// Update cache
		this.cachedWidth = width;
		this.cachedHeight = terminalHeight;
		this.cachedChildLines = childLinesKey;
		this.cachedBgSample = bgSample;
		this.cachedLines = result;

		return result;
	}

	private applyBg(line: string, width: number): string {
		const visLen = visibleWidth(line);
		const padNeeded = Math.max(0, width - visLen);
		const padded = line + " ".repeat(padNeeded);

		if (this.bgFn) {
			return applyBackgroundToLine(padded, width, this.bgFn);
		}
		return padded;
	}
}
