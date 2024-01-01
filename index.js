// using dependencies
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// connecting to mongo using mongoose, creating schemas in order to input them to models
mongoose.connect(process.env.MONGO_URI);

const user_schema = new Schema({
  username: String,
});

const exercise_schema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
});

const User = mongoose.model("User", user_schema);
const Exercise = mongoose.model("Exercise", exercise_schema);

// middleswares
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route access
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// username POST request API
app.post('/api/users', async (req, res) => {
  console.log(req.body) // checking if middleware for urlencoded is working

  const user_obj = new User({ username: req.body.username });

  try {
    const created_user = await user_obj.save();
    res.json(created_user);
  } catch(e) {
    console.log(e);
  }
  
});

// exercise POST request
app.post('/api/users/:_id/exercises', async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const find_user = await User.findById(id);

    if(!find_user) {
      res.send("Could not find user id");
    } else {
      const exercise_obj = new Exercise({
        user_id: find_user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date(),
      });

      const exercise_created = await exercise_obj.save();
      res.json({
        _id: find_user._id,
        username: find_user.username,
        description: exercise_created.description,
        duration: exercise_created.duration,
        date: new Date(exercise_created.date).toDateString()
      });
    }
  } catch(e) {
    console.log(e);
    res.send("There was an error creating the exercise, please try again!");
  }
});

// GET request for all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select("_id username");

	if(!users) {
		res.send("No users found");
	} else {
		res.json(users);
	}
});

// log GET request
app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);

  if(!user) {
    res.send("Could not find user");
    return;
  }
  const date_obj = {};
  if(from) {
    date_obj["$gte"] = new Date(from);
  }
  if(to) {
    date_obj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = date_obj;
  }

  const exercises = await Exercise.find(filter).limit(+limit ?? 500);
  const logs = exercises.map((exercise) => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user.id,
    log: logs,
  });

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
