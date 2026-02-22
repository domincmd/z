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
    likes INTEGER,
    reposts INTEGER
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

    if (!req.session.user) {
        return res.redirect('/enter');
    }

    db.run("INSERT INTO tweets(user, content, likes, reposts) VALUES (?, ?, ?, ?)", [req.session.user.username, tweet, 0, 0], (err) => {
        if (err) {console.log(err); return res.send("error: " + err)}
        
        return res.redirect("/")
    })

})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})