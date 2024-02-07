const { Feed } = VM.require("devs.near/widget/Feed") || {
  Feed: () => <></>,
};

return (
    <Feed
      showCompose={true}
      index={{
        action: "hashtag",
        key: "memesforgood",
        options: {
          limit: 10,
          order: "desc",
        },
        cacheOptions: {
          ignoreCache: true,
        }
      }}
      Item={(p) => (
        <Widget
          loading={<div className="w-100" style={{ height: "200px" }} />}
          src="mob.near/widget/MainPage.N.Post"
          props={{ accountId: p.accountId, blockHeight: p.blockHeight }}
        />
      )}
    />
);
