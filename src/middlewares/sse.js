module.exports = (req, res, next) => {
  res.sse = {
    send: (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    },
  };

  next();
};
