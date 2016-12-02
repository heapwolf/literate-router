# SYNOPSIS
Markdown powered routing for building http based APIs. A generalized routing
system meant to be both abstracted and self-documenting.

# MOTIVATION
Don't allow routing to become tangled with implementations. Enforce
markdown based documentation so it can be served as an endpoint. A single
canonical reference can also be used to test routes reliably.

# SYNTAX
Lines that are indented using two or more spaces or one or more tabs) are
parsed. All other lines are ignored (considered to be documentation).

```
Lorem Ipsum is simply dummy text of the printing and typesetting industry.
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.

  METHOD ROUTE PATH (P1, P2, ...)

Lorem Ipsum is simply dummy text of the printing and typesetting industry.
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s

  METHOD ROUTE PATH (P1, P2, ...)
  METHOD ROUTE PATH (P1, P2, ...)
```

### METHOD
A regular expression, matching the http method, for example `GET|PUT`.

### ROUTE
A tokenized route, for example `/books/:page`, see
[this](https://github.com/pillarjs/path-to-regexp#parameters) documentation.

### PATH
A path to a file that exports one or more functions to handle testing and
fullfilling the request.

### (P1, P2, ...)
An array of arbitrary parameters that can be passed to the supplied functions.

# USAGE
## ROUTES.MD
```md
Lorem Ipsum is simply dummy text of the printing and typesetting industry.
Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.

  GET /books routes/books (5000/hr)
  PUT|POST /books/:book routes/books (10000/hr)
```

## SERVER.JS
```js
const http = require('http')
const Router = require('literate-router')
const send = require('send')
const fs = require('fs')

function nonmatch (req, res) {
  send(req, req.url).pipe(res)
}

function match (req, res, context, next) {
  next()
}

const routes = fs.readFileSync('./routes.md', 'utf8')
const router = Router(routes, match, nonmatch)

http.createServer(router).listen(8080)
```

