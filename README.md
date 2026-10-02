# altship.

Landing page for altship — infrastructure for agents and the web.

## Structure

```
index.html        Markup + meta/SEO tags
css/style.css      Styles
js/main.js         Hero slideshow + product hover-preview interactions
mcp/index.html    altship.io/mcp — MCP Creator landing page (css/mcp.css, js/mcp.js)
assets/            Logo, favicon, social thumbnail, hero images
```

## Running locally

Static site, no build step. Serve it with the dev server (Node, no dependencies):

```
node dev.mjs
```

then visit `http://localhost:8000`.

`/mcp/` is the MCP Creator landing page. Its "Start building" links go to the
dashboard at `https://pilot.altship.io/mcp` (`http://localhost:5173/mcp` when
served from localhost — run the dashboard from the `altship-mcp` repo).

Set `PORT` to change the address.
