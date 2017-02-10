exports.test = (req, res, context, next) => {
  if (context.id === 2) return next(new Error())
  next()
}

exports.handler = function (req, res, context, next) {
  res.statusCode = 200
  res.end('OK')
  next()
}

