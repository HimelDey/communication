
import Zone from "../../models/Zone/Zone.js";



const GetCuisineDetails= async (zone_id,cuisine_id) => {

    try{
        let get_data;
        get_data = await Zone.aggregate([
            {
                $match: {
                    lat_long: {
                        $geoIntersects: {
                            $geometry: {
                                type: "Point",
                                coordinates: [long, lat],
                            },
                        },
                    },
                },
            },

            {
                $lookup: {
                    from: "restaurents",
                    localField: "_id",
                    foreignField: "zone_id",
                    pipeline: [
                        { $match: {
                            cuisines: {
                                cuisine_id:cuisine_id
                            }
                        } },
                        {
                            $lookup: {
                                from: "cuisines",
                                localField: "cuisines.cuisine_id",
                                foreignField: "_id",
                                pipeline: [
                                    { $match: { _id: cuisine_id } },
                                    ],
                                as: "cuisines",
                            },
                        },
                       // {$project: {cuisines:0}},

                    ],
                    as: "restaurants",
                },
            },


            { $project: { _id: 1, area_name: 1, restaurants: "$restaurants" } },
            //{$addFields:{cuisine_name:'$restaurants.cuisines.name'}}
        ]);
        return get_data;
    }
    catch (error) {
        return {status: "fail", data: error.toString()}
    }
};
export default GetCuisineDetails;