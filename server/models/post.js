const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: {
        type: String,
        require: true,
        trim: true,
        maxLength: 15
    },
    text: {
        type: String,
        require: true,
        trime: true,
        maxLength: 100
    },
    imageName: {
        type: String,
        require: true
    },
    date: {
        type: Number,
        require: true
    }
}, {timeStamps: true});

const Post = mongoose.model('Post', postSchema);

module.exports = {Post};