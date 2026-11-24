# CETEIcean Preview -- WebDAV sync

The contents in this directory are kept in sync with the `preview` directory on the WebDAV storage. See main [README](https://github.com/DHBern/ceresa-frontend/blob/main/README.md) for details.

DO NOT edit files in `preview` directly on WebDAV!

`oxy.html` contains the standalone preview logic, including plain JavaScript
copies of the behavior and version-selection logic from `behaviors.ts` and
`selectVersion.ts`. Keep those inline copies in sync with the app modules. It
loads TEI presentation rules from `styles.css` and preview controls from
`ui-styles.css`. Both views use fluid text flow. CETEIcean 1.9.5
and fonts are loaded from their public CDNs.

Deploy `oxy.html`, `styles.css`, and `ui-styles.css` together to
WebDAV. No companion behavior JavaScript file is required. Add
`&version=<xml:id>` alongside `url` to render only the matching TEI division
(for example, `oxy.html?url=<encoded-TEI-URL>&version=A-1-b_6-2_AC001_a`);
without it, the full document is shown.
