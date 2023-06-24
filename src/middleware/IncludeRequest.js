export default (req, res, next) => {
  req.body.headers = req.headers;
  req.body.headers.base_url = `${req.protocol}://${req.get("host")}`;
  req.body.query = req.query;
  next();
};
