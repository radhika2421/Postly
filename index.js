import express from "express";
import { v4 as uuidv4 } from 'uuid';
import { faker } from '@faker-js/faker';
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";
import path from "path";
import methodOverride from "method-override";
import { connect } from "http2";

const app=express();
const __filename = fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,"public")));

const connection=await mysql.createConnection({
    host:'localhost',
    user:'root',
    database:'postly',
    password:"radZ@2129#",
})
const port=8080;

const getDate = (d) => {
        return d.toLocaleDateString('en-CA');
    };

app.listen(port,()=>{
    console.log(`Listening at port ${port}`);
});

// Start
app.get('/postly',async (req,res)=>{
    let q = "SELECT COUNT(*) AS userCount FROM users";
    try {
        const [results] = await connection.query(q);
        res.render("postly", {userCount: results[0].userCount});
    }
    catch (err) {
        console.log(err);
        res.send("Some error");
    }
})

// showUsers
app.get('/postly/users',async(req,res)=>{
    let q=`SELECT * FROM users`;
    try{
        const [users]=await connection.query(q);
        res.render("users",{users});
    }
    catch(err){
        console.log(err);
        res.send("Cannot show users");
    }
})

// Register
app.get('/postly/register',async (req,res)=>
    {
        res.render("register");
    })
app.post('/postly/register',async (req,res)=>
    {
        let {name,email,password,passwordConfirm}=req.body;
        let userId=uuidv4();
        if(password!=passwordConfirm)
        {
            res.send("Passwords donot match");
        }
        else{
            let q=`INSERT into users VALUES ("${userId}","${name}","${email}","${password}");`;
            try{
                const [result]=await connection.query(q);
                res.redirect("/postly/login");
            }
            catch(err){
                console.log(err);
                res.send("Error");
            }
        }
    })

// Login
app.get('/postly/login',async (req,res)=>{
    res.render("login");
})
app.post('/postly/profile',async(req,res)=>{
    let {email,password}=req.body;
    let q1=`Select * from users where email="${email}"`;
    try{
        let [result1]=await connection.query(q1);
        if(result1[0]===undefined)
        {
            res.render("register");
        }
        else if(result1[0].password!=password)
        {
            res.send("Wrong password");
        }
        else
        {
            res.redirect(`/postly/profile/${result1[0].userId}`);
        }
    }
    catch(err){
        console.log(err);
    }
})

// profile
app.get('/postly/profile/:id',async(req,res)=>{
    let {id}=req.params;
    let q1=`Select * from users where userId="${id}"`;
    try
    {
        let [result1]=await connection.query(q1);
        let q2=`Select * from posts where userId="${result1[0].userId}"`;
        let q3=`Select COUNt(*) as postCnt from posts where userId="${result1[0].userId}"`;
        try{
            const [result2]=await connection.query(q2);
            const [result3]=await connection.query(q3);
            res.render("profile",{
                user:result1[0],
                posts:result2,
                postCnt:result3[0].postCnt
            })
        }
        catch(err)
        {
            console.log(err);
        }
    }
    catch(err){
        console.log(err);
    }
})

// others profile
app.get('/postly/:userid/profile/:otherid',async(req,res)=>{
    let {userid,otherid}=req.params;
    if(userid===otherid)
    {
        res.redirect(`/postly/profile/${userid}`);
    }
    else{
        let q1=`Select * from users where userId="${otherid}"`;
        try
        {
            let [result1]=await connection.query(q1);
            let q2=`Select * from posts where userId="${result1[0].userId}"`;
            let q3=`Select COUNt(*) as postCnt from posts where userId="${result1[0].userId}"`;
            try{
                const [result2]=await connection.query(q2);
                const [result3]=await connection.query(q3);
                res.render("othersprofile",{
                    user:result1[0],
                    posts:result2,
                    postCnt:result3[0].postCnt
                })
            }
            catch(err)
            {
                console.log(err);
            }
        }
        catch(err){
            console.log(err);
        }
    }
})

// Home
app.get('/postly/home/:id',async(req,res)=>{
    let {id}=req.params;
    let q=`Select * from users where userId="${id}"`;
    let q1=`SELECT posts.postId,posts.subject,posts.content, posts.date_posted,users.userId,users.name
        FROM posts JOIN users
        ON posts.userId = users.userId
        ORDER BY posts.date_posted DESC;`;
    try{
        const [result]=await connection.query(q);
        const [result1]=await connection.query(q1);
        res.render("home",{user: result[0],posts:result1});
    }
    catch(err){
        console.log(err);
    }
})



// edit name
app.get('/postly/profile/edit-name/:id',async (req,res)=>
    {
        let {id}=req.params;
        let q=`SELECT * FROM users WHERE userId="${id}"`;
        try{
            const [result]=await connection.query(q);
            res.render("editname",{user: result[0]});
        }
        catch(err){
            console.log(err);
            res.send("Cannot fetch details");
        }
    })
app.patch('/postly/edit-name/:id',async (req,res)=>
    {
        let {id}=req.params;
        let {username,password}=req.body;
        let q=`SELECT * FROM users where userId="${id}"`;
        try{
            const [result]=await connection.query(q);
            if(result[0].password!=password)
            {
                res.send("Wrong password!");
            }
            else{
                let q2=`UPDATE users SET name="${username}" WHERE userID="${id}"`;
                try{
                    const [result1]=await connection.query(q2);
                    res.redirect(`/postly/profile/${id}`);
                }
                catch(err){
                    console.log(err);
                    res.send("Error");
                }
            }
        }
        catch(err){
            console.log(err);
        }
    })

//change password
app.get('/postly/change-password/:id',async (req,res)=>
    {
        let {id}=req.params;
        let q=`SELECT * FROM users WHERE userId="${id}"`;
        try{
            const [result]=await connection.query(q);
            res.render("changepassword",{user: result[0]});
        }
        catch(err){
            console.log(err);
        }
    })
app.patch('/postly/change-password/:id',async (req,res)=>
    {
        let {id}=req.params;
        let {oldP,newP}=req.body;
        let q=`SELECT * FROM users where userId="${id}"`;
        try{
            const [result]=await connection.query(q);
            if(result[0].password===oldP)
            {
                let q2=`UPDATE users SET password="${newP}" WHERE userID="${id}"`;
                try{
                    const [result]=await connection.query(q2);
                    res.redirect(`/postly/profile/${id}`);
                }
                catch(err){
                    console.log(err);
                }
            }
            else if(newP===oldP)
            {
                res.send("New password same as old password");
            }
            else
            {
                res.send("Wrong password");
            }
        }
        catch(err){
            console.log(err);
        }
    })

// delete Acc
app.get('/postly/delete-account/:id',async (req,res)=>{
    let {id}=req.params;
    let q=`Select * from users where userId="${id}"`;
    try{
        const [results]=await connection.query(q);
        res.render("deleteacc.ejs",{user: results[0]});
    }
    catch(err){
        console.log(err);
    }
})
app.delete('/postly/delete/:id',async (req,res)=>
    {
        let {password}=req.body;
        let {id}=req.params;
        let q1=`Select * from users where userId="${id}"`;
        let q2=`DELETE from posts where userId="${id}"`;
        try{
                const [result]=await connection.query(q2);
                const [user]=await connection.query(q1);
                if(user[0].password===password)
                {
                    let q2=`DELETE FROM users where userId="${id}"`;
                    try{
                        const [result]=await connection.query(q2);
                        res.redirect('/postly');
                    }
                    catch(err){
                        console.log(err);
                    }
                }
                else{
                    res.send("Wrong password");
                }
            }
        catch(err){
            console.log(err);
        }
    })

// NewPost
app.get('/postly/new-post/:id',(req,res)=>{
    let {id}=req.params;
    res.render("newpost",{id});
})
app.post('/postly/new-post/:id',async (req,res)=>{
    let {id}=req.params;
    const {subject,content}=req.body;
    let postId=uuidv4();
    const date = getDate(new Date());
    let q1=`INSERT INTO posts VALUES ("${postId}","${subject}","${content}","${date}","${id}")`;
    try{
        const [results]=await connection.query(q1);
        res.redirect(`/postly/profile/${id}`);
    }
    catch(err)
    {
        console.log(err);
    }
})

// EditPost
app.get('/postly/edit-post/:id',async(req,res)=>{
    let {id}=req.params;
    let q=`SELECT * FROM POSTS WHERE postId="${id}"`
    try{
        const[result]=await connection.query(q);
        res.render("editpost",{post:result[0]});
    }
    catch(err){
        console.log(err);
    }
})
app.patch("/postly/edit-post/:id",async(req,res)=>{
    let {newContent}=req.body;
    let {id}=req.params;
    let q1=`SELECT * FROM POSTS WHERE postId="${id}"`
    try{
        const[result1]=await connection.query(q1);
        let q2=`UPDATE posts SET content="${newContent}" where postId="${id}"`
        try{
            const [result2]=await connection.query(q2);
            console.log(result2)
            res.redirect(`/postly/profile/${result1[0].userId}`);
        }
        catch(err){
            console.log(err);
        }
    }
    catch(err)
    {
        console.log(err);
    }
})

// deletePost
app.delete("/postly/delete-post/:userId/:postId",async(req,res)=>{
    let {userId,postId}=req.params;
    let q=`Select * from posts where postId="${postId}"`;
    try{
        const[result]=await connection.query(q);
        let q1=`DELETE FROM POSTS WHERE postId="${postId}"`
        const[result1]=await connection.query(q1);
        res.redirect(`/postly/profile/${userId}`);
    }
    catch(err)
    {
        console.log(err);
    }
})