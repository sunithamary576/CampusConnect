import { useEffect, useState } from "react";
import FilePreview from "./FilePreview";

export default function Forum() {
  const [posts, setPosts] = useState([]);

  // =========================
  // CREATE POST STATES
  // =========================

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postFile, setPostFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // =========================
  // MESSAGE STATES
  // =========================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================
  // REPLY STATES
  // =========================

  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyFile, setReplyFile] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [replyLoading, setReplyLoading] = useState({});

  // =========================
  // LOAD FORUM POSTS
  // =========================

  const loadPosts = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/forum/posts",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts || []);
      } else {
        setMessage(
          data.message || "Unable to load forum posts."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Load posts when page opens
  useEffect(() => {
    loadPosts();
  }, []);

  // =========================
  // CREATE FORUM POST
  // =========================

  const createPost = async () => {
    if (!title.trim() || !content.trim()) {
      setMessage("Title and content are required.");
      setMessageType("error");
      return;
    }

    setPosting(true);
    setMessage("Creating post...");
    setMessageType("loading");

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("content", content.trim());

      // Add file only if selected
      if (postFile) {
        formData.append("file", postFile);
      }

      const response = await fetch(
        "http://localhost:5000/forum/posts",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Post created successfully.");
        setMessageType("success");

        // Clear form
        setTitle("");
        setContent("");
        setPostFile(null);

        // Reload posts
        await loadPosts();
      } else {
        setMessage(
          data.message || "Unable to create post."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setPosting(false);
    }
  };

  // =========================
  // LOAD REPLIES
  // =========================

  const loadReplies = async (postId) => {
    try {
      setReplyLoading((previous) => ({
        ...previous,
        [postId]: true,
      }));

      const response = await fetch(
        `http://localhost:5000/forum/posts/${postId}/replies`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setReplies((previous) => ({
          ...previous,
          [postId]: data.replies || [],
        }));
      } else {
        setMessage(
          data.message || "Unable to load replies."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setReplyLoading((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  };

  // =========================
  // SHOW / HIDE REPLIES
  // =========================

  const toggleReplies = (postId) => {
    const currentlyShowing = showReplies[postId];

    setShowReplies((previous) => ({
      ...previous,
      [postId]: !currentlyShowing,
    }));

    // Load replies when opening
    if (!currentlyShowing) {
      loadReplies(postId);
    }
  };

  // =========================
  // POST REPLY
  // =========================

  const postReply = async (postId) => {
    const text = replyText[postId] || "";
    const file = replyFile[postId] || null;

    if (!text.trim()) {
      setMessage("Reply cannot be empty.");
      setMessageType("error");
      return;
    }

    try {
      setReplyLoading((previous) => ({
        ...previous,
        [postId]: true,
      }));

      const formData = new FormData();

      formData.append("content", text.trim());

      // Add reply attachment if selected
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(
        `http://localhost:5000/forum/posts/${postId}/replies`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Reply posted successfully.");
        setMessageType("success");

        // Clear reply text
        setReplyText((previous) => ({
          ...previous,
          [postId]: "",
        }));

        // Clear reply file
        setReplyFile((previous) => ({
          ...previous,
          [postId]: null,
        }));

        // Reload replies
        await loadReplies(postId);

        // Keep replies visible
        setShowReplies((previous) => ({
          ...previous,
          [postId]: true,
        }));
      } else {
        setMessage(
          data.message || "Unable to post reply."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setReplyLoading((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  };

  // =========================
  // PAGE UI
  // =========================

  return (
    <div className="container py-4 pb-5">

      {/* =========================
          PAGE TITLE
      ========================= */}

      <div className="text-center mb-4">

        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3"
          style={{
            width: "58px",
            height: "58px",
            fontSize: "26px",
          }}
        >
          💬
        </div>

        <h1 className="fw-bold mb-2">
          Campus Forum
        </h1>

        <p className="text-muted mb-0">
          Ask questions, share ideas, and discuss with
          other students.
        </p>

      </div>

      {/* =========================
          GLOBAL MESSAGE
      ========================= */}

      {message && (
        <div
          className={`alert ${
            messageType === "success"
              ? "alert-success"
              : messageType === "error"
              ? "alert-danger"
              : "alert-secondary"
          }`}
        >
          {message}
        </div>
      )}

      {/* =========================
          CREATE POST
      ========================= */}

      <div className="card shadow-sm border-0 mb-5 overflow-hidden">

        <div className="card-body p-4">

          <div className="d-flex align-items-center mb-3">

            <div className="bg-primary-subtle text-primary rounded-3 p-2 me-3">
              ✏️
            </div>

            <div>

              <h4 className="fw-bold mb-0">
                Create a Discussion
              </h4>

              <small className="text-muted">
                Start a topic for your campus community
              </small>

            </div>

          </div>

          {/* TITLE */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Title
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter discussion title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* CONTENT */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Description
            </label>

            <textarea
              className="form-control"
              rows="4"
              placeholder="Write your question or discussion..."
              value={content}
              onChange={(e) =>
                setContent(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* POST ATTACHMENT */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Attachment (optional)
            </label>

            <input
              type="file"
              className="form-control"
              accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
              onChange={(e) => {
                setPostFile(
                  e.target.files[0] || null
                );
              }}
              disabled={posting}
            />

            <small className="text-muted">
              Max 3 MB • PNG, JPG, PDF, DOC, DOCX
            </small>

          </div>

          {/* SELECTED POST FILE */}

          {postFile && (
            <div className="alert alert-secondary">
              Selected file:{" "}
              <strong>{postFile.name}</strong>
            </div>
          )}

          {/* CREATE BUTTON */}

          <button
            className="btn btn-primary px-4"
            onClick={createPost}
            disabled={posting}
          >
            {posting
              ? "Posting..."
              : "Create Post"}
          </button>

        </div>

      </div>

      {/* =========================
          DISCUSSIONS HEADER
      ========================= */}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>

          <h3 className="fw-bold mb-1">
            Discussions
          </h3>

          <p className="text-muted small mb-0">
            Recent questions and conversations from students
          </p>

        </div>

        <span className="badge text-bg-light border">
          {posts.length}{" "}
          {posts.length === 1
            ? "discussion"
            : "discussions"}
        </span>

      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (

        <div className="text-center py-4">

          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="mt-2">
            Loading discussions...
          </p>

        </div>

      ) : posts.length === 0 ? (

        /* =========================
           NO POSTS
        ========================= */

        <div className="alert alert-info">
          No discussions yet. Be the first to create one!
        </div>

      ) : (

        /* =========================
           POSTS
        ========================= */

        posts.map((post) => (

          <div
            className="card shadow-sm border-0 mb-4 forum-post-card"
            key={post.id}
          >

            <div className="card-body p-4">

              {/* POST HEADER */}

              <div className="d-flex align-items-start justify-content-between gap-3">

                <div>

                  <h4 className="fw-bold mb-2">
                    {post.title}
                  </h4>

                  <div className="text-muted small">
                    👤 {post.user_name || "Student"}
                    {" • "}
                    {new Date(
                      post.created_at
                    ).toLocaleString()}
                  </div>

                </div>

                <span className="badge rounded-pill text-bg-light border">
                  Discussion
                </span>

              </div>

              {/* POST CONTENT */}

              <p
                className="mt-3 mb-3"
                style={{
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.content}
              </p>

              {/* POST ATTACHMENT */}

              {post.file_path && (
                <FilePreview
                  fileData={`http://localhost:5000/forum/files/${post.file_path}`}
                  fileName={post.file_name}
                />
              )}

              {/* REPLY BUTTON */}

              <button
                className="btn btn-outline-primary btn-sm px-3"
                onClick={() =>
                  toggleReplies(post.id)
                }
              >
                {showReplies[post.id]
                  ? "Hide Replies"
                  : "View Replies"}
              </button>

              {/* =========================
                  REPLIES SECTION
              ========================= */}

              {showReplies[post.id] && (

                <div className="mt-4">

                  <h6 className="fw-bold mb-3">
                    Replies
                  </h6>

                  {/* LOADING REPLIES */}

                  {replyLoading[post.id] &&
                  (!replies[post.id] ||
                    replies[post.id].length === 0) ? (

                    <div className="text-muted small">
                      Loading replies...
                    </div>

                  ) : replies[post.id] &&
                    replies[post.id].length > 0 ? (

                    /* REPLY LIST */

                    replies[post.id].map(
                      (reply) => (

                        <div
                          key={reply.id}
                          className="border rounded-3 p-3 mb-2 bg-light"
                        >

                          {/* REPLY USER */}

                          <div className="fw-semibold">
                            {reply.user_name}
                          </div>

                          {/* REPLY CONTENT */}

                          <div
                            className="mt-1"
                            style={{
                              whiteSpace:
                                "pre-wrap",
                            }}
                          >
                            {reply.content}
                          </div>

                          {/* REPLY ATTACHMENT */}

                          {reply.file_path && (
                            <FilePreview
                              fileData={`http://localhost:5000/forum/files/${reply.file_path}`}
                              fileName={
                                reply.file_name
                              }
                            />
                          )}

                          {/* REPLY DATE */}

                          <div className="text-muted small mt-2">
                            {new Date(
                              reply.created_at
                            ).toLocaleString()}
                          </div>

                        </div>

                      )
                    )

                  ) : (

                    <div className="text-muted small mb-3">
                      No replies yet. Be the first to reply!
                    </div>

                  )}

                  {/* =========================
                      WRITE REPLY
                  ========================= */}

                  <div className="mt-3">

                    <textarea
                      className="form-control mb-2"
                      rows="2"
                      placeholder="Write a reply..."
                      value={
                        replyText[post.id] || ""
                      }
                      onChange={(e) =>
                        setReplyText(
                          (previous) => ({
                            ...previous,
                            [post.id]:
                              e.target.value,
                          })
                        )
                      }
                      disabled={
                        replyLoading[post.id]
                      }
                    />

                    {/* REPLY FILE */}

                    <div className="mb-2">

                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                        onChange={(e) =>
                          setReplyFile(
                            (previous) => ({
                              ...previous,
                              [post.id]:
                                e.target.files[0] ||
                                null,
                            })
                          )
                        }
                        disabled={
                          replyLoading[post.id]
                        }
                      />

                      <small className="text-muted">
                        Max 3 MB • PNG, JPG, PDF, DOC, DOCX
                      </small>

                    </div>

                    {/* SELECTED REPLY FILE */}

                    {replyFile[post.id] && (
                      <div className="alert alert-secondary py-2">
                        Selected file:{" "}
                        <strong>
                          {replyFile[post.id].name}
                        </strong>
                      </div>
                    )}

                    {/* POST REPLY BUTTON */}

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        postReply(post.id)
                      }
                      disabled={
                        replyLoading[post.id]
                      }
                    >
                      {replyLoading[post.id]
                        ? "Posting..."
                        : "Post Reply"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </div>

        ))

      )}

    </div>
  );
}