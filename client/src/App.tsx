import { useState, type FormEvent } from 'react'

function App() {
  // state: what React remembers between renders. Changing it re-renders the page.
  const [longUrl, setLongUrl] = useState('')   // what's typed in the input
  const [shortUrl, setShortUrl] = useState('') // what the server sent back
  const [loading, setLoading] = useState(false) // request in flight
  const [error, setError] = useState('')        // message shown to the user (D12)
  const [copied, setCopied] = useState(false)   // show "Copied!" for a moment

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

  async function copyShortUrl() {
    await navigator.clipboard.writeText(shortUrl) // browser API, works on https and localhost
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <main className="app">
      <h1>URL Shortener</h1>

      {/* box 1: the long URL. <form> = Enter submits. type="url" + required = browser checks first (UX only, server still validates) */}
      <form className="panel" onSubmit={handleSubmit}>
        <label className="panel-title" htmlFor="long-url">Long URL</label>
        <div className="row">
          <input
            id="long-url"
            type="url"
            required
            placeholder="https://example.com/some/long/url"
            value={longUrl}
            onChange={(event) => setLongUrl(event.target.value)}
          />
          {/* disabled while loading: a double click can't create 2 links */}
          <button type="submit" disabled={loading}>
            {loading ? '...' : 'Shorten'}
          </button>
        </div>
      </form>

      {/* box 2: the result, or the error, or a hint */}
      <section className="panel">
        <h2 className="panel-title">Short URL</h2>
        {error ? (
          <p className="error" role="alert">{error}</p> // role="alert": screen readers announce it
        ) : shortUrl ? (
          <div className="row">
            <a className="result" href={shortUrl}>{shortUrl}</a>
            <button type="button" onClick={copyShortUrl}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <p className="hint">Your short link will appear here</p>
        )}
      </section>

      {/* icon license requires attribution. rel="noopener noreferrer": the opened tab can't control this page */}
      <footer>
        Icon: <a href="https://iconscout.com/icons/url" target="_blank" rel="noopener noreferrer">url</a> by{' '}
        <a href="https://iconscout.com/contributors/flowicon" target="_blank" rel="noopener noreferrer">Flowicon</a> on{' '}
        <a href="https://iconscout.com" target="_blank" rel="noopener noreferrer">IconScout</a>
      </footer>
    </main>
  )
}

export default App
