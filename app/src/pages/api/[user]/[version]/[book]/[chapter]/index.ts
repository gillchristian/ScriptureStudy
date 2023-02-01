import type { NextApiRequest, NextApiResponse } from 'next'

type Params = {
  user: string
  version: string
  book: string
  chapter: string
}

const mkKey = (params: Params) =>
  `${params.user}.${params.version}.${params.book}.${params.chapter}`

const cache: { [key: string]: unknown } = {}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const key = mkKey(req.query as Params)
    console.log('[POST]', '200', key)
    cache[key] = req.body
    res.status(200).send('Ok')
    return
  }

  if (req.method === 'GET') {

    const key = mkKey(req.query as Params)
    const v = cache[key]

    if (v) {
      console.log('[GET] ', '200', key)
      res.json(v)
    } else {
      console.log('[GET] ', '404', key)
      res.status(404).send('Not found')
    }

  }
}
