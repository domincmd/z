import express from "express"
import path from "path"
import { fileURLToPath } from 'node:url'
import session from "express-session"
import { getUserInfoByUsername, getUserInfo, insertUser, insertTweet, getTweetsFromUser, getTweetLikesAndReposts, getTweetFromId, getIfUserLikedOrRepostedTweet, toggleLike, toggleRepost } from "./js/db.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = 3000

app.use(session({
    secret: 'password123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // true if using HTTPS
}));

//use ejs
app.set('view engine', 'ejs');

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    if (!req.session.userid) {
        return res.redirect('/enter');
    }

    const info = getUserInfo(req.session.userid);

    res.render('home', {
        username: info.result.username,
        pfp: info.result.pfp
    });

    
});

app.get('/enter', (req, res) => {
    res.render('enter.ejs', {signup_message: null, login_message: null})
})

app.post("/signup", (req, res) => {
    const data = req.body;

    if (data.password != data.cpassword) {return res.render('enter.ejs', {signup_message: "passwords do not match", login_message: null})}
    if (
        data.username.includes(" ") ||
        data.password.includes(" ") ||
        data.cpassword.includes(" ")
    ) {
        return res.render('enter.ejs', {
            signup_message: "do not use spaces in username or password",
            login_message: null
        });
    }

    // insert user into db
    const insert = insertUser(data.username, ":)", data.password)
    if (insert.success == true) {return res.render('enter.ejs', {signup_message: "successfully signed up, you may now log in", login_message: null})}
    else {return res.send(insert.error)}
});

app.post("/login", (req, res) => {
    const data = req.body

    const info = getUserInfoByUsername(data.username)
    if (info.success == false) {
        return res.send(info.error)
    }
    if (info.result.password !== data.password) {
        return res.send("passwords do not match")
    }
    req.session.userid = info.result.id
    return res.redirect('/');
})

app.post("/post", (req, res) => {
    const tweet = req.body.tweet;
    if (!req.session.userid) {
        return res.redirect('/enter');
    }

    if (tweet == "") {
        return res.send("cant tweet nothing")
    }

    const insert = insertTweet(req.session.userid, tweet)
    if (insert.success == false) {
        console.log(insert.error)
        return res.send(insert.error)
    }
    return res.redirect('/');
})

app.get("/profile", (req, res) => {
    const viewing = req.query.u;

    if (!req.session.userid) {
        return res.redirect('/enter');
    }

    const info = getUserInfo(req.session.userid);
    if (info.success == false) {
        console.log(info.error)
        return res.send(info.error)
    }
    const viewingInfo = getUserInfoByUsername(viewing);
    if (viewingInfo.success == false) {
        console.log(viewingInfo.error)
        return res.send(viewingInfo.error)
    }

    const tweetsFromViewing = getTweetsFromUser(viewingInfo.result.id)
    if (tweetsFromViewing.success == false) {
        console.log(tweetsFromViewing.error)
        return res.send(tweetsFromViewing.error)
    }

    res.render('profile', {
        username: info.result.username, //actual user
        pfp: info.result.pfp, //actual user's pfp
        viewing: viewing, //user that is being viewed
        viewing_pfp: viewingInfo.result.pfp, //user being viewed pfp
        tweets: tweetsFromViewing.result,
    });
});

app.post("/tweet-info", (req, res) => {
    const tweetid = req.body.tweetid
    const userid = req.body.userid
    let liked = null
    let reposted = null

    const tweet = getTweetFromId(tweetid);
    if (tweet.success == false) {
        console.log(info.error)
        return res.json({
            success: false,
            error: tweet.error
        })
    }

    const tweetLikesAndReposts = getTweetLikesAndReposts(tweetid);
    if (tweetLikesAndReposts.success == false) {
        console.log(tweetLikesAndReposts.error)
        return res.json({
            success: false,
            error: tweetLikesAndReposts.error
        })
    }

    const author = getUserInfo(tweet.result.user_id)
    if (author.success == false) {
        console.log(author.error)
        return res.json({
            success: false,
            error: author.error
        })
    }

    if (userid) {
        const userEngagement = getIfUserLikedOrRepostedTweet(tweetid, userid)
        liked = (userEngagement.liked) ? true : false
        reposted = (userEngagement.reposted) ? true : false
    }

    res.json({
        success: true,
        tweet: {
            authorid: tweet.result.user_id,
            author: author.result.username,
            authorpfp: author.result.pfp,
            content: tweet.result.content,
            likes: tweetLikesAndReposts.likes["COUNT(*)"],
            reposts: tweetLikesAndReposts.reposts["COUNT(*)"]
        },
        user_engagement: {
            liked: liked,
            reposted: reposted,
        }
    })
})

app.post("/toggle-like", (req, res) => {
    const userid = req.session.userid
    const tweetid = req.body.tweetid

    if (!userid) {
        return res.json({
            success: false,
            error: "no session!"
        });
    }

    const result = toggleLike(tweetid, userid)

    res.json({
        success: result.success,
        liked: result.liked,
        likes: result.likes
    })
})

app.post("/toggle-repost", (req, res) => {
    const userid = req.session.userid
    const tweetid = req.body.tweetid

    if (!userid) {
        return res.json({
            success: false,
            error: "no session!"
        });
    }

    const result = toggleRepost(tweetid, userid)

    res.json({
        success: result.success,
        reposted: result.reposted,
        reposts: result.reposts
    })
})

app.get('/exit', (req, res) => {
    req.session.userid = null
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})