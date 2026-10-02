# altship.

Landing page for altship — infrastructure for agents and the web.

## Structure

```
index.html        Markup + meta/SEO tags
css/style.css      Styles
js/main.js         Hero slideshow + product hover-preview interactions
assets/            Logo, favicon, social thumbnail, hero images
```

## Running locally

Static site, no build step. Serve it with the dev server (Node, no dependencies):

```
node dev.mjs
```

then visit `http://localhost:8000`.

In production, `/mcp/` is the MCP Creator landing page from the `altship-mcp`
repo (`apps/site`), served via the rewrite in `vercel.json`. `dev.mjs` mirrors
that locally by forwarding `/mcp/*` to its Vite dev server, so run that too:

```
# in your altship-mcp checkout
cd apps/site && npm run dev   # http://localhost:5174/mcp/
```

Set `PORT` or `MCP_DEV_URL` to change either address.
