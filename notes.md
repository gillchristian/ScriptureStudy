## TODO

### General

- [ ] Separate Book from Chapter number? (`Chapter` type)
- [ ] Include Copyright and disclaimer
    - `NET`: https://netbible.com/copyright/
    - `WEB`: The World English Bible (WEB) is a Public Domain (no copyright) Modern English translation of the Holy Bible. That means that you may freely copy it in any form, including electronic and print formats.
    - Disclaimer: <https://github.com/selfire1/BibleGateway-to-Obsidian#%EF%B8%8F-disclaimers>

### App

- [ ] Rename directory => Switch to Next.js
- [ ] Fix space between the chapter a footnote "mark" and the vible verse
  (it is properly respected in the normal rendering). This also happens in
  verses. I think the fix will be to add `&nbsp;` at the end of the previous
  text and the beginning of the next thext when there's a `<span />`?
- [ ] Command palette to support filtering actions
- [ ] Search to support version query
- [ ] Keep the selected chapter in the URL instead of memory => Switch to Next.js
- [ ] Allow to configure the background color?
- [ ] Unify the `Chapter` type (some places is `genesis-1` and some others `Genesis 1`)
- [x] Version switcher
- [x] Default version should be the selected one
- [x] Link app in Vercel with repo
- [x] Dark mode => for some reason Tailwind Dark Mode doesn't work (both `system` and `class`) => Also check their example for supporting both
- [x] Fix centered content. Eg. see Psalm 101)

### Scrapper

- [ ] Serve a list of available versions for discovery, instead of harcoding in the App
- [ ] `mkdir -p`
- [ ] Base directory argument
- [ ] Template to wrap the content
- [ ] Psalms include the title
- [x] Include responsive meta tag on the `<head />`

## Future Ideas

- Special queries in the command palette: `version`, `chapter`.
- Full text search => Requires a server for the files
- Integrate GPT to do analysis with it
- Notes and comments
- Integrate [tldraw](https://www.tldraw.dev/) for drawing on top of the content
- On demand downloading of versions to some local storage? => See [A future for SQL on the web](https://jlongster.com/future-sql-web)
