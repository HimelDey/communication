const mongoose = require("mongoose");

const DetailsByIDService= async (id,DataModel) => {
    try{
        let data;

        let DetailsID=id;

        let QueryObject={};
        QueryObject['_id']=DetailsID;

         data = await DataModel.aggregate([
            {$match: QueryObject}
        ]);
        return data;
    }
    catch (error) {
        return {status: "fail", data: error.toString()}
    }
};
module.exports=DetailsByIDService;