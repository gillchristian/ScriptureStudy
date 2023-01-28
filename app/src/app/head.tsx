export default function Head() {
  return (
    <>
      <title>Scripture Study</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
      <meta name="description" content="My personal bible study application" />
      {
        // TODO: add favicon
        false && <link rel="icon" href="/favicon.ico" />
      }
    </>
  )
}
