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
