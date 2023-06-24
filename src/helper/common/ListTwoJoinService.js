const ListTwoJoinService = async (
  match,
  DataModel,
  JoinStage1,
  JoinStage2,
  projection
) => {
  try {
    let data;
    data = await DataModel.aggregate([
      match,
      JoinStage1,
      JoinStage2,
      projection,
    ]);

    return data;
  } catch (error) {
    return { status: "fail", data: error.toString() };
  }
};
export default ListTwoJoinService;
