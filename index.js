import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import supabase from "./db.js"; // Supabase client



const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Helper functions
async function getUserId(username) {
  const { data, error } = await supabase
    .from("user_details")
    .select("user_id")
    .eq("user_name", username)
    .limit(1)
    .single();
    
  if (error || !data) return null;
  return data.user_id;
}

async function getUserTasks(username) {
  const userId = await getUserId(username);
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from("to_do_tasks")
    .select("task")
    .eq("user_id", userId);
    
  if (error) return [];
  return data;
}

async function verifyIdentity(username, password) {
  const { data, error } = await supabase
    .from("user_details")
    .select("user_password")
    .eq("user_name", username)
    .limit(1)
    .single();
    
  if (error || !data) return false;
  return data.user_password === password;
}

// Routes
app.get("/", (req, res) => {
  res.render("homepage.ejs");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const isValid = await verifyIdentity(username, password);

  if (isValid) {
    const tasks = await getUserTasks(username);
    res.render("mainpage.ejs", { username, tasks });
  } else {
    res.render("homepage.ejs", { error: "Invalid Authentication!" });
  }
});

app.get("/create-account", (req, res) => {
  res.render("createaccount.ejs");
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const { data, error } = await supabase
    .from("user_details")
    .insert([{ user_name: username, user_password: password }]);
    
  if (error) {
    console.error(error);
    return res.render("createaccount.ejs", { error: "Cannot create account!" });
  }
  
  res.render("mainpage.ejs", { username, tasks: [] });
});

app.post("/add-task", async (req, res) => {
  const { username, task } = req.body;
  const trimmedTask = task.trim();
  const userId = await getUserId(username);

  const { data, error } = await supabase
    .from("to_do_tasks")
    .insert([{ user_id: userId, task: trimmedTask }]);
  
  const tasks = await getUserTasks(username);
  
  if (error) {
    console.error(error);
    return res.render("mainpage.ejs", { username, tasks, celebrate: false, error: "Cannot add task!" });
  }

  res.render("mainpage.ejs", { username, tasks, celebrate: false });
});

app.post("/edit-task", async (req, res) => {
  const { username, oldTask, newTask } = req.body;
  const userId = await getUserId(username);

  const { data, error } = await supabase
    .from("to_do_tasks")
    .update({ task: newTask.trim() })
    .eq("user_id", userId)
    .eq("task", oldTask.trim());
  
  const tasks = await getUserTasks(username);
  
  if (error) {
    console.error(error);
    return res.render("mainpage.ejs", { username, tasks, celebrate: false, error: "Cannot edit task!" });
  }

  res.render("mainpage.ejs", { username, tasks, celebrate: false });
});

app.post("/delete-task", async (req, res) => {
  const { username, task } = req.body;
  const userId = await getUserId(username);

  const { data, error } = await supabase
    .from("to_do_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("task", task.trim());
  
  const tasks = await getUserTasks(username);

  if (error) {
    console.error(error);
    return res.render("mainpage.ejs", { username, tasks, celebrate: false, error: "Cannot delete task!" });
  }

  res.render("mainpage.ejs", { username, tasks, celebrate: false });
});

app.post("/complete-task", async (req, res) => {
  const { username, task } = req.body;
  const userId = await getUserId(username);

  const { data, error } = await supabase
    .from("to_do_tasks")
    .delete()
    .eq("user_id", userId)
    .eq("task", task.trim());

  const tasks = await getUserTasks(username);

  if (error) {
    console.error(error);
    return res.render("mainpage.ejs", { username, tasks, celebrate: false, error: "Error completing task!" });
  }

  res.render("mainpage.ejs", { username, tasks, celebrate: true });
});

console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
