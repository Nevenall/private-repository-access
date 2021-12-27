import restify, { plugins } from 'restify'
import fs from 'fs'
import errors from 'restify-errors'
import clients from 'restify-clients'
import url from 'url'
import { get } from 'http'

// note - apparently followRedirects doesn't work for http, or maybe it's the way github does it, but we have to do it manually.
var git = clients.createHttpClient({
   url: "https://api.github.com",
   headers: {
      Authorization: `token ${process.env.ACCESSTOKEN}`,
      Accept: 'application/vnd.github.VERSION.raw'
   }
})

var app = restify.createServer()

app.use(plugins.queryParser({ mapParams: false }))

// add cors headers to each response
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*')
   res.header('Access-Control-Allow-Headers', 'X-Requested-With')
   return next()
})

// check each request for a query parameter 'token'
app.use((req, res, next) => {
   if (req.query.token !== process.env.TOKEN) {
      return next(new errors.ForbiddenError('token required'))
   } else {
      return next()
   }
})

// respond to OPTIONS for CORS pre-flight requests
// I think wildcard will work here
app.opts('/*', (req, res, next) => {
   res.send(204, null, {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-PINGOTHER, Content-Type, Accept'
   })
   return next()
})

// GET manifest json
app.get('/:repository/:manifest(\\w+).json', (request, response, next) => {
   var repo = request.params.repository
   var manifest = request.params.manifest

   git.get(`/repos/Nevenall/${repo}/contents/${manifest}.json`, (connectError, req) => {
      req.on('result', (err, res) => {
         res.pipe(response)
      })
   })
})


// GET archive zip
app.get('/:repository/:archive(\\w+).zip', (request, response, next) => {
   var repo = request.params.repository

   git.get(`/repos/Nevenall/${repo}/zipball`, (connectError, req, res, obj) => {
      // err is connect error
      // todo - if connection error?

      req.on('response', (err, res) => {
         // manually following redirects
         if (err && err.statusCode === 302) {
            var location = new URL(err.headers.location)
            clients.createHttpClient({ url: location.origin }).get(`${location.pathname}${location.search}`, function (err, req) {
               req.on('result', function (err, res) {
                  res.pipe(response)
               })
            })
         } else {
            return next(new Error('expected a redirect'))
         }
      })
   })
})

app.get('/', (request, response, next) => {
   git.get('/zen', (err, req) => {
      req.on('result', function (err, res) {
         res.pipe(response)
      })
   })
})

// start server
app.listen(process.env.PORT || 3031, () => {
   console.log('%s listening at %s', app.name, app.url)
})

