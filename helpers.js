const generateRandomString = function() {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
};


const getUserByEmail = function(email, users) {
  for (let user in users) {
    if (email.toLowerCase().trim() === users[user].email.toLowerCase().trim()) {
      return users[user];
    }
  }
  return false;
};

module.exports = {getUserByEmail, generateRandomString}