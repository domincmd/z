const express = require('express')
const path = require('path');
const sqlite3 = require('sqlite3').verbose()
const session = require('express-session');
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

let sql;

//connect to database
const db = new sqlite3.Database('./x.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message) //if there is an error, log it as such
})

//create users table
/*sql = `CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    password TEXT
);`

db.run(sql)*/

/*sql = `CREATE TABLE tweets (
    id INTEGER PRIMARY KEY,
    user TEXT,
    content TEXT,
);`

db.run(sql)*/

app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/enter');
    }

    db.all(
      `SELECT * FROM tweets WHERE user = ?`,
      [req.session.user.username],
      (err, rows) => {
        if (err) console.error(err);

        res.render('home', {
            user: req.session.user,
            your_posts: rows,
            pfp: ":)"
        });
      }
    );

    
});

app.get('/enter', (req, res) => {
    res.render('enter.ejs', {signup_message: null, login_message: null})
})

app.post("/signup", (req, res) => {
    const data = req.body;

    if (data.password != data.cpassword) return res.render('enter.ejs', {signup_message: "passwords do not match", login_message: null})

    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {console.error(err); return res.render('enter.ejs', {signup_message: "db error", login_message: null});}

        // check if user already is taken
        for (const row of rows) {
            if (row.username === data.username) {
                return res.render('enter.ejs', {signup_message: "username already in use", login_message: null})
            }
        }

        // insert user into db
        db.run("INSERT INTO users(username, password) VALUES (?, ?)", [data.username, data.password], (err) => {
                if (err) {
                    console.error(err);
                    return res.render('enter.ejs', {signup_message: "insert error", login_message: null})
                }

                return res.render('enter.ejs', {signup_message: "successfully signed up, you may now log in", login_message: null})
            }
        );
    });
});

app.post("/login", (req, res) => {
    const data = req.body

    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {console.error(err); return res.render('enter.ejs', {signup_message: "db error", login_message: null});}

        for (const row of rows) {
            if (row.username === data.username) {
                if (row.password != data.password) return res.render('enter.ejs', {signup_message: null, login_message: "password is incorrect"})
                
                //successfully logged in code
                req.session.user = {
                    username: data.username
                };
                return res.redirect('/');
            }
        }

        return res.render('enter.ejs', {signup_message: null, login_message: "username not found"})
    });
})

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

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})