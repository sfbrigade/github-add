var express = require('express')
var cookieParser = require('cookie-parser')
var compress = require('compression')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var methodOverride = require('method-override')
var dotenv = require('dotenv')
var sass = require('node-sass-middleware')
var fs = require('fs')
var path = require('path')
var request = require('request')

try {
  var stats = fs.lstatSync(path.join(__dirname, '/.env.development'))
  if (stats.isFile()) {
    dotenv.load({ path: '.env.development' })
  } else {
    throw new Error('.env.development is not a file!')
  }
} catch (e) {
  console.warn(e)
  console.warn('.env.development file not found. Defaulting to sample. Please copy .env to .env.development and populate with your own credentials.')
  dotenv.load({ path: '.env' })
}

var app = express()

app.set('port', process.env.PORT || 9995)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(compress())
app.use(sass({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  sourceMap: true
}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride())
app.use(cookieParser())
app.use(function (req, res, next) {
  res.locals = {}
  res.locals.title = process.env.SITE_TITLE
  res.locals.welcome = process.env.SITE_WELCOME
  res.locals.githuborg = process.env.GITHUB_ORG
  res.locals.accept = process.env.SITE_ACCEPT_INVITE
  res.locals.accept2 = process.env.SITE_ACCEPT_INVITE_2
  next()
})

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }))

app.get('/', getView)
app.post('/', postUser)

app.use(errorHandler())

app.listen(app.get('port'), function () {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'))
})

function getView (req, res, next) {
  res.render('main', {
    locals: res.locals,
    title: res.locals.title
  })
}
function postUser (req, res, next) {
  console.log(req.body)
  var username = req.body.username
  var githubUrl = 'https://api.github.com/orgs/' + process.env.GITHUB_ORG + '/memberships/' + username
  request({
    method: 'PUT',
    uri: githubUrl,
    headers: {
      'user-agent': 'Github-Adder',
      'Authorization': 'token ' + process.env.GITHUB_TOKEN
    }
  }, function (err, response, body) {
    console.log(err, body)
    res.redirect('/')
  })
}
