import express from "express";
import bodyParser from "body-parser";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;
const {Client } = pkg;

const db = new Client({
 user: process.env.DB_USER,
  host: "localhost",
  database: "userdata",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

try {
    await db.connect();
    console.log("Connected to Database ! ")
} catch (error) {
    console.log("Eroor connecting to Database ");
}


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));

//function to get user id
async function getuserid(username){
    const response = await db.query("SELECT user_id FROM user_details WHERE user_name = $1" ,[username]);
    const user_id = parseInt(response.rows[0].user_id);
    console.log(user_id);
    return user_id;
}


//function to get user task 
async function getusertasks(username){
   const userid = await getuserid(username);
   const response = await db.query("SELECT  task FROM to_do_tasks WHERE user_id = $1", [userid]);
   const usertasks = response.rows;
   console.log(usertasks);

   return usertasks ;
}

async function verifyIdentity(username, password) {
    const response = await db.query(
        "SELECT user_password FROM user_details WHERE user_name = $1",
        [username]
    );

    // Check if user exists
    if (response.rows.length === 0) {
        return 0; // User not found
    }

    const db_password = response.rows[0].user_password;

    // Compare passwords
    if (db_password === password) {
        return 1; // Match
    } else {
        return 0; // Wrong password
    }
}


app.get("/" , async (req , res)=>{
    res.render("homepage.ejs");
});







//user login
app.post("/login" , async(req , res )=>{
const entered_username = req.body.username;
const entred_userpassword = req.body.password;
console.log("Username : " , entered_username , "Password : " , entred_userpassword);
const result = await verifyIdentity(entered_username , entred_userpassword);

if(result == 1 ){
    const user_tasks = await getusertasks(entered_username);

    res.render("mainpage.ejs" , {
        username:entered_username,
        tasks : user_tasks,
    });
}
else{
    console.log("Invalid Auhtetication  ");
    res.render("homepage.ejs" , {error: "Invalid Authentication ! "});
}
});

app.get("/create-account" , async(req , res)=>{
res.render("createaccount.ejs");
});

//user sign up 
app.post("/register" , async(req , res )=>{
const username = req.body.username;
const password = req.body.password;
console.log("Username : " , username , "Password  : " , password);

try {
    db.query("INSERT INTO user_details (user_name , user_password ) VALUES ($1 , $2)" , [username , password]);
    let tasks = [];
    res.render("mainpage.ejs" , {username , tasks});
} catch (error) {
    console.log("Cannot insert data");
}
});


app.post("/add-task", async (req, res) => {
    const username = req.body.username;
    const task = req.body.task.trim();

    try {
        const userId = await getuserid(username);
        await db.query("INSERT INTO to_do_tasks (user_id, task) VALUES ($1, $2)", [userId, task]);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false
        });
    } catch (error) {
        console.error("Cannot add data", error);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false,
            error: "Cannot add task!"
        });
    }
});


app.post("/edit-task", async (req, res) => {
    const username = req.body.username;
    const oldTask = req.body.oldTask.trim();
    const newTask = req.body.newTask.trim();

    try {
        const userId = await getuserid(username);
        await db.query(
            "UPDATE to_do_tasks SET task = $1 WHERE user_id = $2 AND task = $3",
            [newTask, userId, oldTask]
        );
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false
        });
    } catch (error) {
        console.error("Cannot update data", error);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false,
            error: "Cannot edit task!"
        });
    }
});


app.post("/delete-task", async (req, res) => {
    const username = req.body.username;
    const task = req.body.task.trim();

    try {
        const userId = await getuserid(username);
        await db.query("DELETE FROM to_do_tasks WHERE user_id = $1 AND task = $2", [userId, task]);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false
        });
    } catch (error) {
        console.error("Cannot delete data", error);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false,
            error: "Cannot delete task!"
        });
    }
});


app.post("/complete-task", async (req, res) => {
    const username = req.body.username;
    const task = req.body.task.trim();

    try {
        const userId = await getuserid(username);
        await db.query("DELETE FROM to_do_tasks WHERE user_id = $1 AND task = $2", [userId, task]);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: true 
        });
    } catch (error) {
        console.error("Error completing task", error);
        const user_tasks = await getusertasks(username);
        res.render("mainpage.ejs", {
            username,
            tasks: user_tasks,
            celebrate: false,
            error: "Error completing task!"
        });
    }
});



app.listen(port , ()=>{
    console.log("Server Running on Port : " , port);
} );