import { useState, type FormEvent } from 'react'

function App() {
  // state: what React remembers between renders. Changing it re-renders the page.
  const [longUrl, setLongUrl] = useState('')   // what's typed in the input
  const [shortUrl, setShortUrl] = useState('') // what the server sent back
  const [loading, setLoading] = useState(false) // request in flight
  const [error, setError] = useState('')        // message shown to the user (D12)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault() // a form's default is to reload the page, stop that
    setLoading(true)
    setError('')
    setShortUrl('')

    try {
    // POST /api/urls, same request as curl/Thunder Client (D03 contract)
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl }),
      })
      const data: { shortUrl?: string; error?: string } = await response.json()

      if (response.ok) {
        setShortUrl(data.shortUrl ?? '')
      } else if (response.status < 500) {
        setError(data.error ?? 'Invalid request') // 4xx: user can fix it, show the server's reason
      } else {
        setError('Something went wrong, please try again') // 5xx: our fault
      }
    } catch {
      // fetch threw (no response) or the body wasn't JSON (proxy error page): server unreachable
      setError("Can't reach the server, please try again")
    } finally {
      setLoading(false) // runs after success AND failure
    }
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
        {/* disabled while loading: a double click can't create 2 links */}
        <button type="submit" disabled={loading}>
          {loading ? 'Shortening…' : 'Shorten'}
        </button>
      </form>

      {/* role="alert": screen readers announce the error when it appears */}
      {error && <p role="alert">{error}</p>}

      {shortUrl && (
        <p>
          Shortened URL: <a href={shortUrl}>{shortUrl}</a>
        </p>
      )}
    </main>
  )
}

export default App
