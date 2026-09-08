export const hexToRgba = (hex: string, alpha = 0.5) => {
	const normalized = hex.replace('#', '')
	const full =
		normalized.length === 3
			? normalized
					.split('')
					.map((char) => char + char)
					.join('')
			: normalized
	const r = Number.parseInt(full.slice(0, 2), 16)
	const g = Number.parseInt(full.slice(2, 4), 16)
	const b = Number.parseInt(full.slice(4, 6), 16)
	return `rgba(${r}, ${g}, ${b}, ${alpha})`
}