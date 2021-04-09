const router = require('express').Router();
const {
  getAllThoughts,
  addThought,
  updateThought,
  removeThought,
  addReaction,
  removeReaction
} = require('../../controllers/thought-controller');

router
  .route('/')
  .get(getAllThoughts);

router
  .route('/:thoughtId')
  .post(addThought)
  .put(updateThought)
  .delete(removeThought);

router
  .route('/:thoughtId/reactions')
  .post(addReaction);

router
  .route(':thoughtId/reactions/:reactionId')
  .delete(removeReaction);

module.exports = router;