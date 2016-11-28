exports.test = (req, res, context, next) => {
  next()
}

exports.handler = function (req, res, context, next) {
  res.statusCode = 201
  res.end()
  next()
}

