const mongoose = require('mongoose');
const crypto = require('crypto')

const Booking = require('../models/bookingModel')(mongoose);
const Catalog = require('../models/catalogModel')(mongoose);
const Customer = require('../models/customerModel')(mongoose);
const Umbrella = require('../models/nestedSchemas/umbrellaModel')(mongoose);
const Bathhouse = require("../models/bathhouseModel")(mongoose);

const CatalogID = "5f40f4125c935b69a7f0626f";
const BathhouseID = "5f41345d9ca3ce59d9777862";



/**
 * Error for object not found.
 * @param req
 * @param res
 * @param objName
 */
module.exports.servePlain404 = function(req, res, objName) {
    this.notify(res, this.statusError, objName + " not found!")
};

/**
 * When create can't go good finish because obj already present.
 * @param res
 * @param document
 */
module.exports.alreadyPresent = function(res, document) {
    this.notify(res, this.badRequest, document + " already present!")
}

/**
 * Error caused because not all required fields are inserted.
 * @param res
 */
module.exports.fieldRequire404 = function(res) {
    this.notify(res,this.statusError,"Some required fields aren't found!")
};

/**
 * Error caused because not authorized to an access.
 * @param res
 */
module.exports.unauthorized401 = function(res) {
    this.notify(res,this.statusUnauthorized,"Access negated!")
};


/**
 * Error caused because some parameters are bad formatted.
 * @param res
 */
module.exports.parameterBadFormatted = function(res){
    this.notify(res, this.badRequest, "Malformed request.")
}

/**
 * General structure for response to sell.
 * @param res The response.
 * @param status The response of status.
 * @param jsonObject The string or json object to send.
 */
module.exports.notify = function(res, status, jsonObject){
    res.status(status).json(jsonObject);
}

/**
 * Used for save new document or updated one.
 * @param document The document to save
 * @param status The status that have to be sent in response
 * @param res The response with status and document
 * @param docToReturn
 */
module.exports.correctSave = function (document, status, res, docToReturn = undefined) {
    document.save((saveErr, updatedDocument) => {
        if (saveErr) {
            res.send(saveErr);
        }

        if (updatedDocument.hash) {
            updatedDocument.hash = "";
        }

        if (docToReturn)
            updatedDocument = docToReturn

        this.notify(res, status, updatedDocument);
    });
}

/**
 * Used as nested find by id.
 * @param obj Possible object with the specified targetId.
 * @param targetId The Id that object have to do.
 * @returns {null|*} obj if Id is correct, null otherwise.
 */
module.exports.dfs = function (obj, targetId) {
    if (obj.id === targetId) {
        return obj
    }
    return null
}

/**
 * Check if exist error in the operation to do. Error could be in two scenario:
 *  . document don't exist in a collection
 *  . document is null
 * @param err The possible error
 * @param documents The documents searched
 * @param req
 * @param res
 * @param documentName Used for response in error case
 * @param deleteOperation Indicate if is a delete operation. Used because if is applied a DELETE document can't be
 *                        returned because don't exist yet.
 */
module.exports.checkError = function (err, documents, req, res, documentName, deleteOperation = false) {

    let errSave = false;

    if (err) {
        errSave = true;
        res.send(err);
    }
    else {
        if (!deleteOperation && !documents) {
            errSave = true;
            this.servePlain404(req, res, documentName);
        }
    }

    return errSave;
}

/**
 * Positive response to an operation
 * @param res The response given with status created and documents used
 * @param jsonResponse The documents used
 */
module.exports.response = function (res, jsonResponse) {
    res.status(this.statusCompleted).json(jsonResponse);
}

/**
 * GET all documents requested
 * @param err Possible error
 * @param collectionToSearch Collection where could be present
 * @param req
 * @param res
 * @param documentName Name of document, used in error case
 * @param documentsToReturn
 */
module.exports.getDocuments = function (err, collectionToSearch, req, res, documentName, documentsToReturn) {
    if (!this.checkError(err, collectionToSearch, req, res, documentName))
        this.response(res, documentsToReturn);
}

/**
 * Used to do GET for nested documents. It's return the elements that query wants.
 * This function have different scenario:
 *  . if "id" is present return the specific document.
 *  . if "id" isn't present return error.
 * @param collectionToSearch The nested collection where query do the search.
 * @param req The GET request.
 * @param res The GET response.
 * @param id The id to search.
 * @param err The error is used if document isn't present.
 * @param documentName The name of document used if doc is not present.
 * @param returnError If the method have to return error or not
 */
module.exports.returnNestedDocument = function (collectionToSearch, req, res, id, err, documentName, returnError=true) {
    this.getNestedDocument(collectionToSearch, req, res, id, (documentTarget) =>  {
        this.getDocuments(err, collectionToSearch, req, res, documentName, documentTarget);
    }, returnError);
}

/**
 * Find an element in a nested collection.
 * @param collectionToSearch The collection (also nested) that documents belongs
 * @param req The specific update request
 * @param res The specific update response
 * @param id The id to search
 * @param func The callback function that is executed only if id is found.
 * @param returnError
 */
module.exports.getNestedDocument = function(collectionToSearch, req, res, id, func, returnError=true) {

    if (id) {
        let documentTarget = null;

        // Check if blocks infinite time
        let foundElement = false;

        for (let document of collectionToSearch) {
            documentTarget = this.dfs(document, id);
            if (documentTarget) {
                foundElement = true;
                break;
            }
        }

        if (foundElement)
            func(documentTarget);
        else if (returnError)// So we can handle also more than two nested level collection. See sale read or put.
            return this.servePlain404(req, res, "Elem");
    } else if (returnError)
        this.servePlain404(req, res, "Id in url");

}

/**
 * Find by id for first level class that tracks scenario of error.
 * @param req
 * @param res
 * @param documentName Name used only in case of error
 * @param collFirstLevel Collection where is searched the id
 * @param errDocName Document name used only in case of error.
 * @param id Id to search
 * @param func Callback applied if find is correctly done
 */
module.exports.findByIdFirstLevelCollection = function (req, res, documentName, collFirstLevel, errDocName, id, func) {

    let errorDocumentName = documentName
    if (errDocName)
        errorDocumentName = errDocName

    collFirstLevel.findById(mongoose.Types.ObjectId(id), (err, docResult, docResultName) => {
        if (!this.checkError(err, docResult, req, res, errorDocumentName))
            func(err, docResult, docResultName);
    });
}

/**
 * Delete by id for first level class that tracks scenario of error.
 * @param req
 * @param res
 * @param documentName Name used only in case of error.
 * @param collFirstLevel Collection where is searched the id.
 * @param errDocName Document name used only in case of error.
 */
module.exports.deleteFirstLevelCollectionById = function (req, res, documentName, collFirstLevel, errDocName) {

    collFirstLevel.deleteOne({ "_id": req.params.id }, (err, docResult)  => {

        if (!errDocName)
            errDocName = documentName;


        if (!this.checkError(err, docResult, req, res, errDocName, true))
            this.response(res, "Delete on " + documentName + " completed!");
    });
}

/**
 * Used for update faster.
 * @param document
 * @param req
 * @param specificParamUpdate
 * @param parametersName
 */
module.exports.checkAndActForUpdate = async function(document, req, specificParamUpdate, ...parametersName){

    if (specificParamUpdate)
        await specificParamUpdate()

    for (const param of parametersName){
        document[param] = req.body[param]
    }

}

/**
 * Delete by id for first level class that tracks scenario of error.
 * @param req
 * @param res
 * @param documentName Name used only in case of error.
 * @param collFirstLevel Collection where is searched the id.
 * @param errDocName Document name used only in case of error.
 */
module.exports.deleteFirstLevelCollectionByUsername = function (req, res, documentName, collFirstLevel,
                                                                errDocName) {

    /*    this.deleteFirstLevelCollectionByProperty(req, res, documentName, collFirstLevel, errDocName,
            "username", req.body.username);*/

    collFirstLevel.deleteOne({ "username": req.body.username }, (err, docResult)  => {


        if (!errDocName)
            errDocName = documentName + "not found";


        if (!this.checkError(err, docResult, req, res, errDocName, true))
            this.response(res, "Delete on " + documentName + " completed!");
    });
}

/**
 * DELETE by a property for first level class that tracks scenario of error.
 * @param req
 * @param res
 * @param documentName Name used only in case of error.
 * @param collFirstLevel Collection where is searched the id.
 * @param errDocName Document name used only in case of error.
 * @param propertyName
 * @param propertyValue
 */
/*module.exports.deleteFirstLevelCollectionByProperty = function(req, res, documentName, collFirstLevel, errDocName,
                                                                propertyName, propertyValue) {
    collFirstLevel.deleteOne({ propertyName: propertyValue }, (err, docResult)  => {
        console.log(propertyName);
        console.log(propertyValue);
        if (!errDocName)
            errDocName = documentName + " not found";
        this.checkError(err, docResult, req, res, errDocName, true);
        this.response(res, "Delete on " + documentName + " completed!");
    });
}*/

/**
 * Find all for a collection with control that this isn't empty.
 * @param req
 * @param res
 * @param documentName Name used only in case of error.
 * @param collFirstLevel Collection where is searched elements.
 * @param errDocName Document name used only in case of error.
 * @param func Function applied if findAll correctly applied.
 */
module.exports.findAllFromCollection = function (req, res, documentName, collFirstLevel, errDocName, func) {
    collFirstLevel.find({}, (err, docResult) => {

        if (!errDocName){
            errDocName = documentName + " not found";
        }

        if (!this.checkError(err, docResult, req, res, errDocName))
            func(err, docResult, documentName);
    });
}

/**
 * Return the specified elements.
 * @param id Where first element start.
 * @param size Number of maximum elements.
 * @param req The specific request.
 * @param res The specific response.
 * @param arrayToSearch The class where elements are taken.
 * @param collectionName The class name.
 */
module.exports.returnPages = function (id, size, req, res, arrayToSearch, collectionName) {

    let pageId = this.defaultPageId;
    if (id && this.typeOfNumber(id)) {
        pageId = id;
    }

    let pageSize = this.defaultPageSize;
    if (size && this.typeOfNumber(size)) {
        pageSize = size;
    }

    let pages = arrayToSearch;
    // Return error if there aren't any collection present with that id

    if (pageId >= pages.length) {

        this.servePlain404(req, res, collectionName);

    } else {

        // Get the resultant pages
        if (pageId + pageSize >= pages.length ) {
            pageSize = pages.length - pageId +1;
        }

        this.response(res, pages.slice(pageId, pageSize));
    }

}

/**
 * Control if fields required are present. It's used in POST because user can't create document
 * without required fields.
 * @param req
 * @param res
 * @param func Function applied if findAll correctly applied.
 * @param fieldsRequired The fields that are requested because not optional.
 */
module.exports.areRequiredFieldsPresent = function (req, res, func, ...fieldsRequired) {

    let toSave = true;
    for (let field in fieldsRequired){
        if (fieldsRequired[field] === undefined) {
            toSave = false;
        }
    }
    if (toSave) {
        func();
    } else {
        this.fieldRequire404(res)
    }
}

module.exports.typeOfString = function (par) {

    return typeOfType(par,"string")
}

module.exports.typeOfBoolean = function (par) {

    return typeOfType(par, "boolean")
}

module.exports.typeOfNumber = function (par) {

    return (typeOfType(par, "number") && (par>=0))
}

function typeOfType(par, parType) {

    let isCorrectType = false;
    if (typeof par === parType)
        isCorrectType = true;

    return isCorrectType;
}

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random string.
 */
module.exports.genRandomString = function(length){

    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0,length);   /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
module.exports.sha512 = function(password, salt){
    let hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    return hash.digest('hex');

};


/**
 * Check if password have almost the requested length.
 * @param password
 */
module.exports.checkPassword = function(password) {

/*    if (/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}\[\]:;<>,.?\/~_+-=|]).{8,32}$/.test(password)){
        func()
    } else {
        this.notify(res, this.badRequest, "Password not correct");
    }*/
    return /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}\[\]:;<>,.?\/~_+-=|]).{8,32}$/.test(password)
}

/**
 * Check if email is a valid regex.
 * @param email
 * @returns {boolean}
 */
module.exports.checkEmail = function(email){

    return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);

}

/**
 * Check for phone number.
 * @param phoneNumber
 * @returns {boolean}
 */
module.exports.checkPhone = function(phoneNumber) {

    return /^((\+)[0-9]{2}(-)?)?[0-9]{6,11}$/.test(phoneNumber)
}

/**
 * Umbrella number of booked umbrellas.
 * @param req
 * @param res
 * @param to
 * @param from
 * @param func
 * @returns {*[]}
 */
module.exports.umbrellaUsed = function (req, res, to, from, func){

    this.findAllFromCollection(req, res, "book", Booking, ""
        ,(errBook, allBookings) => {
            // Umbrella not free in that periods
            // First filter: if book is not finished
            // Second filter: if bool started in that period

            let allBookingsFiltered = allBookings.filter(b => new Date(to).getTime() >= b.dateFrom.getTime()
                && new Date(from).getTime() <= b.dateTo.getTime()
                && !b.cancelled);

            let allBookingsUmbrellaMapped = allBookingsFiltered.flatMap(b => b.umbrellas.map(u => u.number));

            func(allBookingsUmbrellaMapped);
        });
}

/**
 * Umbrella number of free umbrellas.
 * @param req
 * @param res
 * @param to
 * @param from
 * @param umbrellas
 * @param func
 * @returns {*[]}
 */
module.exports.umbrellaFree = function (req, res, to, from, umbrellas, func){

    this.findByIdFirstLevelCollection(req, res, "catalog", Catalog, "Catalog",
        CatalogID, (err, catalog)=>{

            this.umbrellaUsed(req, res, to, from, (umbrellasNumberUsed)=>{

                let umbrellaNumberFree = [];
                for (const rank of catalog.rankUmbrellas) {

                    for (let umbrellaNumber = rank.fromUmbrella; umbrellaNumber <= rank.toUmbrella; umbrellaNumber++) {

                        if (!umbrellasNumberUsed.includes(umbrellaNumber)) {
                            umbrellaNumberFree.splice(0, 0, umbrellaNumber);
                        }
                    }
                }


                func(umbrellas.every(u => umbrellaNumberFree.includes(u)));
            });

        });

}

/**
 * Create umbrellas from numbers.
 * @param req
 * @param res
 * @param umbrellasNumber
 * @param func
 * @returns {[]}
 */
module.exports.createUmbrellas = function(req, res, umbrellasNumber, func){

    this.findByIdFirstLevelCollection(req, res, "catalog", Catalog, "Catalog",
        CatalogID, (err, catalog)=> {

            let umbrellas = [];


            for (const umbrellaNumber of umbrellasNumber) {

                let umbrella = new Umbrella();

                umbrella.number = umbrellaNumber;

                for (const rank of catalog.rankUmbrellas) {

                    if ((umbrella.number <= rank.toUmbrella)
                        && (umbrella.number >= rank.fromUmbrella)) {

                        umbrella.rank = rank;
                        umbrellas.splice(0,0,umbrella);
                        break;
                    }
                }

            }

            func(umbrellas);

        });


}

/**
 * Return if services are all corrects
 * @param req
 * @param res
 * @param services
 * @param func
 */
module.exports.servicesAvailable = function (req, res, services, func){


    this.findByIdFirstLevelCollection(req, res, "Catalog", Catalog, "",
        CatalogID,  (err, catalog)=>{

        const catalogServices = catalog.services.map(x => x._id);
        func(services.every(s => catalogServices.includes(s._id)));
    });
}

/**
 * Return if services are all corrects
 * @param req
 * @param res
 * @param services
 * @param func
 */
module.exports.servicesAvailable = function (req, res, services, func){

    this.findByIdFirstLevelCollection(req, res, "Catalog", Catalog, "",
        CatalogID,  (err, catalog)=>{

            const catalogServices = catalog.services.map(x => x._id);
            func(services.every(s => catalogServices.includes(s._id)));
    });
}

/**
 * Return a complete service
 * @param req
 * @param res
 * @param services
 * @param func
 */
module.exports.constructServices = function(req, res, services, func) {

    this.findByIdFirstLevelCollection(req, res, "Catalog", Catalog, "",
        CatalogID, async (err, catalog)=>{

        let servicesComplete = []

        for (const service of services) {
            for (const serviceCatalog of catalog.services) {

                let serviceFound = this.dfs(serviceCatalog, service._id)

                if (serviceFound) {

                    if (!service.hasOwnProperty("price"))
                        service.price = serviceFound.price

                    if (!service.hasOwnProperty("umbrellaRelated"))
                        service.umbrellaRelated = serviceFound.umbrellaRelated

                    if (!service.hasOwnProperty("description"))
                        service.description = serviceFound.description

                    servicesComplete.splice(0,0,service)
                }
            }
        }

        func(servicesComplete)
    });
}

/**
 * Check if user exist.
 * @param req
 * @param res
 * @param userId
 * @param func
 */
module.exports.customerExist = function (req, res, userId, func){

    this.findByIdFirstLevelCollection(req, res, "Customer", Customer, "Customer",
        userId, (err, customer)=>{

            func(customer);

        });

}


/**
 * DELETE a nested Elements
 * @param req
 * @param res:
 *          . 200 if element is erased correctly
 *          . 400 if not id.
 * @param id
 * @param collectionFirstLevel
 * @param collectionToRemoveElement
 */
/*module.exports.deleteNested = function (req, res, id, collectionFirstLevel, collectionToRemoveElement) {

    if (id){

        collectionToRemoveElement = collectionToRemoveElement.filter(elem => !elem._id.equals(mongoose.Types.ObjectId(id)))
        this.correctSave(collectionFirstLevel, this.statusCompleted, res);
    } else
        this.parameterBadFormatted(res)
}*/

/**
 * This method find bathhouse.
 * @param req
 * @param res
 * @param func
 */
module.exports.findBathhouse = function(req, res, func) {
    this.findByIdFirstLevelCollection(req, res, "bathhouse", Bathhouse,
        "bathhouse", BathhouseID, (errBath, bathhouse)=>

            func(errBath, bathhouse)
    );
}

/**
 * A function that automatize control of id.
 * @param req The specific request
 * @param res The specific response
 * @param func The callback executed only if document exist and is found.
 */
module.exports.findCatalog = function(req, res, func) {

    this.findByIdFirstLevelCollection(req, res, "Catalog", Catalog, "Catalog",
        CatalogID, func);
}

/**
 * A specific nested DELETE in Catalog
 * @param req
 * @param res
 * @param id
 * @param func
 */
module.exports.deleteInCatalog = function(req, res, id, func){

    this.findCatalog(req, res,  (err, catalog)=>{

        if (id){

            func(catalog)
            catalog.save()

            this.response(res, this.deleteOperationCompleted)
        } else
            this.parameterBadFormatted(res)
    })
}

module.exports.deleteOperationCompleted = "Delete operation completed"

module.exports.statusCreated = 201;

module.exports.statusCompleted = 200;

module.exports.statusError = 404;

module.exports.defaultPageId = 0;

module.exports.defaultPageSize = 10;

module.exports.saltLength = 48;

module.exports.statusUnauthorized = 401;

module.exports.badRequest = 400;

module.exports.passwordLength = 8;