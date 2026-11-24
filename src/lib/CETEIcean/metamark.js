const metamarkSelector = 'tei-metamark, metamark, [data-origname="metamark"]';

/** @param {ParentNode} root */
export function processMetamarks(root) {
	const marks = Array.from(root.querySelectorAll(metamarkSelector));
	/** @type {Map<string, Element>} */
	const destinations = new Map();

	for (const mark of marks) {
		const id = mark.getAttribute('xml:id') || mark.id;
		if (id && !destinations.has(id)) destinations.set(id, mark);
	}

	let moveNumber = root.querySelectorAll('.metamark-marker-at-new-location').length;
	for (const origin of marks) {
		if (origin.hasAttribute('xml:id') || origin.id) continue;
		const id = origin.getAttribute('target')?.replace(/^#/, '');
		if (!id) continue;
		const destination = destinations.get(id);
		if (!destination || !origin.hasChildNodes()) continue;
		if (destination.querySelector(':scope > .metamark-marker-at-new-location')) continue;

		const label_origin = `Testo riposizionato ${++moveNumber}`;
		const label_destination = `${moveNumber}`;
		origin.dataset.metamarkLabel = label_origin;
		destination.dataset.metamarkLabel = label_destination;
		const doc = origin.ownerDocument;
		const originalText = doc.createElement('span');
		originalText.className = 'metamark-relocated-text-at-original-position';
		originalText.dataset.metamarkId = id;
		originalText.dataset.metamarkLabel = label_origin;
		originalText.append(...origin.childNodes);
		origin.append(originalText);

		const relocatedText = doc.createElement('span');
		relocatedText.className = 'metamark-relocated-text-at-new-location';
		for (const child of originalText.childNodes) relocatedText.append(child.cloneNode(true));

		const explanation = doc.createElement('span');
		explanation.className = 'metamark-explanation-for-relocation';
		explanation.append(...destination.childNodes);

		const marker = doc.createElement('span');
		marker.className = 'metamark-marker-at-new-location';
		marker.dataset.metamarkId = id;
		marker.dataset.metamarkLabel = label_destination;
		const tooltip = explanation.textContent.trim();
		if (tooltip) {
			for (const element of [marker, originalText]) {
				element.title = tooltip;
				element.style.cursor = 'help';
			}
		}

		destination.append(explanation, marker, relocatedText);
	}
}
