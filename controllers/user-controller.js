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
    let originalUsername = "";

    // Obtain original username by id
    User.findOne({_id: params.id})
      .then(dbUserData => {
        originalUsername = dbUserData.username;
      })
      .then(() => {
        return User.findOneAndUpdate(
          { _id: params.id }, 
          body, 
          { new: true, runValidators: true })
        })
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No user found with this id!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .then(() => {
        return User.findOne({_id: params.id})
        .then(dbUserData => {
          dbUserData.thoughts.forEach(thoughtId => {
            Thought.findOneAndUpdate({_id: thoughtId},{username: body.username})
            .then(dbThoughtData => {
              if(!dbThoughtData){
                res.status(404).json({ message: 'No user found with this id!' });
                return Promise.reject();
              }
            })
          });
        })
      })
      .then(() => {
        return Thought.find({})
        .then(dbThoughtData => {
          dbThoughtData.forEach(thought => {
            thought.reactions.filter(reaction => reaction.username === originalUsername).forEach(reaction => {
              Thought.findOneAndUpdate(
                { _id: thought._id },
                { $pull: { reactions: { reactionId: reaction.reactionId } } },
                { new: true }
              )
              .then(() => {
                return Thought.findOneAndUpdate(
                  { _id: thought._id },
                  { $push: { reactions: { reactionBody: reaction.reactionBody, username: body.username } } },
                  { new: true }
                )
                .then();
              })
              .catch(err => res.json(err));
            })
          })
        })
      })
      .catch(err => res.status(400).json(err));
  },

  // delete User
  deleteUser({ params }, res) {
    let originalUsername = "";
    User.findOne({ _id: params.id })
    .then(dbUserData => {
      // delete associated thoughts
      originalUsername = dbUserData.username;
      dbUserData.thoughts.forEach(thoughtId => {
        Thought.findOneAndDelete({ _id: thoughtId })
        .catch(err => res.status(400).json(err));;
      })
    })
    .then(() => {
      return Thought.find({})
      .then(dbThoughtData => {
        dbThoughtData.forEach(thought => {
          thought.reactions.filter(reaction => reaction.username === originalUsername).forEach(reaction => {
            Thought.findOneAndUpdate(
              { _id: thought._id },
              { $pull: { reactions: { reactionId: reaction.reactionId } } },
              { new: true }
            )
            .then()
            .catch(err => res.json(err));
          })
        })
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