const parseUrl = require('url').parse
const parse = require('./parser')

module.exports = function Router (s, match, nonmatch, resolver) {
  const table = parse(s, resolver)

  return function Listener (req, res) {
    const pathname = parseUrl(req.url).pathname
    const routed = false

    const next = i => {
      const r = table[i]

      if (!r) {
        if (!routed) return nonmatch(req, res)
        return
      }

      const m = r.routeExp.exec(pathname)

      if (m && r.methodExp.test(req.method)) {
        const context = {
          method: r.method,
          route: r.route,
          params: {},
          args: r.args
        }

        r.routeKeys.map((key, i) => {
          const value = m[i + 1]
          if (value) context.params[key] = decodeURI(value)
        })

        return match(req, res, context, err => {
          if (err) return next(++i)

          const handler = () => {
            const fn = r.module.handler || r.module

            fn(req, res, context, err => {
              if (err) return next(++i)
            })
          }

          if (!r.module.test) return handler()

          r.module.test(req, res, context, err => {
            if (err) return next(++i)
            handler()
          })
        })
      }

      next(++i)
    }
    next(0)
  }
}

