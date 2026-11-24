const TEI_NS = 'http://www.tei-c.org/ns/1.0';
const XML_NS = 'http://www.w3.org/XML/1998/namespace';

export class TEIVersionError extends Error {}

export interface VersionPage {
	n: string | null;
	facs: string | null;
}

export interface SelectedVersion {
	id: string;
	initialPage: VersionPage | null;
	pageBreakCount: number;
}

function pageInfo(pb: Element): VersionPage {
	return {
		n: pb.getAttribute('n'),
		facs: pb.getAttribute('facs')
	};
}

export function selectTEIVersion(doc: Document, id: string): SelectedVersion {
	const matches = Array.from(doc.getElementsByTagNameNS(TEI_NS, 'div')).filter(
		(div) => div.getAttributeNS(XML_NS, 'id') === id
	);
	if (matches.length !== 1) {
		throw new TEIVersionError(
			`Expected one TEI division with xml:id="${id}", found ${matches.length}.`
		);
	}

	const division = matches[0];
	let text: Element | null = division.parentElement;
	while (text && !(text.namespaceURI === TEI_NS && text.localName === 'text')) {
		text = text.parentElement;
	}
	if (!text) throw new TEIVersionError(`TEI division "${id}" is not inside a text.`);

	const pageBreaks = Array.from(text.getElementsByTagNameNS(TEI_NS, 'pb'));
	const inside = pageBreaks.filter((pb) => division.contains(pb));
	const preceding = pageBreaks.filter(
		(pb) => !division.contains(pb) && (pb.compareDocumentPosition(division) & 4) !== 0
	);
	const firstBreak = inside[0];
	const range = doc.createRange();
	range.selectNodeContents(division);
	if (firstBreak) range.setEndBefore(firstBreak);
	const beforeFirstBreak = range.cloneContents();
	const hasInitialContent =
		Boolean(beforeFirstBreak.textContent?.trim()) ||
		Array.from(beforeFirstBreak.querySelectorAll('*')).some((el) =>
			['lb', 'gap', 'space', 'graphic', 'figure', 'note'].includes(el.localName)
		);

	let initialPage: VersionPage | null = null;
	if (hasInitialContent) {
		const previousBreak = preceding.at(-1);
		if (previousBreak) {
			initialPage = pageInfo(previousBreak);
		} else {
			console.warn(`No preceding page break for the beginning of TEI version "${id}".`);
			initialPage = { n: null, facs: null };
		}
	}

	for (let child: Element = division; child !== text;) {
		const parent = child.parentElement;
		if (!parent) throw new TEIVersionError(`Could not isolate TEI division "${id}".`);
		for (const sibling of Array.from(parent.childNodes)) {
			if (sibling !== child) sibling.remove();
		}
		child = parent;
	}

	return { id, initialPage, pageBreakCount: inside.length };
}
