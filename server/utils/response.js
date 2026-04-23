const success = (res, data, message = 'Success') => {
  res.json({ success: true, message, data });
};

const error = (res, status, message) => {
  res.status(status).json({ success: false, error: message });
};

module.exports = { success, error };