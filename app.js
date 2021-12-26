import restify, { plugins } from 'restify'
import fs from 'fs'
import errors from 'restify-errors'
import clients from 'restify-clients'
import assert from 'assert'

var git = clients.createHttpClient({ url: "https://api.github.com", headers: { 'Authorization': `token ${process.env.ACCESSTOKEN}` } })

var app = restify.createServer({
   certificate: fs.readFileSync(process.env.CERTIFICATE),
   key: fs.readFileSync(process.env.CERTIFICATEKEY)
})

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
app.opts('/:repository/*', (req, res, next) => {
   res.send(204, null, {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-PINGOTHER, Content-Type'
   })
   return next()
})

// respond to GET
app.get('/:repository/*', (request, response, next) => {
   var repo = request.params.repository
   var path = request.params['*']

   git.get('/zen', (err, req) => {
      assert.ifError(err) // connection error

      req.on('result', (err, res) => {
         assert.ifError(err) // HTTP status code >= 400

         response.body = ''
         res.on('data', (chunk) => {
            response.body += chunk
         })

         res.on('end', () => {
            response.sendRaw(response.body)
            return next()
         })
      })
   })
})






// start server
app.listen(443, () => {
   console.log('%s listening at %s', app.name, app.url)
})

