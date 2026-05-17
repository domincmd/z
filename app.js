import express from "express"
import path from "path"
import { fileURLToPath } from 'node:url'
import session from "express-session"
import { getUserInfoByUsername, getUserInfo, insertUser } from "./js/db.js"

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
    console.log(info);

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

    console.log(data)

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

    console.log(info)
    if (info.result.password !== data.password) {
        return res.send("passwords do not match")
    }
    req.session.userid = info.result.id
    return res.redirect('/');
})
/*
app.post("/post", (req, res) => {
    const tweet = req.body.tweet;

    if (tweet == "") {
        return res.send("cant tweet nothing")
    }

    if (!req.session.user) {
        return res.redirect('/enter');
    }

    db.run("INSERT INTO tweets(user, content) VALUES (?, ?)", [req.session.user.username, tweet], (err) => {
        if (err) {console.log(err); return res.send("error: " + err)}
        
        return res.redirect("/")
    })

})

app.post("/likes", (req, res) => {
    const { post_id, username } = req.body;

    if (post_id == null || username == null) {
        return res.status(400).json({ error: "Missing data" });
    }

    //THIS ADDS A LIKE, WE NEED A FUNCTION TO GET LIKES AND ACTUALLY KNOW IF THE USER LIKED IT
    db.get(
    `
    SELECT
      COUNT(*) AS count,
      EXISTS(
        SELECT 1 FROM post_likes WHERE post_id = ? AND username = ?
      ) AS has_user
    FROM post_likes
    WHERE post_id = ?
    `,
    [post_id, username, post_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      //console.log(row);

      res.json({
        count: row.count,
        hasUser: !!row.has_user
      });
    }
  );
})

app.post("/reposts", (req, res) => {
    const { post_id, username } = req.body;

    if (post_id == null || username == null) {
        return res.status(400).json({ error: "Missing data" });
    }

    //THIS ADDS A LIKE, WE NEED A FUNCTION TO GET LIKES AND ACTUALLY KNOW IF THE USER LIKED IT
    db.get(
    `
    SELECT
      COUNT(*) AS count,
      EXISTS(
        SELECT 1 FROM post_reposts WHERE post_id = ? AND username = ?
      ) AS has_user
    FROM post_reposts
    WHERE post_id = ?
    `,
    [post_id, username, post_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      //console.log(row);

      res.json({
        count: row.count,
        hasUser: !!row.has_user
      });
    }
  );
})

app.post("/authorcontent", (req, res) => {
    const { post_id } = req.body;

    if (post_id == null) {
        return res.status(400).json({ error: "Missing data" });
    }
    
    db.get(
    "SELECT user, content FROM tweets WHERE id = ?",
    [post_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Not found" });

      res.json(row);
    }
  );
})

app.post("/togglelike", (req, res) => {
    if (!req.session.user) {
        return res.redirect('/enter');
    }

    const { post_id } = req.body;
    const user = req.session.user.username;

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 1. Try removing the like
        db.run(
            `DELETE FROM post_likes
             WHERE post_id = ? AND username = ?`,
            [post_id, user],
            function (err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "db error" });
                }

                const removed = this.changes === 1;

                const finish = (hasLiked) => {
                    // 3. Get updated like count
                    db.get(
                        `SELECT COUNT(*) AS count
                         FROM post_likes
                         WHERE post_id = ?`,
                        [post_id],
                        (err2, row) => {
                            if (err2) {
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: "db error" });
                            }

                            db.run("COMMIT");

                            res.json({
                                has_liked: hasLiked,           // 1 or 0
                                current_like_count: row.count  // total likes
                            });
                        }
                    );
                };

                // 2. If removed → user unliked
                if (removed) {
                    finish(0);
                } else {
                    // otherwise insert new like
                    db.run(
                        `INSERT INTO post_likes (post_id, username)
                         VALUES (?, ?)`,
                        [post_id, user],
                        function (err3) {
                            if (err3) {
                                db.run("ROLLBACK");
                                return res.status(500).json({ error: "db error" });
                            }

                            finish(1);
                        }
                    );
                }
            }
        );
    });
});

app.get("/profile", (req, res) => {
    const username = req.query.u;

    if (!req.session.user) {
        return res.redirect('/enter');
    }

    db.get(
        "SELECT COUNT(*) AS count FROM users WHERE username = ?;",
        [username],
        (err, row) => {
            if (err) {
                console.error(err);
                return res.send("error: " + err);
            }

            db.all("SELECT * FROM tweets WHERE user = ?;", [username], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.send("error: " + err);
                }

                //console.log(result)

                res.render('profile', {
                    user: req.session.user.username, //actual user
                    pfp: ":)", //actual user's pfp
                    user_viewed: username, //user that is being viewed
                    user_viewed_pfp: ":0", //user being viewed pfp
                    tweets: result,
                    
                });
            })

            
            
        }
    );
});
*/

app.get('/exit', (req, res) => {
    req.session.userid = null
    res.redirect('/')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})