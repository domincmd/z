# Z

z is a passion project satire version of x.

## THINGS TO DO

 - clicking a name that is not yours still redirects you to your own profile
 - credits tab does not exist yet
 - emoji tab does not exist yet
 - reposting functionality does not exist yet


## database structure

### users
contains id - integer primary key  
contains username - unique text  
contains pfp - text  
contains password - text  

### tweets
contains id - integer primary key  
contains user_id - integer (references users id)  
contains content - text  

### likes
contains user_id - integer (references users id)  
contains tweet_id - integer (references tweets id)  

primary key:  
(user_id, tweet_id)  

### reposts
contains user_id - integer (references users id)  
contains tweet_id - integer (references tweets id)  

primary key:  
(user_id, tweet_id)  