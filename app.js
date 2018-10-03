//load environment variables
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyparser = require('body-parser');
const bcrypt = require('bcrypt');
const alert = require('alert-node');
const Sequelize = require('sequelize');


//start node express
const app = express();

//initiate a session
app.use(session({
	secret: 'test',
	resave: false,
	saveUninitialized: false
}));

app.use('/static', express.static('static'))

//set view enging to "ejs"
app.set('view engine', 'ejs');

//bodyparser (for POST requests)
let urlencodedParser = bodyparser.urlencoded({ extended: true });

//Create connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, null, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
	operatorsAliases: false,
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

app.post('/login', urlencodedParser, function (request, response) {

	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	let email = request.body.email
	let password = request.body.password

	Users.findOne({
		where: {
			email: email
		}
	})
	.then(function (users) {

		bcrypt.compare(password, users.password).then(function(res) {
			if (users !== null && res == true) {
				request.session.user = users;
				response.redirect('/posts');
			} else {
				response.redirect('/login');
			}
		});

	})
	.catch(function (error) {
		console.error(error)
	})
});

app.get('/login', function(request, response) {
	response.render('login')
})

app.post('/register', urlencodedParser, function(request, response){

	let password = request.body.password;
	let password_check = request.body.password_check;

	if(request.body.user_name === "" || request.body.email === "" || request.body.password === "" || request.body.password_check === ""){
			response.redirect('/register');
			alert('Please fill in every field. Retry!');
	} else if (password.length < 8 ){
			alert('Password needs to have at least 8 characters. Retry!');
			response.redirect('/register')
	} else if(password != password_check ){
			alert ('Passwords do not correspond. Retry!');
			response.redirect('/register')
	} else if(password.length < 8 && password != password_check ){
			alert ('Passwords do not correspond and need to be at least 8 characters. Retry!');
			response.redirect('/register')
	}
	 else {
		Users.findOne({
			where: {
				user_name: request.body.user_name
			}
		})
		.then(result => {
			if (result === null){
				bcrypt.hash(password, 8).then(function(hash) {
						Users.create({
							user_name: request.body.user_name,
							email: request.body.email,
							password: hash
						})
				})
				.then(generated_user => {
						response.redirect('/login')
				})
			} else {
				response.redirect('/already-exists')
			}
		})
	}

})

app.get('/already-exists', function(request, response) {
	response.render('already-exists')
})

app.get('/register', function(request, response){
	response.render('register')
})

app.get('/posts', function(request, response) {

		const user = request.session.user;

		if (user === undefined) {
		response.redirect('/login');
		} else {
	    Posts.findAll({
	    })
	    .then((result_array) => {
				response.render('posts', {data: result_array, user_info: user});
	    })
		}
});

app.get('/:user_name/posts', function(request, response) {
	const user = request.session.user;
	if (user === undefined) {
	response.redirect('/login');
	} else {
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
	      response.render('posts-specific-user', {data: result_by_id, user_info: user});
	    })

	  })
	}
});

app.get('/post/:post_id', function(request, response) {

		const user = request.session.user;
		if (user === undefined) {
		response.redirect('/login');
		} else {

	    Posts.findOne({
	      where: {
	        post_id: request.params.post_id
	      }
	    })
	    .then(function(result) {

				Comments.findAll({
		      where: {
		        postPostId: request.params.post_id
		      }
		    })
				.then(function(comment_info){
					response.render('single-post', {data: result, comments: comment_info});
				})

	    })
	    .catch(function(error) {
	        response.render('single-post', {data: "This post id does not exist. Try another one!"});
	    })

		}
});

app.get('/create-post', function(request, response) {
	const user = request.session.user;
	if (user === undefined) {
	response.redirect('/login');
	} else {
	  response.render('create-post')
	}
})

app.post('/create-post', urlencodedParser, function (request, response) {
		const user = request.session.user;
		if (user === undefined) {
		response.redirect('/login');
		} else {
	  	Posts.create({
	      userUserId: user.user_id,
	  		post_title: request.body.title,
	  		post_body: request.body.body
	  	})
	    .then(generated_post => {
	        response.redirect(`/post/${generated_post.post_id}`)
	    })
		}

});

app.post('/add-comment', urlencodedParser, function (request, response) {

		const user = request.session.user;
		if (user === undefined) {
		response.redirect('/login');
		} else {
	  	Comments.create({
	      userUserId: user.user_id,
				postPostId: request.body.post_id,
	  		comment_body: request.body.body
	  	})
	    .then(generated_comment => {
	        response.redirect(`/post/${generated_comment.postPostId}`)
	    })
		}

});

app.get('/logout', (req,res)=>{
  req.session.destroy((error) => {
		if(error) {
			throw error;
		}
		res.redirect('/login');
	})
})

app.get('/error', function(req, res) {
    res.render('error');
});

app.get('/', function(req, res) {
    res.redirect('/login');
});

app.get('*', function(req, res) {
    res.redirect('/error');
});

//Sync the database
sequelize.sync()

//start listening
app.listen(3000, function(){
  console.log('Server is running on port 3000');
});
