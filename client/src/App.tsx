import { useState, type FormEvent } from 'react'

function App() {
  // state: what React remembers between renders. Changing it re-renders the page.
  const [longUrl, setLongUrl] = useState('')   // what's typed in the input
  const [shortUrl, setShortUrl] = useState('') // what the server sent back

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // a form's default is to reload the page, stop that

    // POST /api/urls, same request as curl/Thunder Client (D03 contract)
    const response = await fetch('/api/urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ longUrl }),
    })
    const data: { shortUrl: string } = await response.json() // happy path only, errors in M14
    setShortUrl(data.shortUrl)
  }

  return (
    <main>
      <h1>URL Shortener</h1>

      {/* <form> gives Enter-to-submit for free. type="url" + required = the browser checks it first (UX only, the server still validates) */}
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          required
          placeholder="https://example.com/some/long/url"
          value={longUrl}
          onChange={(event) => setLongUrl(event.target.value)}
        />
        <button type="submit">Shorten</button>
      </form>

      {/* only shown once there is a result */}
      {shortUrl && (
        <p>
          Shortened URL: <a href={shortUrl}>{shortUrl}</a>
        </p>
      )}
    </main>
  )
}

export default App
