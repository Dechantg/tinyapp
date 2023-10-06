

const getUserByEmail = (email, database) => {
  const userId = Object.keys(database).find(user => database[user].email === email);
  return userId || false;

};

// 6 string randome key generator for URL keys
const generateRandomString = (char) => {
  //list of valid letters to use using what andy showed in lecture
  const randomString = Math.random().toString(36).substring(2, char);
  console.log(`Random String generated: ${randomString}`);
  
  return randomString;

};


module.exports = { getUserByEmail, generateRandomString };
