const userLookup = function(newEmail, database) {
  for (const id in database) {
    if (database[id].email === newEmail) {
      return id;
    }
  }

  return false;
};

module.exports = { userLookup };