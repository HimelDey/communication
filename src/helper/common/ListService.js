const ListService = async (Request, DataModel, match, projection) => {
  try {
    let data;
    data = await DataModel.aggregate([match, projection]);
    console.log('data',data)

    return data;
  } catch (error) {
    return false
  }
};
export default ListService;
