const ListOneJoinService = async (match, DataModel, JoinStage, projection) => {
  try {
    let data;
    data = await DataModel.aggregate([match, JoinStage, projection]);

    console.log("data", data);

    return data;
  } catch (error) {
    return { status: "fail", data: error.toString() };
  }
};
export default ListOneJoinService;
