const { Thought, User } = require('../models');

const ThoughtController = {

  getAllThoughts( req, res) {
    Thought.find({})
      .populate({
        path: 'reactions',
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

  addThought({ params, body }, res) {
    Thought.create(body)
      .then(({ _id }) => {
        return User.findOneAndUpdate(
          { username: body.username },
          { $push: { thoughts: _id } },
          { new: true }
        );
      })
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No User found with this username!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .catch(err => res.json(err));
  },

  getThoughtById({ params, body }, res) {
    Thought.findOne({ _id: params.thoughtId })
      .populate({
        path: 'reactions',
        select: '-__v'
      })
      .select('-__v')
      .then(dbThoughtData => {
        // If no User is found, send 404
        if (!dbThoughtData) {
          res.status(404).json({ message: 'No thought found with this id!' });
          return Promise.reject();
        }
        res.json(dbThoughtData);
      })
      .catch(err => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  updateThought({ params, body }, res) {
    let originalUsername = "";

    // get original username
    Thought.findOne({ _id: params.thoughtId })
    .then(dbThoughtData => {
      // If no User is found, send 404
      if (!dbThoughtData) {
        res.status(404).json({ message: 'No thought found with this id!' });
        return Promise.reject();
      }
      originalUsername = dbThoughtData.username;
      return dbThoughtData;
    })
    // check if the new username exist
    .then(() => {
      return User.findOne({username: body.username});
    })
    .then(dbUserData => {
      if (!dbUserData) {
        res.status(404).json({ message: 'No user found with this username!' });
        return Promise.reject();
      }
      return dbUserData;
    })
    // remove thought from original user
    .then(() => {
      return Thought.findOneAndUpdate(
        { _id: params.thoughtId }, 
        body, 
        { new: true, runValidators: true })
    })
    // add thought to new user
    .then(dbThoughtData => {
      if (!dbThoughtData) {
        res.status(404).json({ message: 'No thought found with this id!' });
        return Promise.reject();
      }
      res.json(dbThoughtData);
    })
    .then(() => {
      return User.findOneAndUpdate(
        { username: originalUsername }, 
        { $pull: {thoughts: params.thoughtId}}, 
        { new: true, runValidators: true }
      );
    })
    .then(() => {
      return User.findOneAndUpdate(
        { username: body.username }, 
        { $push: {thoughts: params.thoughtId}}, 
        { new: true, runValidators: true }
      );
    })
    .catch(err => res.status(400).json(err));
  },

  removeThought({ params, body }, res) {
    Thought.findOne({_id: params.thoughtId})
      .then(dbThoughtData => {
        if(!dbThoughtData){
          return res.status(404).json({ message: 'No Thought with this id!' });
        }
        return User.findOneAndUpdate({username: dbThoughtData.username}, {$pull: {thoughts: params.thoughtId}});
      })
      .then(()=>{
        return Thought.findOneAndDelete({ _id: params.thoughtId })
      })
      .then(dbDeletedData => {
        if (!dbDeletedData) {
          res.status(404).json({ message: 'No User found with this id!' });
          return Promise.reject();
        }
        res.json(dbDeletedData);
      })
      .catch(err => res.json(err));
  },

  addReaction({ params, body }, res) {
    Thought.findOneAndUpdate(
      { _id: params.thoughtId },
      { $push: { reactions: body } },
      { new: true, runValidators: true  }
    )
      .then(dbUserData => {
        if (!dbUserData) {
          res.status(404).json({ message: 'No thought found with this id!' });
          return Promise.reject();
        }
        res.json(dbUserData);
      })
      .catch(err => res.json(err));
  },

  removeReaction({ params, body }, res) {
    console.log(params.thoughtId);
    console.log(params.reactionId);
    Thought.findOneAndUpdate(
      { _id: params.thoughtId },
      { $pull: { reactions: { reactionId: params.reactionId } } },
      { new: true }
    )
      .then(dbDeletedData => res.json(dbDeletedData))
      .catch(err => res.json(err));
  }
};

module.exports = ThoughtController;