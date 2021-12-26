import restify, { plugins } from 'restify'
import fs from 'fs'
import errors from 'restify-errors'



var app = restify.createServer({
   certificate: fs.readFileSync(process.env.CERTIFICATE),
   key: fs.readFileSync(process.env.CERTIFICATEKEY)
})

app.use(plugins.queryParser({ mapParams: false }))

// add cors headers to each request
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Origin', '*')
   res.header('Access-Control-Allow-Headers', 'X-Requested-With')
   return next()
})

// add handler to check for a query parameter 'token'
app.use((req, res, next) => {
   if (req.query.token !== process.env.TOKEN) {
      return next(new errors.ForbiddenError('token required'))
   } else {
      return next()
   }
})

app.opts('/:repository/*', (req, res, next) => {
   res.send(204, null, {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'X-PINGOTHER, Content-Type'
   })
   return next()
})


app.get('/:repository/*', (req, res, next) => {

   var repo = req.params.repository
   var path = req.params['*']

   console.log(`${repo}  ${path}`)


   res.send(200, 'working for now')

   return next()
})






// start server
app.listen(443, () => {
   console.log('%s listening at %s', app.name, app.url)
})

