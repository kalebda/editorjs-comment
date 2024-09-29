import { API, BlockTune, BlockAPI } from "@editorjs/editorjs";

export interface CommentBlockData {
  id: string;
  count: number;
}

export interface RenderBody {
  commentBlockId: string | null;
  blockId: string;
  state: boolean;
  onClose: () => void;
  addCommentBlockData: (data: CommentBlockData) => void;
  removeBlockComments: () => void;
}

export interface CommentConfig {
  activeColor?: string;
  renderBody: (params: RenderBody) => HTMLElement | any;
}

export default class Comment implements BlockTune {
  private api: API;
  private block: BlockAPI;
  private commentBlockId: string | null = null;
  private state: boolean = false;
  private renderBody: (params: RenderBody) => HTMLElement | any;
  private activeColor?: string;
  private static activePopup: string | null = null;

  static get isTune() {
    return true;
  }

  constructor({
    api,
    block,
    config,
  }: {
    api: API;
    block: BlockAPI;
    config?: CommentConfig;
  }) {
    this.api = api;
    this.block = block;
    this.renderBody = config?.renderBody || (() => null);
    this.activeColor = config?.activeColor;
  }

  render() {
    const wrapper = document.createElement("div");
    const button = document.createElement("button");
    button.classList.add(this.api.styles.settingsButton);
    button.classList.add("ce-comment-button"); // Add a custom class for styling
    button.innerHTML = this.toolboxIcon;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.api.toolbar.close(); // Close the settings menu
      this.toggleCommentPopup();
    });
    wrapper.appendChild(button);
    return wrapper;
  }

  save() {
    return {
      commentBlockId: this.commentBlockId,
      hasComments: this.state,
    };
  }

  toggleCommentPopup() {
    if (Comment.activePopup === this.block.id) {
      this.hideCommentPopup();
    } else {
      this.showCommentPopup();
    }
  }

  showCommentPopup() {
    if (Comment.activePopup) {
      const activeContainer = document.getElementById(
        `comment-container-${Comment.activePopup}`
      );
      if (activeContainer) {
        activeContainer.remove();
      }
    }

    const commentComponent = document.createElement("div");
    commentComponent.id = `comment-container-${this.block.id}`;
    document.body.appendChild(commentComponent);

    const response = this.renderBody({
      commentBlockId: this.commentBlockId,
      blockId: this.block.id,
      state: this.state,
      onClose: () => this.hideCommentPopup(),
      addCommentBlockData: (data: CommentBlockData) =>
        this.addCommentBlockData(data),
      removeBlockComments: () => this.removeBlockComments(),
    });

    if (response instanceof HTMLElement) {
      commentComponent.appendChild(response);
    } else {
      import("react-dom/client")
        .then(({ createRoot }) => {
          const root = createRoot(commentComponent);
          root.render(response);
        })
        .catch((err) => console.error("Error rendering React component:", err));
    }

    this.setActiveClass();
    Comment.activePopup = this.block.id;
  }

  hideCommentPopup() {
    const commentContainer = document.getElementById(
      `comment-container-${this.block.id}`
    );
    if (commentContainer) {
      commentContainer.remove();
    }
    this.removeActiveClass();
    Comment.activePopup = null;
  }

  addCommentBlockData(data: CommentBlockData) {
    this.commentBlockId = data.id;
    this.state = data.count > 0;
    this.block.holder.classList.toggle("has-comment", this.state);
  }

  removeBlockComments() {
    this.commentBlockId = null;
    this.state = false;
    this.block.holder.classList.remove("has-comment");
  }

  setActiveClass() {
    this.block.holder.classList.add("comment-active");
    if (this.activeColor) {
      this.block.holder.style.borderColor = this.activeColor;
    }
  }

  removeActiveClass() {
    this.block.holder.classList.remove("comment-active");
    this.block.holder.style.borderColor = "";
  }

  get toolboxIcon() {
    return `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 0H2C0.9 0 0 0.9 0 2V20L4 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 14H3.2L2 15.2V2H18V14Z"/>
      <path d="M10 7H5V5H10V7Z"/>
      <path d="M15 11H5V9H15V11Z"/>
    </svg>`;
  }
}
