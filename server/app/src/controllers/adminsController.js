const mongoose = require('mongoose');
const Admin = require("../models/adminModel")(mongoose);
const commonController = require("./commonController");


module.exports.authenticate_admin = function(req, res) {
    findAdmin(req, res, req.body.username, req.body.password,
        (elemFounded) => {

        if (elemFounded.hashedPassword === commonController.sha512(req.body.password, elemFounded.salt))
            commonController.response(res, "Authenticated");
        else
            commonController.serve_plain_404(req, res, "admin");
    }, () =>{

            commonController.serve_plain_404(req, res, "admin");

    });
/*    commonController.findAllFromCollection(req, res, "admin", Admin, "",
        (err, docResult) => {
            let admin = docResult.filter(x => x.username === req.body.username
                             && commonController.sha512(req.body.password, x.salt) === x.hashedPassword);
            if (admin)
                commonController.response(res, "Authenticated");
            else
                commonController.serve_plain_404(req, res, "admin");
        })*/
};

/**
 * Create a admin that isn't root. This admin topology can't create new admin.
 * @param req
 * @param res
 */
module.exports.create_admin = function(req, res) {
    findAdmin(req, res, req.body.username, req.body.password,
        () => {
            commonController.already_present(res, "admin");
        }, () =>{

            // If someone pass root = true
            req.body.root = false

            let admin = new Admin(req.body)
            admin._id = mongoose.Types.ObjectId();
            admin.salt = commonController.genRandomString(commonController.salt_length);
            admin.hashedPassword = commonController.sha512(req.body.password, admin.salt);

            commonController.correctSave(admin, commonController.status_created, res)
        })
};


/**
 * DELETE by id or by username
 * @param req
 * @param res
 */
module.exports.delete_admin = function(req, res) {
    if (req.body.username){
        commonController.deleteFirstLevelCollectionByUsername(req, res, "admins", Admin, "", req.body.username);
    } else if (req.params.id) {
        commonController.deleteFirstLevelCollection(req, res, "admins", Admin, "", req.params.id);
    }
};


/**
 * Change password
 * @param req
 * @param res
 */
module.exports.change_password = function(req, res) {

    findAdmin(req, res, req.body.username, req.body.password,
        (elemFounded) => {

            elemFounded.hashedPassword = commonController.sha512(req.body.password, elemFounded.salt)

            commonController.correctSave(elemFounded, commonController.status_created, res)

        }, () =>{

            commonController.serve_plain_404(req, res, "admin")

        })
};

/**
 * Find an admin by his username.
 * @param req
 * @param res
 * @param username
 * @param password
 * @param funcFounded
 * @param funcNotFounded
 */
function findAdmin(req, res, username, password, funcFounded, funcNotFounded) {
    commonController.areRequiredFieldsPresent(req, res, () =>{


        if ((username && password)
            && commonController.typeOfString(username)
            && commonController.typeOfString(password)) {


            Admin.find({"username": username}, (err, docs) => {

                if (docs.length !== 0){

                    funcFounded(docs[0]);
                } else {

                    funcNotFounded();
                }
            });
        }

    }, req.body.username, req.body.password)
}