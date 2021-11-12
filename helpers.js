// uses email input to lookup user data.
const userLookup = function(newEmail, database) {
  for (const id in database) {
    if (database[id].email === newEmail) {
      return id;
    }
  }

  return false;
};

// looks up users specific URLs.
const urlsForUser = function(id, database) {
  const userURLs = {};

  if (!id) { // if user isn't logged in, null.
    return null;
  }

  for (const item in database) { // loops through URL database to find all the urls belonging to logged in user.
    if (database[item].userID === id) {
      userURLs[item] = database[item];
    }
  }

  return userURLs;
};

// returns users email using thier id cookie.
const getEmailFromId = (user_id, database) => {
  return (database[user_id]) ? database[user_id].email : null;
};

// for creating user id's and shortURLs.
const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

module.exports = { userLookup, urlsForUser, getEmailFromId, generateRandomString };