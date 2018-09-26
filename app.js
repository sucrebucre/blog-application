//load environment variables
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyparser = require('body-parser');
const Sequelize = require('sequelize');

//start node express
const app = express();

//initiate a session
app.use(session({
	secret: 'test',
	resave: false,
	saveUninitialized: false
}));

//set view enging to "ejs"
app.set('view engine', 'ejs');

//bodyparser (for POST requests)
let urlencodedParser = bodyparser.urlencoded({ extended: true });

//Create connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, null, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: false
  }
})

const Users = sequelize.define('users', {
  user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
	user_name: Sequelize.STRING,
  email: Sequelize.STRING,
  password: Sequelize.STRING
});

const Posts = sequelize.define('posts', {
  post_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
	post_title: Sequelize.STRING,
  post_body: Sequelize.STRING
});

const Comments = sequelize.define('comments', {
  comment_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
	comment_body: Sequelize.STRING
});

Users.hasMany(Posts);
Posts.belongsTo(Users);
Posts.hasMany(Comments);
Comments.belongsTo(Posts);
Comments.belongsTo(Users);

app.get('/posts', function(request, response) {

    //console.log(request.session)

    Posts.findAll({
    })
    .then(function(result) {
        array = [];
        for(i=0;i<result.length;i++){
          array.push(result[i].dataValues.post_body);
        }
        return array;
    })
    .then((result_array) => {

			//initiate the session and console.log it 
      request.session.user = result_array;
      console.log(request.session.user);

			response.render('posts', {data: result_array});
    })
});

app.get('/:user_name/posts', function(request, response) {
  Users.findOne({
    where: {
      user_name: request.params.user_name
    }
  })
  .then(function(result) {
    return result.dataValues.user_id;
  })
  .then(function(user_id) {

    Posts.findAll({
    	where: {
    		userUserId: user_id
    	}
    })
    .then(function(result_by_id) {

        array = [];

        for(i=0;i<result_by_id.length;i++){
          array.push(result_by_id[i].dataValues.post_body);
        }

        return array;
    })
    .then((result_array) => {
      response.render('posts', {data: result_array});
    })
  })
});

app.get('/post/:post_id', function(request, response) {
    console.log(request.session.user);

    Posts.findOne({
      where: {
        post_id: request.params.post_id
      }
    })
    .then(function(result) {
        response.render('single-post', {data: result.dataValues.post_body});
    })
    .catch(function(error) {
        response.render('single-post', {data: "This post id does not exist. Try another one!"});
    })
});

app.get('/create-post', function(request, response) {
  response.render('create-post')
})

app.post('/create-post', urlencodedParser, function (request, response) {

  	Posts.create({
      userUserId: 1,
  		post_title: request.body.title,
  		post_body: request.body.body
  	})
    .then(generated_post => {
        response.redirect(`/post/${generated_post.post_id}`)
    })

});

app.post('/add-comment', urlencodedParser, function (request, response) {
    console.log(request.body);
});

//Sync the database
sequelize.sync()

//start listening
app.listen(3000, function(){
  console.log('Server is running on port 3000');
});
