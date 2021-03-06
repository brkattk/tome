//----------------------------------------------------------------------------------------------------------------------
// Models for Tome
//
// @module models.js
//----------------------------------------------------------------------------------------------------------------------

var path = require('path');
var jbase = require('jbase');

var config = require('./config');

//----------------------------------------------------------------------------------------------------------------------

var db = { errors: jbase.errors };
var rootPath = path.resolve('./db');

//----------------------------------------------------------------------------------------------------------------------
// Wiki models
//----------------------------------------------------------------------------------------------------------------------

db.Page = jbase.defineModel('pages', {
    url: { type: String, required: true },
    revisionID: String,
    created: { type: String, default: new Date().toString() },
    updated: { type: String, default: new Date().toString() }
}, { rootPath: rootPath });

db.Revision = jbase.defineModel('revisions', {
    pageID: { type: String, required: true },
    url: { type: String, required: true },
    userID: { type: String, required: true },
    created: { type: String, default: new Date().toString() },
    message: { type: String, default: (config.defaultCommit || "minor edit") },
    prevRevID: String,

    // Content
    title: { type: String, default: "" },
    tags: { type: Array, default: [] },
    body: { type: String, default: "" },

    // Special revision types
    moved: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false }
}, { rootPath: rootPath });

db.Comment = jbase.defineModel('comments', {
    pageID: { type: String, required: true },
    userID: { type: String, required: true },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    created: { type: String, default: new Date().toString() },
    updated: { type: String, default: new Date().toString() },
    resolved: { type: Boolean, default: false }
}, { rootPath: rootPath });

//----------------------------------------------------------------------------------------------------------------------
// Site models
//----------------------------------------------------------------------------------------------------------------------

db.User = jbase.defineModel('users', {
    gPlusID: String,
    nickname: String,
    tagline: String,
    email: String,
    displayName: String,
    avatar: String,
    created: { type: String, default: new Date().toString() },
    bio: String
}, { rootPath: rootPath });

//----------------------------------------------------------------------------------------------------------------------

module.exports = db;

//----------------------------------------------------------------------------------------------------------------------