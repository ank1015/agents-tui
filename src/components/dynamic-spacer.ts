import type { Component } from "../tui.js";

/**
 * DynamicSpacer component - renders a variable number of empty lines
 * based on a height getter function.
 *
 * Useful for creating flexible layouts where spacing depends on
 * terminal size or other dynamic factors.
 */
export class DynamicSpacer implements Component {
	private getHeight: () => number;

	constructor(getHeight: () => number) {
		this.getHeight = getHeight;
	}

	render(_width: number): string[] {
		const height = Math.max(0, Math.floor(this.getHeight()));
		if (height === 0) return [];
		return Array(height).fill("");
	}

	invalidate(): void {
		// No cached state
	}
}
