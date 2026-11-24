const upperBrackets = ['⌜', '⌝'];
const bracketsByPlace = new Map([
	['above', upperBrackets],
	['below', ['⌞', '⌟']],
	['inline', ['⌜', '⌟']],
	['over', ['{', '}']],
	['margin', ['‹', '›']]
]);

/** @param {Element} addition */
export function markAddition(addition) {
	if (addition.querySelector(':scope > .addition_wrapper')) return;

	const place = addition.getAttribute('place') ?? '';
	const deleted = addition.closest('tei-del') !== null;
	const brackets =
		deleted && place === 'inline'
			? upperBrackets
			: (bracketsByPlace.get(place) ?? (deleted ? upperBrackets : undefined));
	if (!brackets) return;

	const [start, end] = brackets.map((glyph) => {
		const marker = addition.ownerDocument.createElement('span');
		marker.className = 'addition_wrapper';
		marker.textContent = glyph;
		return marker;
	});

	const firstContent = Array.from(addition.childNodes).find(
		(node) => node.nodeType === 1 || (node.nodeType === 3 && node.textContent?.trim())
	);
	if (place === 'margin' && firstContent?.nodeName.toLowerCase() === 'tei-lb') {
		firstContent.after(start);
	} else {
		addition.prepend(start);
	}
	addition.append(end);
}
