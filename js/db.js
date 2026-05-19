//this js file stores functions to CRUD the database for simpler syntax

import Database from "better-sqlite3";

const db = new Database("./x.db");

//define variables
const insertUserVariable = db.prepare("INSERT INTO users (username, pfp, password) VALUES (?, ?, ?)")
const getUserInfoVariable = db.prepare("SELECT * FROM users WHERE id = ?")
const getUserInfoByUsernameVariable = db.prepare("SELECT * FROM users WHERE username = ?")

const insertTweetVariable = db.prepare("INSERT INTO tweets (user_id, content) VALUES (?, ?)")
const getTweetsFromUserVariable = db.prepare("SELECT * FROM tweets WHERE user_id = ?")

const getTweetLikesVariable = db.prepare("SELECT COUNT(*) FROM likes WHERE tweet_id = ?")
const getTweetRepostsVariable = db.prepare("SELECT COUNT(*) FROM reposts WHERE tweet_id = ?")
const getTweetFromIdVariable = db.prepare("SELECT * FROM tweets WHERE id = ?")

const getIfUserLikedTweetVariable = db.prepare("SELECT * FROM likes WHERE tweet_id = ? AND user_id = ?")
const getIfUserRepostedTweetVariable = db.prepare("SELECT * FROM reposts WHERE tweet_id = ? AND user_id = ?")

const addUserLikeVariable = db.prepare("INSERT INTO likes (tweet_id, user_id) VALUES (?, ?)")
const removeUserLikeVariable = db.prepare("DELETE FROM likes WHERE tweet_id = ? AND user_id = ?")

const addUserRepostVariable = db.prepare("INSERT INTO reposts (tweet_id, user_id) VALUES (?, ?)")
const removeUserRepostVariable = db.prepare("DELETE FROM reposts WHERE tweet_id = ? AND user_id = ?")


/*TO ADD:
 - get if user liked a post or not
 - get if user reposted a post or not
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

export function getTweetLikesAndReposts(tweet_id) {
  try {
    const likes = getTweetLikesVariable.get(tweet_id)
    const reposts = getTweetRepostsVariable.get(tweet_id)

    return { success: true, likes: likes, reposts: reposts }
  } catch (error) {
    console.error("Failed to get tweet likes and reposts:", error)

    return { success: false, error: error.message }
  }
}

export function getTweetFromId(tweet_id) {
  try {
    const result = getTweetFromIdVariable.get(tweet_id)

    return { success: true, result }
  } catch (error) {
    console.error("Failed to get tweet from id:", error)

    return { success: false, error: error.message }
  }
}

export function getIfUserLikedOrRepostedTweet(tweet_id, user_id) {
  try {
    const liked = getIfUserLikedTweetVariable.get(tweet_id, user_id)
    const reposted = getIfUserRepostedTweetVariable.get(tweet_id, user_id)

    return { success: true, liked, reposted }
  } catch (error) {
    console.error("Failed to get tweet from id:", error)

    return { success: false, error: error.message }
  }
}

export function toggleLike(tweet_id, user_id) {
  try {
    const liked = !!getIfUserLikedTweetVariable.get(tweet_id, user_id)
    if (liked) {
      removeUserLikeVariable.run(tweet_id, user_id)
    } else {
      addUserLikeVariable.run(tweet_id, user_id)
    }

    const likes = getTweetLikesVariable.get(tweet_id)["COUNT(*)"]

    return { 
      success: true, 
      liked: liked, 
      likes: likes 
    }
  } catch (error) {
    console.error("Failed to get tweet from id:", error)

    return { success: false, error: error.message }
  }
}

export function toggleRepost(tweet_id, user_id) {
  try {
    const reposted = !!getIfUserRepostedTweetVariable.get(tweet_id, user_id)

    if (reposted) {
      removeUserRepostVariable.run(tweet_id, user_id)
    } else {
      addUserRepostVariable.run(tweet_id, user_id)
    }

    const reposts = getTweetRepostsVariable.get(tweet_id)["COUNT(*)"]

    return { 
      success: true, 
      reposted: reposted, 
      reposts: reposts
    }
  } catch (error) {
    console.error("Failed to get tweet from id:", error)

    return { success: false, error: error.message }
  }
}