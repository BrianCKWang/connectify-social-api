const { User, Thought } = require('../models');
const { db } = require('../models/User');

const UserController = {
  // get all Users
  getAllUser(req, res) {
    User.find({})
      .populate({
        path: 'friends',
        select: '-__v'
      })
      .populate({
        path: 'thoughts',
        select: '-__v'
      })
      .select('-__v')
      .sort({ _id: -1 })
      .then(dbUserData => res.json(dbUserData))
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  // get one User by id
  getUserById({ params }, res) {
    User.findOne({ _id: params.id })
      .populate({
        path: 'friends',
        select: '-__v'
      })
      .select('-__v')
      .then(dbUserData => {
        // If no User is found, send 404
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id!' });
          return;
        }
        res.json(dbUserData);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  // createUser
  createUser({ body }, res) {
    User.create(body)
      .then(dbUserData => res.json(dbUserData))
      .catch(err =>  res.status(400).json(err));
  },

  // update User by id
  updateUser({ params, body }, res) {
    User.findOneAndUpdate(
      { _id: params.id }, 
      body, 
      { new: true, runValidators: true })
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .catch(err => res.status(400).json(err));
  },

  // delete User
  deleteUser({ params }, res) {
    User.findOne({ _id: params.id })
    .then(dbUserData => {
      // delete associated thoughts
      dbUserData.thoughts.forEach(thoughtId => {
        Thought.findOneAndDelete({ _id: thoughtId })
        .catch(err => res.status(400).json(err));;
      })
    })
    .then(() => {
      return User.findOne({ _id: params.id });
    })
    .then(dbUserData =>{
      // delete the user from all friend list
      dbUserData.friends.forEach(friendId => {
        User.findOneAndUpdate(
          { _id: friendId },
          { $pull: { friends: params.id }}, 
          { new: true }
        )
        .catch(err => res.status(400).json(err));;
      })
      
    })
    .then(() => {
      return User.findOneAndDelete({ _id: params.id });
    })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this id!' });
        return Promise.reject();
      }
      res.json(dbUserData);
    })
    .catch(err => res.status(400).json(err));
  },

  addUserFriend({ params }, res) {
    User.findOne({ _id: params.friendId })
    .then(dbUserData => {
      // If no User is found, send 404
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this friend id!' });
        return Promise.reject();
      }
      // If friend id is same as user id, send 400
      if(params.id === params.friendId){
        res.status(400).json({ message: 'Identical User ID and friend ID!' });
        return Promise.reject();
      }
      return dbUserData;
    })
    .then(() =>{
      return User.findOneAndUpdate(
        { _id: params.id },
        { $addToSet: { friends: params.friendId } },
        { new: true, runValidators: true  }
      )
    })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this id!' });
        return Promise.reject();
      }
      res.json(dbUserData);
    })
    .then(() =>{
      return User.findOneAndUpdate(
        { _id: params.friendId },
        { $addToSet: { friends: params.id } },
        { new: true, runValidators: true  }
      )
    })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this id!' });
        return Promise.reject();
      }
      res.json(dbUserData);
    })
    .catch(err => res.status(400).json(err));
  },

  deleteUserFriend({ params }, res) {
    User.findOneAndUpdate(
      { _id: params.id },
      { $pull: { friends: params.friendId } },
      { new: true}
    )
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .then(() => {
        return User.findOneAndUpdate(
          { _id: params.friendId },
          { $pull: { friends: params.id } },
          { new: true}
        );
      })
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .catch(err => res.json(err));
  }
};

module.exports = UserController;