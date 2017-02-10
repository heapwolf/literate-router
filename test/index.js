const test = require('tape')
const send = require('send')
const http = require('http')
const body = require('stream-body')
const Respond = require('stream-response')
const Router = require('../index')
const fs = require('fs')

const path = require('path')
const file = path.join(__dirname, 'routes.md')
const routes = fs.readFileSync(file, 'utf8')

const port = 8080

const request = {}
;['get', 'put', 'head', 'post'].map(method => {
  request[method] = (path, cb) => http.request({ method, path, port }, cb)
})

test('setup', assert => {
  function nonmatch (req, res) {
    const root = path.join(__dirname, 'static')
    const s = send(req, req.url, { root })

    s.on('error', err => {
      if (err.code === 'ENOENT') {
        res.statusCode = 404
        return res.end('Not Found')
      }
      res.statusCode = 500
      res.end('Server Error')
    })

    s.pipe(res) // serve static files
  }

  function match (req, res, context, next) {
    const response = Respond(res)
    if (context.params.artist === 'Black Sabbath') {
      return response.json(200, context)
    }
    next()
  }

  function resolver (p) {
    return path.join(__dirname, p)
  }

  const router = Router(routes, match, nonmatch, resolver)
  http.createServer(router).listen(port, () => assert.end())
})

test('[passing] not found', assert => {
  request.get('/foobar', res => {
    res.on('data', d => console.log(d))
    res.on('end', () => {
      assert.equal(res.statusCode, 404, 'responds not found')
      assert.end()
    })
  }).end()
})

test('[passing] root found', assert => {
  request.get('/', res => {
    assert.equal(res.statusCode, 200)
    assert.end()
  }).end()
})

test('[passing] fall through to static file', assert => {
  request.get('/index.html', res => {
    body.parse(res, (err, data) => {
      assert.ok(!err, 'no error from parsing body')
      assert.equal(data, '<h1>Hello, World</h1>\n', 'correct html')
      assert.end()
    })
  }).end()
})

test('[failing] test prevents handler from being fired', assert => {
  request.get('/cats/2', res => {
    assert.ok(res.statusCode, 401, 'responds unauthorized')
    assert.end()
  }).end()
})

test('[passing] test allows handler to be fired', assert => {
  request.get('/cats/1', res => {
    assert.ok(res.statusCode, 200, 'responds ok')
    assert.end()
  }).end()
})

test('[failing] method mismatch', assert => {
  request.head('/cats/1', res => {
    assert.equal(res.statusCode, 404)
    assert.end()
  }).end()
})

test('[passing] alternate methods (put)', assert => {
  request.put('/data/artist/1', res => {
    assert.equal(res.statusCode, 201)
    assert.end()
  }).end()
})

test('[passing] alternate methods (post)', assert => {
  request.post('/data/artist/1', res => {
    assert.equal(res.statusCode, 201)
    assert.end()
  }).end()
})

test('[failing] intercepted by match function', assert => {
  request.post('/data/Black%20Sabbath/Master%20of%20Reality', res => {
    body.parse(res, (err, data) => {
      assert.ok(!err, 'Successfully got body of response')
      assert.equal(data.method, 'PUT|POST')
      assert.equal(data.route, '/data/:artist/:album')
      assert.equal(data.params.artist, 'Black Sabbath')
      assert.equal(data.params.album, 'Master of Reality')
      assert.equal(res.statusCode, 200)
      assert.end()
    })
  }).end()
})

test('[failing] intercepted by match function (should accept PUT or POST)', assert => {
  request.put('/data/Black%20Sabbath/Master%20of%20Reality', res => {
    body.parse(res, (err, data) => {
      assert.ok(!err, 'Successfully got body of response')
      assert.equal(data.method, 'PUT|POST')
      assert.equal(data.route, '/data/:artist/:album')
      assert.equal(data.params.artist, 'Black Sabbath')
      assert.equal(data.params.album, 'Master of Reality')
      assert.equal(res.statusCode, 200)
      assert.end()
    })
  }).end()
})

test('teardown', assert => {
  assert.end()
  process.exit(0)
})
