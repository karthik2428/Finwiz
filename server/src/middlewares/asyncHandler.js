// src/middlewares/asyncHandler.js
// small helper to avoid try/catch repetition in async controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
