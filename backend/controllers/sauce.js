const Sauce = require('../models/sauce');
const fs = require('fs');

// create Regex for all fields for more security
const userRegExp = new RegExp(/^([a-zA-Zàâäéè-êëïîôöùûüç0-9(),.-_ ])+$/);
const nameRegExp = new RegExp(/^([a-zA-Zàâäéè-êëïîôöùûüç0-9(),.'\-_ ])+$/);
const manufacturerRegExp = new RegExp(/^([a-zA-Zàâäéè-êëïîôöùûüç0-9(),.'\-_ ])+$/);
const descriptionRegExp = new RegExp(/^([a-zA-Zàâäéè-êëïîôöùûüç0-9(),.'!?\-_ ])+$/);
const pepperRegExp = new RegExp(/^([a-zA-Zàâäéè-êëïîôöùûüç0-9()'\-_ ])+$/);


exports.createSauce = (req, res, next) => {

    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id
    delete sauceObject.userId

    namefield = nameRegExp.test(sauceObject.name)
    manufacturerfield = manufacturerRegExp.test(sauceObject.manufacturer)
    descriptionfield = descriptionRegExp.test(sauceObject.description)
    pepperfield = pepperRegExp.test(sauceObject.pepper)
    heatfield = (typeof sauceObject.heat == 'number')

    if (namefield == true && manufacturerfield == true && descriptionfield == true && pepperfield == true && heatfield == true){

        const sauce = new Sauce({
            ...sauceObject,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
            userId: req.auth.userId
        });
        sauce.save()
            .then(() => { res.status(201).json({message: 'Sauce ajouté !'})})
            .catch(error => { res.status(400).json( { error })})
    } else {
        res.status(404).json({ message:"L'un des champs n'est pas valide" });
    };
}

exports.modifySauce = (req, res, next) => {

    const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete sauceObject.userId;

    namefield = nameRegExp.test(sauceObject.name);
    manufacturerfield = manufacturerRegExp.test(sauceObject.manufacturer);
    descriptionfield = descriptionRegExp.test(sauceObject.description);
    pepperfield = pepperRegExp.test(sauceObject.pepper);
    heatfield = (typeof sauceObject.heat == 'number');

    console.log(namefield)
    console.log(manufacturerfield)
    console.log(descriptionfield)
    console.log(pepperfield)

    if (namefield == true && manufacturerfield == true && descriptionfield == true && pepperfield == true && heatfield == true){

            Sauce.findOne({ _id: req.params.id})

            .then((sauce) => {
                if (sauce.userId != req.auth.userId) {
                    res.status(401).json({ message : "Unauthorized"});
                } else {
                    Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
    
                    .then(() => {res.status(200).json({message: "Sauce modifié!"})})
                    .catch(error => {res.status(400).json({ error })});
                }
            })
            .catch((error) => {
                res.status(404).json({ error });
            });
    } else {
        res.status(404).json({ message:"L'un des champs n'est pas valide" });
    };
}
    


// v"rifier si j'ai bien été retourné une sauce

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {

            if (sauce.userId !== req.auth.userId){
                res.status(401).json({message: 'Non-autorisé'});
            } else {
                const filename = sauce.imageUrl.split('/images/')[1]
                fs.unlink(`/images/${filename}`, () => {
                    Sauce.deleteOne({_id: req.params.id})
                    .then(() => { res.status(200).json({message: "Objet supprimé !"})})
                    .catch(error => res.status(401).json({ message : "Non-authorisé 2" }));
                })
            }
        })
        .catch(error => res.status(500).json({ error }));
    }


    
exports.getAllSauces = (req, res, next) => {
    Sauce.find()
        .then(sauces => res.status(200).json(sauces))
        .catch(error => res.status(400).json({ error }));
    }
    


exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({ error }));
    }    



exports.likeSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            
            let indexId = sauce.usersLiked.indexOf(req.auth.userId)
            let index2Id = sauce.usersDisliked.indexOf(req.auth.userId)

            if (sauce.usersLiked.includes(req.auth.userId)) {
                if (req.body.like == 1){
                    res.status(409).json({message: "Vous aviez déjà liké dans le passé et vous essayé de liker une nouvelle fois"})
                }
                else if (req.body.like == 0){
                    sauce.likes--
                    sauce.usersLiked.splice(indexId, 1)
                    res.status(201).json({message: "Vous avez bien retirer votre like"})
                }
                else if (req.body.like == -1){
                    sauce.dislikes++
                    sauce.likes--
                    sauce.usersLiked.splice(indexId, 1)
                    sauce.usersDisliked.push(req.auth.userId)
                    res.status(201).json({message: "Vous avez bien disliké alors que étiez de ceux qui ont liké"})
                }
            } else if (index2Id == -1 && indexId == -1) {
                if (req.body.like == 1){
                    sauce.likes++
                    sauce.usersLiked.push(req.auth.userId)
                    res.status(201).json({message: "Vous avez bien liké alors que vous étiez neutre"})
                }
                else if (req.body.like == 0){
                    res.status(409).json({message: "Vous aviez déjà fait aucun like/dislike"})
                }
                else if (req.body.like == -1){
                    sauce.dislikes++
                    sauce.usersDisliked.push(req.auth.userId)
                    res.status(201).json({message: "Vous avez bien disliké alors que vous étiez neutre"})
                }
            } else if (sauce.usersDisliked.includes(req.auth.userId)) {
                if (req.body.like == 1){
                    sauce.likes++
                    sauce.dislikes--
                    sauce.usersLiked.push(req.auth.userId)
                    sauce.usersDisliked.splice(index2Id, 1)
                    res.status(201).json({message: "Vous avez bien liké alors que vous aviez disliké"})
                }
                else if (req.body.like == 0){
                    sauce.dislikes--
                    sauce.usersDisliked.splice(index2Id, 1)
                    res.status(201).json({message: "Vous avez bien retirer votre dislike"})
                }
                else if (req.body.like == -1){
                    res.status(409).json({message: "Vous aviez déjà disliké dans le passé"})
                }
            }
            sauce.save()
        })
        .catch(error => res.status(404).json({ error }));
    }



