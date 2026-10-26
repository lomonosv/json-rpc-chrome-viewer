# Panel concept

A redesign concept for the extension's DevTools panel. It started as the
landing site's hero mock and deliberately does **not** match the shipping
panel. The site now embeds the real panel instead (`public/demo/`, built from
`demo/`).

It is kept as the reference for a planned redesign of the extension UI. It is
not rendered anywhere. Do not delete it, and do not restyle it to match the
current panel.

What it covers: DevTools window chrome and tab strip, toolbar chips, a blue
server group band with a rotating chevron, SERVER / MOCK / WS badges, a
phase-segmented waterfall, amber slow times, red error lines, request/response
panes and a summary footer. Its palette is the site's (`src/app/globals.css`).

To preview it, render `<PanelConcept />` temporarily on any page.
