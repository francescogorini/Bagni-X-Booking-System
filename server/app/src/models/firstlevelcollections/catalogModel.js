module.exports = function (mongoose) {

    import {RankUmbrella} from "../othercollections/rankUmbrellaModel";
    import {Umbrella} from "../othercollections/umbrellaModel";
    import {Service} from "../othercollections/serviceModel";

    const Schema = mongoose.Schema;


    const CatalogSchema = new Schema({
        rank_umbrellas: [RankUmbrella], // includes also sales
        umbrellas: [Umbrella],
        services: [Service]
    });
    return mongoose.model('catalogmodel', CatalogSchema, 'catalog');
};


