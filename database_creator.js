// load environment variables
require('dotenv').config();

const Sequelize = require('sequelize');

//CLI actions
//dropdb blog-application
//createdb -h localhost -p 5432 -U postgres blog-application

//Create connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, null, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: false
  }
})

//Setting up the structure of the database
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
  post_body: Sequelize.TEXT
});

const Comments = sequelize.define('comments', {
  comment_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
	comment_body: Sequelize.TEXT
});

//Setting relations of the database
Users.hasMany(Posts);
Posts.belongsTo(Users);
Posts.hasMany(Comments);
Comments.belongsTo(Posts);
Comments.belongsTo(Users);

//Create table structure for the database
sequelize.sync({force: true})
