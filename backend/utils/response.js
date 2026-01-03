export const success = (res, data) => {
  res.status(200).json(data);
};

export const error = (res, message, code = 400) => {
  res.status(code).json({ error: message });
};
