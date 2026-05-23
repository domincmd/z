// THIS FILE STORES ALL FUNCTIONALITY RELATED TO POSTS
// THIS INCLUDES LIKES, REPOSTS AND POST RENDERING

const generalPostContainer = document.querySelector(".general-post-container");

function getTweetInfo(tweetid, userid) { //in this case, user refers to the user viewing the post, to see if he has liked it or not
    return fetch("/tweet-info", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            tweetid: tweetid,
            userid: userid
        })
    }).then(res => res.json());
}

function renderPost(tweetid = 1, userid = 1) {

    if (isNaN(tweetid)) {
        console.error("id is not a nubmer!");
        return;
    }

    //build element

    const post = document.createElement("div");
    const pfp = document.createElement("div");
    const contentContainer = document.createElement("div");
    const reactions = document.createElement("div");

    const strong = document.createElement("strong");
    const content = document.createElement("span");

    const likeImg = document.createElement("img");
    const likeSpan = document.createElement("span");
    const repostImg = document.createElement("img");
    const repostSpan = document.createElement("span");

    likeImg.src = "/images/heart_empty.svg";

    likeImg.addEventListener("mousedown", e => {
        toggleLike(tweetid)
    });

    likeImg.classList.add("like-img");
    likeSpan.classList.add("like-span");

    repostImg.src = "/images/repost_empty.svg";

    repostImg.addEventListener("mousedown", e => {
        toggleRepost(tweetid)
    });

    repostImg.classList.add("repost-img");
    repostSpan.classList.add("repost-span");

    content.textContent = "TESTCONTENT123123";
    strong.textContent = "TESTNAME";

    post.classList.add("post");
    post.classList.add(`post-${tweetid}`);

    pfp.classList.add("pfp");

    contentContainer.classList.add("content-container");
    reactions.classList.add("reactions");

    pfp.textContent = "A";

    reactions.appendChild(likeImg);
    reactions.appendChild(likeSpan);
    reactions.appendChild(repostImg);
    reactions.appendChild(repostSpan);

    contentContainer.appendChild(strong);
    contentContainer.appendChild(content);
    contentContainer.appendChild(reactions);

    post.appendChild(pfp);
    post.appendChild(contentContainer);

    //get and insert data

    getTweetInfo(tweetid, userid).then(results => {
        console.log(results);

        if (results.sucess == false) {
            //do stuff here
            return;
        }

        content.textContent = results.tweet.content;
        strong.textContent = results.tweet.author;
        pfp.textContent = results.tweet.authorpfp;

        likeSpan.textContent = results.tweet.likes;

        strong.addEventListener("click", e => {
            window.location.href = `/profile?u=${results.tweet.author}`;
        });

        if (results.user_engagement.liked) {
            likeImg.classList.add("full");
            likeImg.src = "/images/heart_full.svg";
        } else {
            likeImg.classList.add("empty");
            likeImg.src = "/images/heart_empty.svg";
        }

        repostSpan.textContent = results.tweet.reposts;

        if (results.user_engagement.reposted) {
            repostImg.classList.add("full");
            repostImg.src = "/images/repost_full.svg";
        } else {
            repostImg.classList.add("empty");
            repostImg.src = "/images/repost_empty.svg";
        }

        generalPostContainer.appendChild(post);
    });
}

function toggleLike(tweetid) {

    if (isNaN(tweetid)) {
        console.error("id is not a number!");
        return;
    }

    fetch("/toggle-like", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tweetid: tweetid })
    })

    .then(res => res.json()) // parse JSON

    .then(data => {
        const matching_posts = document.querySelectorAll(`.post-${(tweetid)}`);

        matching_posts.forEach(post => {

            const likeImg = post.querySelector(".like-img");
            const likeSpan = post.querySelector(".like-span");

            if (data.liked == 0) {
                likeImg.classList.replace("empty", "full");
                likeImg.src = "/images/heart_full.svg";
            } else {
                likeImg.classList.replace("full", "empty");
                likeImg.src = "/images/heart_empty.svg";
            }

            likeSpan.textContent = data.likes;
        });
    })

    .catch(err => console.error(err));
}

function toggleRepost(tweetid) {

    if (isNaN(tweetid)) {
        console.error("id is not a number!");
        return;
    }

    fetch("/toggle-repost", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tweetid: tweetid })
    })

    .then(res => res.json()) // parse JSON

    .then(data => {
        const matching_posts = document.querySelectorAll(`.post-${(tweetid)}`);

        matching_posts.forEach(post => {

            const repostImg = post.querySelector(".repost-img");
            const repostSpan = post.querySelector(".repost-span");

            if (data.reposted == 0) {
                repostImg.classList.replace("empty", "full");
                repostImg.src = "/images/repost_full.svg";
            } else {
                repostImg.classList.replace("full", "empty");
                repostImg.src = "/images/repost_empty.svg";
            }

            repostSpan.textContent = data.reposts;
        });
    })

    .catch(err => console.error(err));
}