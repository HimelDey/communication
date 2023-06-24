export default {
  /**
   * This method will find the data whose status is 1
   *
   * @param  {Model}  Model Mongoose Model on which you want execute the operation
   * @param  {Object}  match An object of fields you want to match
   * @param  {Object} projection Data you want to project. Keep it empty if you want all data of the document
   * @return {Object} Returns an object.
   */
  findActive: async (Model, match, projection) => {
    let query_match = match ? { ...match, status: 1 } : { status: 1 };
    const query = [{ $match: query_match }];
    projection ? query.push({ $project: { _id: 1, ...projection } }) : "";
    try {
      return await Model.aggregate(query);
    } catch (err) {
      console.error(err);
      return false;
    }
  },
};
