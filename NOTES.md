# Notes

Stuffs that confuse me here, --what bugs I hit, how I resolve it, useful commands, etc.

## Milestone 1: Project intialization

a leading `/` in `.gitignore` means only ignoring directories that lies in the root directory, in which the `.gitignore` lives in

## Milestone 2: Frontend setup (react + vite)

Vite (bundler): some setup to compile Typescript and react `jsx/tsx` to plain JS for the browser to be able to run those code

Vite dev server: 
- program running on laptop waiting for requests at `http://localhost:5173`. 
- Browser open that address, asks Vite for files -> Vite reads from `client`, converts typesciprt/jsx into plain JS, sends them back to browser to execute. 
- It's only for `development` time. When deploy, `npm run build` compiles plain JS file in `client/dist/` with `index.html`, no more Vite server

How Vite files work:
- index.html -> src/main.tsx -> src/App.tsx
- main.tsx finds the empty `#root` div in `index.html` and tells React to render `<App />` inside that div.
- App.tsx is the UI, frontend code

`useState` in App.tsx when I trim boiletplate, I never remove. `npm run dev` still works since it only launches a vite server to run source code, but `npm run build` won't work since it also runs the typesript compiler, the compiler don't allow declared stuffs that is not used (so got error)

## Milestone 3: build a Fastify server

When intializing a Fastify app, why receive `404` after trying to access the server address means success? -> It's because, browser will send a `GET` request to `/` (which does not exist), so it returns 404 json. This proves that the server is working since it needs to receive the request, process, and reply with a status json

`node --watch`: restart server when code changes

## Milestone 4: writing first route (server health check)

1. app.get('/some-path', async (request, reply) => {
  return /* something */
})

- The handler is the function Fastify calls when a matching request arrives.
  - request is everything that came in: headers, URL parameters, body.
  - reply lets you control the response: the status code, headers, or a redirect. We'll need that for the redirect in milestone 11.
- Whatever you return becomes the response. If you return an object, Fastify turns it into JSON, sets the content-type: application/json header, and uses status 200 automatically.

2. Fastify vs Express:
- Express: Express app keeps all the routes in a list, and walks through that list on every request so adding routes after app.listen() is just adding 1 item to that list so it works
- Fastify: Fastify builds an optimized lookup structure from all the routes first. After that, the routing is locked and the app starts `listen()` for requesting so adding new path after `app.listen()` won't work.

## Milestone 5: document on HTTP request/response flow of the product

Convention of designing api endpoints: (protocol)/://(host:port)/(app_context)/(version)/(resource)/(id)
- any endpoints, path should name the resource and method is the verb (like the eg above, `url` not `shorten-url`)

e.g: http://localhost:3000/api/v1/url/url-id

For reference: https://medium.com/@nadinCodeHat/rest-api-naming-conventions-and-best-practices-1c4e781eb6a5




