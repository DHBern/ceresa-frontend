import { markAddition } from './addition.js';

const NOTE_ID_PREFIX = 'note_';

interface BehaviorContext {
	dom: Document;
	noteIndex?: number;
}

export const behaviors = (dom: Document) => {
	return {
		tei: {
			add: markAddition,

			gap(this: BehaviorContext, el: HTMLElement): Text {	
				const quantity = Number.parseInt(el.getAttribute('quantity') ?? '0', 10);
				const count = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
				return dom.createTextNode('x'.repeat(count));
			},

			// Handle Line Breaks and Hyphenation
			lb(this: BehaviorContext, el: HTMLElement): Text | undefined {
				if (el.getAttribute('break') === 'no') {
					// Remove the trailing whitespace of the previous text node
					const prev = el.previousSibling;

					if (prev && prev.nodeType === 3) // Node.TEXT_NODE is equivalent to 3
					{
						// Trim trailing whitespace
						prev.nodeValue = prev.nodeValue ? prev.nodeValue.replace(/\s+$/, '') : null;

						// Insert the hyphen for hyphenation
						const hyphenSpan = dom.createElement('span');
						hyphenSpan.setAttribute('data-type', 'hyphen');
						hyphenSpan.textContent = '-';
						prev.parentNode?.insertBefore(hyphenSpan, el);
					}

					// Replace the current behavior with an empty text node
					return dom.createTextNode('');
				}
			},

			// Insert Footnotes and extract note content
			// --> wrapping of commented text happens in a client-side function (see below).
			note(this: BehaviorContext, el: HTMLElement): HTMLSpanElement {
				// Create running index
				if (!this.noteIndex) {
					this['noteIndex'] = 1;
				} else {
					this.noteIndex++;
				}
				// Create noteId
				const noteId = `${NOTE_ID_PREFIX}${this.noteIndex}`;

				// Create notes-list and append to dom
				let noteList = this.dom.querySelector('ol.notes');
				if (!noteList) {
					noteList = dom.createElement('ol');
					noteList.setAttribute('class', 'notes');
					this.dom.appendChild(noteList);
				}
				const note = dom.createElement('li');
				note.setAttribute('data-noteid', `${noteId}`);
				note.innerHTML = `<div class='data-notenum'>${this.noteIndex}</div><div>${el.innerHTML}</div>`;
				noteList.appendChild(note);

				// Create footnote-span
				const footnote = dom.createElement('span');
				footnote.classList.add('footnote');
				footnote.setAttribute('data-noteid', `${noteId}`);
				const noteType = el.getAttribute('type');
				if (noteType) footnote.setAttribute('data-note-type', noteType);
				footnote.dataset.noteId = String(this.noteIndex);
				footnote.innerHTML = String(this.noteIndex);

				return footnote;
			}
		}
	};
};

// Marks: Warp notes between anchors and matching notes
// --> Run after processPage()
export function wrapAnnotations(container: HTMLElement) {
	const notes = container.querySelectorAll('tei-note[targetend]');
	notes.forEach((note) => {
		const targetId = note.getAttribute('targetend');
		const noteId = note.querySelector(':scope > .footnote')?.getAttribute('data-noteid');
		if (!targetId || !noteId) return;
		const anchor = container.querySelector(`tei-anchor[id="${targetId}"]`);
		if (!anchor) return;

		// Collect sibling nodes between anchor and note
		let current = anchor.nextSibling;
		const nodes: Node[] = [];
		while (current && current !== note) {
			nodes.push(current);
			current = current.nextSibling;
		}
		if (current !== note || !nodes.length) return;

		// Create mark (the wrapper around annotated text)
		const wrapper = container.ownerDocument.createElement('span');
		wrapper.classList.add('note-mark');
		wrapper.setAttribute('data-noteid', noteId);
		wrapper.dataset.noteTarget = targetId;

		nodes[0].parentNode!.insertBefore(wrapper, nodes[0]);
		nodes.forEach((n) => wrapper.appendChild(n));
	});
}

// Remove footnotes list from main text
// --> Run on client text components
export function removeNotesFromMaintext(ceteiSerialized: string) {
	return ceteiSerialized.replace(/<ol class="notes">.*?<\/ol>/s, '');
}

export interface TEIPage {
	page: number;
	n: string | null;
	facs: string | null;
}

export function getTextPageBreaks(container: ParentNode): HTMLElement[] {
	return Array.from(container.querySelectorAll<HTMLElement>('tei-text tei-pb')).filter(
		(el) => !el.closest('cetei-original')
	);
}

export function collectPageMetadata(container: ParentNode): TEIPage[] {
	return getTextPageBreaks(container).map((el, index) => ({
		page: index + 1,
		n: el.getAttribute('n')?.trim() || null,
		facs:
			el
				.getAttribute('facs')
				?.trim()
				.replace(/\/info\.json$/, '') || null
	}));
}

// Extract a single page from the serialized CETEI output by running page index.
// Preserve the DOM structure when a page break splits a paragraph or division.
export function extractPage(ceteiSerialized: string, pageIndex: number): string {
	const parser = new DOMParser();
	const doc = parser.parseFromString(ceteiSerialized, 'text/html');

	// Collect all <tei-pb> elements in document order
	const pageBreaks = getTextPageBreaks(doc);

	if (!pageBreaks.length) {
		console.warn('No <tei-pb> elements found. Returning full content.');
		return ceteiSerialized;
	}

	const targetIndex = pageIndex - 1; // Convert 1-based to 0-based
	if (targetIndex < 0 || targetIndex >= pageBreaks.length) {
		console.warn(
			`Page index ${pageIndex} is out of range (1–${pageBreaks.length}). Returning full content.`
		);
		return ceteiSerialized;
	}

	const targetPb = pageBreaks[targetIndex];
	const nextPb = targetIndex + 1 < pageBreaks.length ? pageBreaks[targetIndex + 1] : null;

	const range = doc.createRange();
	range.setStartAfter(targetPb);
	if (nextPb) range.setEndBefore(nextPb);
	else range.setEnd(doc.body, doc.body.childNodes.length);

	const fragment = range.cloneContents();
	fragment.querySelectorAll('tei-pb').forEach((pb) => pb.remove());

	// The range clones partial children, but not their shared ancestors.
	let content: Node = fragment;
	for (
		let ancestor = range.commonAncestorContainer;
		ancestor !== doc.body && ancestor.parentNode;
		ancestor = ancestor.parentNode
	) {
		const wrapper = ancestor.cloneNode(false);
		wrapper.appendChild(content);
		content = wrapper;
	}

	const container = doc.createElement('div');
	container.appendChild(content);
	return container.innerHTML;
}
