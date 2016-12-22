const path = require('path')
const fmt = require('util').format
const pathToRegexp = require('path-to-regexp')

const lineRE = /^[ \t]{2,}(\S+) (\S+) (\S+) (?:\((.*?)\))/

function die (msg, ...args) {
  console.error(fmt(msg, ...args))
  process.exit(1)
}

module.exports = function parse (s) {
  return s
    .split('\n')
    .map((line, index) => {
      const match = line.match(lineRE)
      if (!match) return null

      const method = match[1]
      const route = match[2]
      const pathToModule = match[3]
      const args = match[4]

      if (!method) die('Expected method (line #%d)', index)
      if (!route) die('Expected tokenized url (line #%d)', index)
      if (!pathToModule) die('Expected path to file (line #%d)', index)

      const routeKeys = []
      route.replace(/:(\w+)/g, (_, k) => routeKeys.push(k))

      let module = null
      let location = path.join(process.cwd(), pathToModule)

      try {
        module = require(location)
      } catch (err) {
        die('Module not found (%s)', location)
      }

      if (!module.test && !module.handler && typeof module !== 'function') {
        die('Expected module to export at least one method (line #%d)', index)
      }

      return {
        method,
        methodExp: new RegExp(method),
        route,
        routeExp: pathToRegexp(route),
        routeKeys,
        pathToModule,
        module,
        args
      }
    })
    .filter(r => !!r)
}


