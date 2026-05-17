//this js file stores functions to CRUD the database for simpler syntax

import Database from "better-sqlite3";

const db = new Database("./x.db");

//define variables
const insertUserVariable = db.prepare("INSERT INTO users (username, pfp, password) VALUES (?, ?, ?)")
const getUserInfoVariable = db.prepare("SELECT * FROM users WHERE id = ?")
const getUserInfoByUsernameVariable = db.prepare("SELECT * FROM users WHERE username = ?")

const insertTweetVariable = db.prepare("INSERT INTO tweets (user_id, content) VALUES (?, ?)")
const getTweetsFromUserVariable = db.prepare("SELECT * FROM tweets WHERE user_id = ?")

/*TO ADD:
 - get if user liked a post or not
 - get if user reposted a post or not
 - get amount of likes a post has
 - get amount of reposts a post has
*/

//CRUD functions
export function insertUser(username, pfp, password) {
  try {
    const result = insertUserVariable.run(username, pfp, password)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to insert user:", error)

    return { success: false, error: error.message }
  }
}

export function getUserInfo(id) {
  try {
    const result = getUserInfoVariable.get(id)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to get user info:", error)

    return { success: false, error: error.message }
  }
}

export function getUserInfoByUsername(username) { //when called, this function returns success: true, result: undefined when the user exists, what could be the issue?
  try {
    const result = getUserInfoByUsernameVariable.get(username)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to get user id by username:", error)

    return { success: false, error: error.message }
  }
}

export function insertTweet(user_id, content) {
  try {
    const result = insertTweetVariable.run(user_id, content)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to insert tweet:", error)

    return { success: false, error: error.message }
  }
}

export function getTweetsFromUser(user_id) {
  try {
    const result = getTweetsFromUserVariable.all(user_id)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to get tweets from user:", error)

    return { success: false, error: error.message }
  }
}